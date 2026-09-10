# Babke - nginx vhost install runbook

Host nginx on **185.172.57.237** (Ubuntu 24.04) is **not** containerized and owns
80/443 for roughly **20 other production projects**. Every step below is written
so that a mistake fails *before* a reload rather than after one. Read the whole
file once before typing anything.

---

## 0. What is in this directory

| file | server_name | surface |
|---|---|---|
| `babke-landing.nip.conf` | `babke.185.172.57.237.nip.io` | storefront (interim) |
| `babke-admin.nip.conf`   | `admin-babke.185.172.57.237.nip.io` | admin SPA (interim) |
| `babke-api.nip.conf`     | `api-babke.185.172.57.237.nip.io` | JSON API only (interim) |
| `babke.tn.conf`          | `babke.tn www.babke.tn` | storefront (final) |
| `admin.babke.tn.conf`    | `admin.babke.tn` | admin SPA (final) |
| `api.babke.tn.conf`      | `api.babke.tn` | JSON API only (final) |

All six `proxy_pass http://127.0.0.1:4050` - the one app container. Mongo
publishes nothing. This is **Design A**: each vhost proxies `/api/*` itself, so
all 39 frontend network calls (every one of them root-relative; there is no
`API_BASE` in the codebase) stay same-origin. No CORS, no preflight.

### These files are plain HTTP on purpose

There is **no `listen` directive** in any of them. nginx implicitly binds `*:80`
for a server block that declares none, and `certbot --nginx` rewrites each file
**in place** to add the 443 listen, `ssl_certificate` / `ssl_certificate_key`,
the `options-ssl-nginx.conf` include, `ssl_dhparam`, and a second `server{}`
that redirects 80 -> 443.

Three things that will break the box if you add them:

* **`http2` on a listen line** - `00-catch-all.conf` sorts first and already
  declares `listen 443 ssl http2 default_server` on `0.0.0.0:443` and `[::]:443`.
  A repeat produces `protocol options redefined` warnings on every reload.
* **`default_server`** - `00-catch-all` owns it on all four sockets. A duplicate
  makes **nginx refuse to start**, which takes every other site on the box down.
* **`include snippets/...` / `include proxy_params;` / an `upstream {}` block** -
  zero vhosts on this box use includes. Everything is inline here to match.

---

## 1. Baseline: record the warning count BEFORE you touch anything

`nginx -t` on this box is **not silent**. It emits exactly **7 pre-existing
warnings** from the other projects. That number is the control: after installing
your files it must still be 7. An 8th warning means one of your files introduced
it - fix the file, do not reload.

```bash
sudo nginx -t 2>&1 | tee /tmp/nginx-baseline.txt
sudo nginx -t 2>&1 | grep -c '\[warn\]'      # must print: 7
```

Keep `/tmp/nginx-baseline.txt`. You will diff against it in step 4.

---

## 2. Copy the files up (one surface at a time)

From your workstation, in the repo root. Interim nip.io set first - do **not**
install the `.tn` files yet, their DNS does not exist and certbot would fail.

```bash
scp deploy/nginx/babke-landing.nip.conf \
    deploy/nginx/babke-admin.nip.conf \
    deploy/nginx/babke-api.nip.conf \
    root@185.172.57.237:/etc/nginx/sites-available/
```

Confirm ownership and mode on the server:

```bash
sudo chown root:root /etc/nginx/sites-available/babke-*.nip.conf
sudo chmod 644       /etc/nginx/sites-available/babke-*.nip.conf
```

---

## 3. Symlink into sites-enabled - identical basename

The basename **must** match. certbot resolves the symlink and edits the file in
`sites-available`; a renamed link makes later `certbot --nginx` runs and the
renewal reload confusing to audit.

```bash
sudo ln -s /etc/nginx/sites-available/babke-landing.nip.conf /etc/nginx/sites-enabled/babke-landing.nip.conf
sudo ln -s /etc/nginx/sites-available/babke-admin.nip.conf   /etc/nginx/sites-enabled/babke-admin.nip.conf
sudo ln -s /etc/nginx/sites-available/babke-api.nip.conf     /etc/nginx/sites-enabled/babke-api.nip.conf

ls -l /etc/nginx/sites-enabled/ | grep babke
```

---

## 4. `nginx -t`, then compare the warning count

```bash
sudo nginx -t 2>&1 | tee /tmp/nginx-after.txt
sudo nginx -t 2>&1 | grep -c '\[warn\]'      # must STILL print: 7
diff /tmp/nginx-baseline.txt /tmp/nginx-after.txt
```

* `syntax is ok` + `test is successful` + **7** warnings -> proceed.
* **8 or more warnings** -> `diff` shows the new one. Almost always `http2` or a
  duplicated directive. Fix the file in `sites-available`, re-test. Do **not**
  reload with an unexplained new warning.
