# Babke — VPS deployment runbook

Operator reference for `185.172.57.237` (Ubuntu 24.04, **shared box, ~20 other
production tenants**). Read the two safety rules before touching anything.

---

## 0. Safety rules

**Never run `docker compose down` on this box.** `down` removes the network and,
with the wrong flag, the volume. On a shared daemon a stray `down` has blast
radius beyond this stack. To restart or update one service:

```bash
$COMPOSE up -d --no-deps api
```

`--no-deps` stops compose from touching `mongo` while it recreates `api`.

**Secrets and the compose file live outside the replaceable source tree.**

```
/opt/babke/
├── .env                  # secrets, chmod 600, NEVER in git, NEVER deleted
├── docker-compose.yml    # this stack, copied from src/deploy/, NEVER deleted
├── backups/              # mongodump archives
└── src/                  # the git checkout — wipe and re-clone at will
    └── deploy/           # the versioned templates these two were copied from
```

A redeploy replaces `src/` only. Nothing a redeploy does can destroy `.env`.

---

## 1. The COMPOSE pin

Every invocation in this document goes through one pinned command. Set it once
per shell. Never call bare `docker compose` — without `-p` you get a project
name derived from the current directory, and compose will happily build a
*second*, orphaned copy of the stack.

```bash
COMPOSE="docker compose -p babke --env-file /opt/babke/.env -f /opt/babke/docker-compose.yml"
```

Put it in `/root/.bashrc` so it survives reconnects.

Sanity check (read-only — but its output contains **decrypted secrets**, so
never paste it anywhere):

```bash
$COMPOSE config --quiet && echo "compose file OK, all env vars resolve"
```

`--quiet` prints nothing on success and names the first missing `${VAR:?}` on
failure. That is the intended way to check `.env` before a deploy.

---

## 2. Architecture in one paragraph

One app container and one dedicated mongo container, project `babke`. The app
publishes **only** `127.0.0.1:4050 -> 4000`; mongo publishes nothing and is
reachable solely over the stack's private bridge network as hostname `mongo`.
Host nginx (not containerized) owns 80/443 and proxies all three vhosts —
landing, admin, api — to the same `127.0.0.1:4050`, each proxying `/api/*`
itself so every frontend fetch stays same-origin. Container memory is capped
(512m app, 1g mongo) because the box is 7.8 GiB with ~983 MiB of swap already in
use; an uncapped container here is an outage for other tenants.

Container names are compose defaults: **`babke-api-1`**, **`babke-mongo-1`**.
The mongo volume is **`babke_mongo-data`** (project prefix + volume name).

### Build context

`docker-compose.yml` sits at `/opt/babke/docker-compose.yml`, so compose's
project directory is `/opt/babke` and the build context `./src` resolves to
`/opt/babke/src`. The Dockerfile is expected at `/opt/babke/src/Dockerfile`.
If you ever move the compose file, fix the context in the same commit.

---

## 3. First-time provisioning

```bash
# 3.1 — layout
mkdir -p /opt/babke/backups
cd /opt/babke

# 3.2 — source tree
git clone <repo-url> /opt/babke/src
cd /opt/babke/src && git rev-parse --short HEAD    # note this: your rollback target

# 3.3 — compose file OUT of the source tree
cp /opt/babke/src/deploy/docker-compose.yml /opt/babke/docker-compose.yml

# 3.4 — secrets OUT of the source tree
cp /opt/babke/src/deploy/.env.example /opt/babke/.env
chmod 600 /opt/babke/.env
chown root:root /opt/babke/.env

# 3.5 — generate real values, one per secret, straight into the file
openssl rand -hex 32     # repeat per secret; paste into /opt/babke/.env
$EDITOR /opt/babke/.env  # every value must differ from its placeholder

# 3.6 — pin the command
COMPOSE="docker compose -p babke --env-file /opt/babke/.env -f /opt/babke/docker-compose.yml"

# 3.7 — verify every ${VAR:?} resolves BEFORE building
$COMPOSE config --quiet && echo OK

# 3.8 — build and start
$COMPOSE up -d --build

# 3.9 — watch mongo go healthy, then the app connect
$COMPOSE ps
$COMPOSE logs -f api
```

`mongo:7` is already on the box, so only the app image builds.

Expect in the `api` log: `Successfully connected to MongoDB at mongodb://...`
followed by the seed routine. First boot seeds the database.

```bash
# 3.10 — prove the app answers on loopback before wiring nginx
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4050/
```

Then configure the three host nginx vhosts and issue certs. That is a separate
file and a separate step — nothing in this stack touches 80/443.

> **First-boot-only note.** `MONGO_INITDB_ROOT_USERNAME` / `_PASSWORD` create the
> root user **only against an empty `babke_mongo-data` volume**. Get them right
> the first time. See §7 for rotation after the fact.

---

## 4. Redeploy (the normal path)

