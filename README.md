# NURSE GIFT

Prize draw site for the Faculty of Nursing, Chiang Mai University — Next.js (App Router) + MySQL.

- **Public site** — `/th`, `/en`: home, live prize feed (`/live`), prize search (`/search`)
- **Admin** — `/admin`: record winners, manage prizes, Excel/CSV import, export, users, activity log, backup/restore, live settings, translations

## Run locally

```bash
cp .env.example .env.local   # DB_*, SESSION_SECRET, CMU_*, DEV_LOGIN=true for local admin login
npm install
npm run db:migrate           # create/upgrade tables (also runs automatically in Docker)
npm run dev                  # http://localhost:3000/dev/nursegift  ·  admin: /dev/nursegift/admin
npm run test:e2e             # end-to-end tests (local/test DB only — they write data, then clean up)
```

The app always lives under the base path `/dev/nursegift` (set in `next.config.ts`, fixed at build time).
Use `withBase()` from `src/lib/base-path.ts` for anything that isn't a `<Link>`/router call
(`fetch`, `<Image src>`, plain `<a>`/`<form action>`).

## Deploy (Dokploy) — https://service.nurse.cmu.ac.th/dev/nursegift

Build from the `Dockerfile` (Next.js standalone, port 3000). On every start the container runs
`scripts/migrate.mjs` (creates/upgrades tables, adds `INITIAL_ADMIN_EMAILS`) and then the server.

| Dokploy → Domains | Value |
| --- | --- |
| Host | `service.nurse.cmu.ac.th` |
| Path | `/dev/nursegift` |
| Container Port | `3000` |
| HTTPS | on · Let's Encrypt |
| Strip Path | **off** |

Environment (Dokploy → Environment, never in the repo): `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`,
`DB_NAME`, `SESSION_SECRET`, `CMU_TENANT_ID`, `CMU_CLIENT_ID`, `CMU_CLIENT_SECRET`,
`OAUTH_REDIRECT_URI=https://service.nurse.cmu.ac.th/dev/nursegift/admin/auth/callback`,
`INITIAL_ADMIN_EMAILS` (comma-separated CMU accounts), `DEV_LOGIN=false`.

Admin login = CMU Account. Only accounts listed at **/admin/users** (table `backend_users`, active)
can sign in; `INITIAL_ADMIN_EMAILS` seeds the first admin(s).

After deploying:
```bash
curl -sS https://service.nurse.cmu.ac.th/dev/api/projects            # should list nursegift
curl -sS -I https://service.nurse.cmu.ac.th/dev/nursegift/th | head -1 # 200
```

## Structure

```
src/
├── app/
│   ├── [lang]/              Public site (root layout, th/en)
│   │   ├── live/            Live prize feed (polls /api/live)
│   │   └── search/          Prize search (calls /api/search)
│   ├── api/                 Public JSON endpoints: live, search
│   └── admin/               Admin (separate root layout)
│       ├── login/           Login page
│       ├── auth/            signin · callback · logout · dev  (route handlers)
│       ├── backup/download/ JSON backup download
│       ├── export/csv/      CSV export
│       └── (panel)/         Signed-in pages: dashboard, groups, sub, gifts,
│                            export, users, activity, backup, settings, language
├── actions/admin.ts         Server Actions (all admin mutations, auth-checked)
├── components/
│   ├── site/                Public UI (header, hero, clock)
│   └── admin/               Admin UI (nav, gift board, modal/toast/switch)
├── lib/
│   ├── base-path.ts         BASE_PATH + withBase()
│   ├── db.ts                mysql2 pool
│   ├── auth/                session (iron-session) · guard (getCurrentUser/requireAdmin) · cmu-oauth
│   ├── data/                public.ts · admin.ts · activity.ts  (SQL queries)
│   ├── i18n/                getDictionary (DB `languages` + fallback.ts)
│   └── utils/text.ts        date formatting, HTML-entity decoding
└── proxy.ts                 Locale redirects, admin gate, legacy PHP URL redirects
scripts/migrate.mjs          DB create/upgrade (idempotent) · db/schema.sql · db/migrations/ (manual reference)
e2e/                         Playwright tests
Dockerfile                   Production image for Dokploy
```

## Database

MySQL database `gift23`: `group` (prize sets — each set holds main and sub prizes),
`gif_main`, `user` (main prizes/winners), `gif_sub`, `user_sub` (sub prizes/winners),
`settings`, `languages`, `backend_users`, `activity_log`.

- New database: `db/schema.sql` (+ `db/seed.sql` for sample data)
- Existing database from the PHP version: run the migrations in order, once each:
  `db/migrations/001_sub_prize_groups.sql`, then `002_shared_prize_sets.sql`
  (sub prizes join the same sets as main prizes; existing sub prizes go to set 1)

Old PHP URLs (`/livedata/...`, `/backend/*.php`, `?lang=`) redirect to the new routes.