* `test failed` -> `sudo rm` the three symlinks, re-test to confirm you are back
  at baseline, then fix. Never reload after a failed test.

---

## 5. Reload (never restart)

```bash
sudo systemctl reload nginx
sudo systemctl status nginx --no-pager
```

`reload` re-execs workers gracefully. `restart` drops every in-flight connection
on all ~20 sites, including anyone else's uploads. There is no reason to restart.

Smoke-test over plain HTTP before certbot:

```bash
curl -sI http://babke.185.172.57.237.nip.io/            # 200, from the app
curl -sI http://admin-babke.185.172.57.237.nip.io/      # 301 -> /admin/index.html
curl -sI http://api-babke.185.172.57.237.nip.io/        # 404 (by design)
curl -s  http://api-babke.185.172.57.237.nip.io/api/menu | head -c 200
```

---

## 6. THEN certbot

Only after a clean `nginx -t` and a successful reload. Environment on this box:

* certbot **2.9.0**, installed from apt, with `python3-certbot-nginx`
* `key_type = ecdsa`
* `certbot.timer` is **active** (systemd, twice daily, randomized)
* **all three renewal-hooks directories are EMPTY**
  (`/etc/letsencrypt/renewal-hooks/{pre,deploy,post}/`)

That last point matters: **renewal depends entirely on the nginx installer
plugin reloading nginx.** Nothing in a hooks directory will do it for you. Each
`renewal.conf` written by these commands records `installer = nginx`; if anyone
later edits that to `installer = None`, certificates will renew on disk and
nginx will keep serving the expired ones until someone notices.

### Interim - nip.io hostnames

One cert per hostname, each with an explicit `--cert-name` so the lineage is
easy to find and delete at cutover.

```bash
sudo certbot --nginx \
  -d babke.185.172.57.237.nip.io \
  --cert-name babke-landing-nip \
  --key-type ecdsa --redirect \
  --agree-tos -m <ops-email> --no-eff-email

sudo certbot --nginx \
  -d admin-babke.185.172.57.237.nip.io \
  --cert-name babke-admin-nip \
  --key-type ecdsa --redirect \
  --agree-tos -m <ops-email> --no-eff-email

sudo certbot --nginx \
  -d api-babke.185.172.57.237.nip.io \
  --cert-name babke-api-nip \
  --key-type ecdsa --redirect \
  --agree-tos -m <ops-email> --no-eff-email
```

`--redirect` is what makes certbot write the second `server{}` block for
80 -> 443. Replace `<ops-email>` with the real address; never commit it here.

**nip.io caveat:** `nip.io` is on the Public Suffix List, so each
`<label>.<ip>.nip.io` is its own registrable domain for rate-limiting purposes -
the three certs above do not compete for one bucket. The wider Let's Encrypt
limits still apply (5 duplicate certificates per week for an identical name set),
so do not loop these commands while debugging. Use `--dry-run` to rehearse.

### Final - babke.tn hostnames

Run these only after the DNS check in the cutover section.

```bash
sudo certbot --nginx \
  -d babke.tn -d www.babke.tn \
  --cert-name babke.tn \
  --key-type ecdsa --redirect \
  --agree-tos -m <ops-email> --no-eff-email

sudo certbot --nginx \
  -d admin.babke.tn \
  --cert-name admin.babke.tn \
  --key-type ecdsa --redirect \
  --agree-tos -m <ops-email> --no-eff-email

sudo certbot --nginx \
  -d api.babke.tn \
  --cert-name api.babke.tn \
  --key-type ecdsa --redirect \
  --agree-tos -m <ops-email> --no-eff-email
```

Apex and `www` go in **one** cert (one `--cert-name babke.tn`, two `-d` flags)
because they live in one `server{}` block.

### After every certbot run

```bash
sudo nginx -t 2>&1 | grep -c '\[warn\]'   # still 7 - certbot must not add one
sudo certbot certificates                 # expiry + the domains on each lineage
sudo certbot renew --dry-run              # exercises the real renewal path
```

`certbot renew --dry-run` is the only thing that actually proves the installer
plugin can still reload nginx. Run it once now, and again any time these vhosts
are edited.

---

## 7. Post-certbot: the server copy has diverged

certbot has now rewritten the installed files. **The copies in
`deploy/nginx/` are no longer identical to what is on the server.** Do not
`scp` them over the top of a live vhost - that silently strips the TLS config
and the next reload serves plain HTTP, or fails.

To change a vhost after issuance, either:

* edit the file on the server in place (inside the existing `server{}` blocks),
  re-run the step 4 warning-count check, then reload; **or**
* replace the file with the repo version and immediately re-run the matching
  `certbot --nginx` command to re-install the TLS directives.

Keep the repo copy updated by hand when you make a server-side change, so the
two never drift far.

---

## Cutover: nip.io -> babke.tn