Code changed, secrets did not.

```bash
cd /opt/babke/src
git rev-parse --short HEAD          # WRITE THIS DOWN — it is your rollback target
git pull --ff-only

# did the compose file itself change upstream?
diff -u /opt/babke/docker-compose.yml /opt/babke/src/deploy/docker-compose.yml \
  && echo "compose unchanged" \
  || cp /opt/babke/src/deploy/docker-compose.yml /opt/babke/docker-compose.yml

# new variables added to the template since the last deploy?
diff <(grep -oE '^[A-Z_]+' /opt/babke/src/deploy/.env.example | sort -u) \
     <(grep -oE '^[A-Z_]+' /opt/babke/.env | sort -u)
# anything listed as only-in-example must be added to /opt/babke/.env now

$COMPOSE config --quiet || echo "FIX .env FIRST — DO NOT DEPLOY"

# tag the currently-running image so rollback needs no rebuild
docker tag babke-api:latest babke-api:prev-$(date +%Y%m%d-%H%M)

$COMPOSE up -d --build --no-deps api
$COMPOSE ps
$COMPOSE logs --tail=100 api
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4050/
```

`--no-deps` is the important flag: mongo keeps running untouched, so there is no
data-layer restart and no window where the database is unavailable.

**Secrets changed but code did not** — no rebuild needed, just recreate:

```bash
$EDITOR /opt/babke/.env
$COMPOSE config --quiet && $COMPOSE up -d --no-deps --force-recreate api
```

Environment is baked into the container at create time, so editing `.env` alone
changes nothing until the container is recreated.

---

## 5. Logs

```bash
$COMPOSE logs -f api                    # follow the app
$COMPOSE logs --tail=200 api            # last 200 lines
$COMPOSE logs --since=30m api           # last half hour
$COMPOSE logs --tail=50 mongo           # database
$COMPOSE ps                             # state + health of both containers
docker stats --no-stream babke-api-1 babke-mongo-1   # memory against the caps
```

Logs are capped at 10 MB x 3 files per container by the `x-logging` anchor.
Twelve stacks share one disk; do not remove the cap. If you need history beyond
that window, ship it off the box — do not raise the limit.

Health of the database specifically:

```bash
docker inspect --format '{{.State.Health.Status}}' babke-mongo-1
```

---

## 6. Backup and restore

### 6.1 Logical backup (preferred — hot, no downtime)

Credentials are read from inside the container, so no secret appears in your
shell history or in `ps`.

```bash
mkdir -p /opt/babke/backups
docker exec babke-mongo-1 sh -c \
  'mongodump --username "$MONGO_INITDB_ROOT_USERNAME" \
             --password "$MONGO_INITDB_ROOT_PASSWORD" \
             --authenticationDatabase admin \
             --db babke --archive --gzip' \
  > /opt/babke/backups/babke-$(date +%F-%H%M).archive.gz

ls -lh /opt/babke/backups/
```

A zero-byte or few-hundred-byte archive means the dump failed — check the exit
status, do not assume success. Menu and gallery images are base64 data URIs
stored inside the documents, so these archives are large; watch disk usage and
prune old ones.

Nightly, via root's crontab (note `%` must be escaped as `\%` in crontab):

```
17 3 * * * docker exec babke-mongo-1 sh -c 'mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --db babke --archive --gzip' > /opt/babke/backups/babke-$(date +\%F).archive.gz 2>>/opt/babke/backups/dump.err
30 3 * * * find /opt/babke/backups -name 'babke-*.archive.gz' -mtime +14 -delete
```

### 6.2 Restore a logical backup

`--drop` replaces each restored collection. Destructive — take a fresh dump
first, and confirm which archive you are restoring.

```bash
docker exec -i babke-mongo-1 sh -c \
  'mongorestore --username "$MONGO_INITDB_ROOT_USERNAME" \
                --password "$MONGO_INITDB_ROOT_PASSWORD" \
                --authenticationDatabase admin \
                --archive --gzip --drop' \
  < /opt/babke/backups/babke-2026-01-01-0300.archive.gz

$COMPOSE up -d --no-deps --force-recreate api    # clear stale in-process state
```

### 6.3 Volume snapshot (cold — for migrations and version upgrades)

A file-level copy of `/data/db` is only consistent if mongod is stopped. Stop
**only** the two containers of this stack; never `down`.

```bash
$COMPOSE stop api mongo

docker run --rm \
  -v babke_mongo-data:/data:ro \
  -v /opt/babke/backups:/backup \
  alpine tar czf /backup/mongo-data-$(date +%F).tar.gz -C /data .

$COMPOSE start mongo && $COMPOSE start api
```

Restore into a fresh empty volume:

```bash
$COMPOSE stop api mongo
docker volume rm babke_mongo-data          # ONLY after confirming the tarball is good
docker volume create babke_mongo-data
docker run --rm \
  -v babke_mongo-data:/data \
  -v /opt/babke/backups:/backup \
  alpine sh -c 'cd /data && tar xzf /backup/mongo-data-2026-01-01.tar.gz'
$COMPOSE up -d
```

---

## 7. Rotating secrets

* **`SESSION_SECRET`, any role password, `ALLOWED_ORIGINS`** — edit
  `/opt/babke/.env`, then `$COMPOSE up -d --no-deps --force-recreate api`.
  Rotating `SESSION_SECRET` logs out every admin session immediately.
* **`MONGO_ROOT_PASSWORD`** — the `MONGO_INITDB_*` variables are ignored on a
  non-empty volume, so editing `.env` alone breaks the app's connection string
  while the database keeps the old password. Change it inside mongo first,
  then update `.env` to match, then recreate `api`:

  ```bash
  docker exec -it babke-mongo-1 mongosh --quiet \
    -u '<current-user>' -p --authenticationDatabase admin \
    --eval 'db.getSiblingDB("admin").changeUserPassword("<user>","<new>")'
  $EDITOR /opt/babke/.env
  $COMPOSE up -d --no-deps --force-recreate api
  ```

---

## 8. Rollback

Ordered cheapest-first. Pick the first one that fits the failure.

**8.1 — Bad image, database untouched (the common case).** The previous image is
still on the box if you tagged it in §4:

```bash
docker image ls | grep babke-api          # find your prev-YYYYMMDD-HHMM tag
docker tag babke-api:prev-20260101-1200 babke-api:latest
$COMPOSE up -d --no-deps api
$COMPOSE logs --tail=100 api
```

**8.2 — Rebuild from the previous commit.** Slower, always available:

```bash
cd /opt/babke/src
git log --oneline -10
git checkout <previous-good-sha>
$COMPOSE up -d --build --no-deps api
$COMPOSE logs --tail=100 api
```

This leaves the tree detached; once the fix is on `main`,
`git checkout main && git pull --ff-only` and redeploy normally.

**8.3 — Bad config.** `.env` and `/opt/babke/docker-compose.yml` live outside
`src/`, so a bad edit to either is fixed in place — restore your copy or re-copy
the template from `src/deploy/` — then
`$COMPOSE config --quiet && $COMPOSE up -d --no-deps api`.

**8.4 — Bad data.** Restore per §6.2. Take a dump of the current broken state
first; you only get to make that decision once.

**8.5 — Total stack restart.** Still not `down`:

```bash
$COMPOSE restart mongo
$COMPOSE restart api
# or, if a container needs recreating:
$COMPOSE up -d --force-recreate
```

---

## 9. Troubleshooting

| Symptom | Check |
|---|---|
| `required variable X is missing a value` | `/opt/babke/.env` — a `${VAR:?}` is unset. Add it; do not delete the `:?`. |
| `api` restart-loops at boot | `$COMPOSE logs api`. Mongo healthy but auth failing means `MONGO_ROOT_*` in `.env` disagrees with what the volume was initialised with (§7). |
| `mongo` never becomes healthy | `$COMPOSE logs mongo`. Usually a corrupt or half-initialised `babke_mongo-data`. |
| `api` starts, waits, then errors | `depends_on: service_healthy` only proves mongod answers `ping`. server.js has its own retry loop, so a persistent failure is credentials or the URI, not timing. |
| nginx 502 | `curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4050/`. If that answers, the fault is in the host vhost, not this stack. |
| Container OOM-killed | `docker stats --no-stream babke-api-1`. The 512m/1g caps are deliberate — raising them is a decision about the other ~20 tenants, not a quick fix. |

**Do not** run `docker system prune -a` on this box. It deletes images belonging
to every other project on the daemon. To reclaim space from this stack only:

```bash
docker image ls | grep babke-api          # then remove specific old prev-* tags
docker image rm babke-api:prev-<old-tag>
```

---

## 10. Notes for the next person

* `ALLOWED_ORIGINS` is plumbed through the compose file and required by `.env`.
  At the time this runbook was written `server.js` still called
  `cors({ origin: true, credentials: true })` and did not read the variable.
  Confirm the app actually consumes it before treating it as an enforced
  control; until then it is documentation, not a boundary.
* There is no uploads volume and no bind mount, by design: `multer` is not a
  dependency and images are base64 data URIs inside Mongo documents. All
  persistent state is in `babke_mongo-data` — backing up that volume backs up
  everything.
* `express.json({ limit: '50mb' })` is what makes those data URIs work. If image
  uploads start failing with 413, check the host nginx `client_max_body_size`
  too — the app limit is only half the path.
* Switching from the interim `nip.io` hostnames to `babke.tn` is an `.env` edit
  (`ALLOWED_ORIGINS`) plus a host nginx `server_name` change plus new certs.
  Nothing in `docker-compose.yml` changes.
