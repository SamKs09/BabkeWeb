# BabkeWeb — production image
#
# Single Express 4 monolith: server.js serves the landing page, the admin SPA
# and the JSON API from one process. There is no build step and no bundler,
# so the "build" here is only dependency installation.
#
# Base: node:22-alpine.
#   - mongoose 8.24.1 floors at node >=16.20.1 (see package-lock.json, the bson
#     entry); nothing in the tree needs higher, so 22 LTS is comfortably ahead.
#   - The dependency tree is 100% pure JavaScript: zero packages declare
#     hasInstallScript and there is not a single *.node binary, so alpine needs
#     no build-base / python3 toolchain.
#   - full-icu is REQUIRED: server.js:245 formats audit-log timestamps with
#     toLocaleDateString('fr-FR') + toLocaleTimeString('fr-FR'). On a small-icu
#     build those calls do not throw, they silently fall back to en-US and write
#     "1/15/2024 12:00:00 PM" into the audit log instead of "15/01/2024 12:00:00".
#     The runtime stage asserts this at build time rather than trusting it.


# ---------------------------------------------------------------------------
# Stage 1 — deps: resolve node_modules from the lockfile, nothing else.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps

WORKDIR /app

# Only the manifests, so this layer is cached until dependencies actually change.
COPY package.json package-lock.json ./

# --omit=dev   : package.json currently declares no devDependencies; this keeps
#                that true if any are added later.
# --ignore-scripts : supply-chain hardening. Verified safe — `hasInstallScript`
#                appears 0 times in package-lock.json, so no dependency needs a
#                pre/post-install hook to function.
# No cache cleanup needed: this stage is discarded, only node_modules is copied
# forward, so npm's cache never reaches the shipped image.
RUN npm ci --omit=dev --ignore-scripts


# ---------------------------------------------------------------------------
# Stage 2 — runtime
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime

# PORT is not cosmetic: server.js:19 reads `process.env.PORT || 65342`, so
# without this the process would listen on 65342 and never answer on 4000.
# app.listen(PORT) at server.js:1541 passes no host, so it binds 0.0.0.0 and is
# reachable from the published 127.0.0.1:4050 mapping.
ENV NODE_ENV=production \
    PORT=4000

WORKDIR /app

COPY --from=deps --chown=node:node /app/node_modules ./node_modules

# Explicit allowlist — NEVER `COPY . .`.
# server.js:1533 does `app.use(express.static(__dirname))`, which serves the
# entire application root over HTTP. Anything copied in here is publicly
# downloadable, so the image gets only what the app actually needs at runtime.
# Verified against server.js requires, index.html and admin/index.html refs:
#   data/    — required(): server.js:270 and :626 -> ./data/defaultData.js
#   config/  — <script> in index.html and admin/index.html -> config/settings.js
#   assets/  — images, incl. ../assets/logo.png used by the admin SPA
#   styles/  — main.css, chatbot.css, admin.css
#   scripts/ — app.js, cart.js, chatbot.js, embers.js, hero-spin.js,
#              preloader.js, translations.js (mongo_runner.js is stripped by
#              .dockerignore and must never be present here)
#   components/ — cartDrawer.js, foodChatbot.js, reservationForm.js
#   admin/   — the admin SPA (index.html + admin.js)
# Deliberately absent: pages/ (holds only readme.md), and .env, which must be
# injected by compose at run time.
COPY --chown=node:node server.js package.json index.html ./
COPY --chown=node:node admin/      ./admin/
COPY --chown=node:node assets/     ./assets/
COPY --chown=node:node styles/     ./styles/
COPY --chown=node:node scripts/    ./scripts/
COPY --chown=node:node components/ ./components/
COPY --chown=node:node data/       ./data/
COPY --chown=node:node config/     ./config/

# Build gate for full-icu. Fails the build loudly instead of shipping an image
# that writes silently anglicised French timestamps. TZ is pinned inline for a
# deterministic result; it is not exported, so the container still runs UTC.
RUN TZ=UTC node -e "const d=new Date('2024-01-15T12:00:00Z');const s=d.toLocaleDateString('fr-FR')+' '+d.toLocaleTimeString('fr-FR');if(s!=='15/01/2024 12:00:00'){console.error('FATAL: base image lacks full ICU. fr-FR formatting resolved to '+JSON.stringify(s)+' (expected \"15/01/2024 12:00:00\"). server.js:245 would write anglicised audit-log timestamps. Do not use a small-icu base image.');process.exit(1)}console.log('full-icu OK, fr-FR -> '+s)"

# Timezone data. alpine ships NO tzdata, so `TZ=Africa/Tunis` from compose would
# be a silent no-op and the container would stay on UTC. server.js writes audit
# timestamps with toLocaleDateString('fr-FR') and computes leftover dates from
# getFullYear()/getMonth()/getDate(), so on UTC every entry between 23:00 and
# 00:00 Hammam Sousse time lands on the previous day. ~2 MB, and it is the only
# thing that makes the compose TZ setting real.
RUN apk add --no-cache tzdata

# Assert the timezone database actually resolves Africa/Tunis (UTC+1, no DST),
# so a future base-image change cannot silently revert the container to UTC.
RUN TZ=Africa/Tunis node -e "const h=new Date('2024-01-15T12:00:00Z').toLocaleTimeString('fr-FR');if(h!=='13:00:00'){console.error('FATAL: tzdata missing or Africa/Tunis unresolved. 12:00Z rendered as '+JSON.stringify(h)+' (expected \"13:00:00\"). Audit-log timestamps would be written in UTC.');process.exit(1)}console.log('tzdata OK, Africa/Tunis -> '+h)"

# Built-in unprivileged user from the official image (uid/gid 1000).
# /app itself stays root-owned: the app never requires 'fs' and performs no disk
# writes, so it has no reason to be able to modify its own code.
USER node

EXPOSE 4000

# Plain node probe — alpine ships neither curl nor wget, and installing one only
# to poll a health endpoint would add a package for no reason.
# /healthz returns 200 when Mongo is connected and 503 otherwise, so a Mongo
# outage correctly marks the container unhealthy.
# The 4s socket timeout fires just inside the 5s HEALTHCHECK timeout, so a hung
# response exits 1 cleanly rather than being killed by the daemon.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD ["node","-e","const r=require('http').get({host:'127.0.0.1',port:process.env.PORT||4000,path:'/healthz',timeout:4000},s=>{s.resume();process.exit(s.statusCode===200?0:1)});r.on('timeout',()=>r.destroy());r.on('error',()=>process.exit(1))"]

# No tini/dumb-init: compose sets `init: true`, which supplies docker-init as
# PID 1 and forwards signals to this process.
CMD ["node","server.js"]