1. **DNS first.** Create A records for `babke.tn`, `www.babke.tn`,
   `admin.babke.tn`, `api.babke.tn` -> `185.172.57.237`. Wait for propagation
   and verify from the VPS itself:

   ```bash
   for h in babke.tn www.babke.tn admin.babke.tn api.babke.tn; do
     echo -n "$h -> "; dig +short "$h" A
   done
   ```

   Every line must show `185.172.57.237`. certbot's HTTP-01 challenge will fail
   otherwise, and a failed run still counts against the rate limit.

2. **Install the three `.tn` files** exactly as in steps 2-5: scp into
   `sites-available`, symlink with identical basenames, `nginx -t`, confirm the
   warning count is still **7**, reload. They are plain HTTP at this point and
   coexist with the nip.io vhosts - the server names differ, so there is no
   conflict and no downtime.

3. **Smoke-test over HTTP** before issuing certificates:

   ```bash
   curl -sI http://babke.tn/                 # 200
   curl -sI http://admin.babke.tn/           # 301 -> /admin/index.html
   curl -sI http://api.babke.tn/             # 404
   curl -s  http://api.babke.tn/api/menu | head -c 200
   ```

4. **Run the three final certbot commands** from section 6.

5. **Verify HTTPS on the real names**, in particular the two things most likely
   to be wrong:

   ```bash
   # the admin 301 must survive TLS and land on /admin/index.html
   curl -sI https://admin.babke.tn/ | grep -i '^location'

   # SSE must stream, not buffer: this should print events, not hang then dump
   curl -N -s https://babke.tn/api/sse | head -5

   # upload ceiling: a ~5MB body must not 413
   head -c 5000000 /dev/zero | base64 > /tmp/big.txt
   curl -s -o /dev/null -w '%{http_code}\n' -X POST https://api.babke.tn/api/menu \
     -H 'Content-Type: application/json' \
     --data-binary @/tmp/big.txt          # anything but 413
   ```

6. **Grace period.** Leave the nip.io vhosts enabled for a few days in case
   something still references them.

7. **Retire the interim hostnames**, once nothing hits their access logs:

   ```bash
   sudo tail -100 /var/log/nginx/babke-landing.nip.access.log   # confirm quiet
   sudo rm /etc/nginx/sites-enabled/babke-landing.nip.conf
   sudo rm /etc/nginx/sites-enabled/babke-admin.nip.conf
   sudo rm /etc/nginx/sites-enabled/babke-api.nip.conf
   sudo nginx -t 2>&1 | grep -c '\[warn\]'    # still 7
   sudo systemctl reload nginx

   sudo certbot delete --cert-name babke-landing-nip
   sudo certbot delete --cert-name babke-admin-nip
   sudo certbot delete --cert-name babke-api-nip
   ```

   Deleting the lineages stops `certbot.timer` from trying to renew names you no
   longer serve, which would otherwise produce recurring failure mail. Leave the
   files in `sites-available` (harmless, and useful if you need the interim
   hostnames again).

---

## Troubleshooting

**`nginx -t` fails with `duplicate default server`** - something in a Babke file
grew a `default_server`. Remove it. `00-catch-all` owns it.

**A new `protocol options redefined` warning** - something grew `http2` on a
listen line. Remove it; `00-catch-all` already sets it for 443.

**certbot says it cannot find a `server{}` block for the domain** - it matched no
vhost by `server_name`. Check the symlink exists, the basename matches, and that
you reloaded after step 5. If certbot still declines to install into a vhost that
declares no `listen` at all, add a bare `listen 80;` (**and nothing else** - no
`default_server`, no `http2`, no `ssl`) to that one `server{}` block, re-run the
step 4 warning check, reload, and retry certbot.

**Admin dashboard loads a blank page** - the bare `/` was served by a rewrite or a
`proxy_pass` instead of the `301`. `admin/index.html` mixes `../styles/admin.css`,
`../config/settings.js` and `../data/store.js` with a non-prefixed
`<script defer src="admin.js">`. Anything that keeps the document URL at `/`
makes the browser fetch `/admin.js`, which the app's catch-all answers with
`index.html`; the MIME refusal is silent and the SPA never boots. It must stay
`location = / { return 301 /admin/index.html; }`.

**SSE connects then dies after one message** - `proxy_http_version 1.1` is missing
from that location, or `Connection` is set to `upgrade` instead of `""`, or
`text/event-stream` crept into `gzip_types`. All three produce the same symptom.

**Uploads 413** - `client_max_body_size 60M;` is missing from that vhost. There is
no http-level default on this box to fall back on.

**Everything 502s** - the app container is not up or not publishing on
`127.0.0.1:4050`. Check `docker compose -p babke ps` and
`curl -sI http://127.0.0.1:4050/` on the VPS itself. Nothing in nginx will fix a
502; nginx is only the front door.
