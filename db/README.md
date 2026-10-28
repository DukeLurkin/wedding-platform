# RSVP database foundation

The website defaults to the browser-only RSVP preview when no mode is configured. This checkpoint configures production and local development for database-backed sample invitations. Real guest submissions remain disabled. These scripts do not import the real guest list or modify Neon Auth tables.

## Connection

Use Node.js 24, matching the configured Vercel runtime. Save a Neon connection string as `DATABASE_URL` in the ignored `.env.development.local` file for development. Prefer a separate Neon development branch before testing changes with real guest data.

Vercel's integration currently assigns database variables to Preview and Production. Sensitive variables are exported by `vercel env pull` as `[SENSITIVE]`, so successfully downloading an env file does not guarantee a usable local database URL. Copy a real connection string from the appropriate branch's **Connect** panel in Neon into the local env file. Do not paste it into chat, source code, screenshots, or Git.

For an explicitly selected database, pass a different ignored file:

```sh
npm run db:check -- --env-file .env.database.local
npm run db:migrate -- --env-file .env.database.local
npm run db:verify -- --env-file .env.database.local
```

The selected URL controls which database is modified. `db:check` only reads. `db:migrate` applies pending migrations; it is an explicit operator action, never part of the app build or a request handler. `db:verify` checks constraints with synthetic records inside a transaction that is deliberately rolled back, leaving no fixture guests or responses behind.

## Migration behavior

Migrations create a dedicated `wedding` schema. Each migration and its tracking record run in one transaction. File checksums prevent accidentally reapplying edited migrations. Re-running an unchanged migration skips it; schema changes belong in a new numbered SQL file. Do not edit an applied migration.

The first migration creates:

- `invitation_parties`: invitation groups and unique invitation-code hashes; never plaintext codes.
- `guests`: named invitees, invitation membership, and explicit child flags.
- `events`: event details and RSVP cutoff.
- `event_invitations`: individual guest/event invitations and explicit plus-one permission.
- `rsvp_responses`: one response per invited guest/event, attendance, and dietary restrictions.
- `plus_one_responses`: a permitted plus-one's attendance, name, and dietary restrictions.
- `guest_sessions`: hashed, expiring, revocable session tokens tied to one party.

Migration `002_rsvp_access.sql` adds explicit test-party flags, stable import/source keys, response revisions for optimistic concurrency, and `rsvp_rate_limits` for durable lookup/submission throttling.

The wedding event is April 11, 2027. The exclusive RSVP cutoff is February 12 at midnight in `America/New_York`, allowing replies throughout February 11. Meal choices are made at the event, so no meal-selection tables or columns are included.

Foreign keys and checks reject duplicate responses, unauthorized plus-ones, attending plus-ones without a name, plus-ones whose host isn't attending, and dietary notes on declined responses. The save service removes old plus-one rows before updating a host, all in the same transaction. Public schema access is revoked; credentials stay on the server.

## Database-backed local preview

```sh
npm run rsvp:setup-preview
npm run dev
```

The setup command reads `.env.database.local`, creates or reuses two explicitly marked test parties, and configures `.env.development.local` with `DATABASE_URL`, a random `RSVP_HASH_SECRET`, and `RSVP_MODE=database-preview`. It preserves unrelated environment settings. The generated invitation codes and matching last names are in ignored `.env.rsvp-demo-codes.json`; they are not committed or published in the page. Re-running setup preserves existing sample responses. If a code must be regenerated, sessions for that sample party are revoked.

At `/#rsvp`, use a generated code and its last name. Responses save to Neon and reload after refresh or re-entering the code. Only test parties can be accessed in this mode. Real invitations are excluded, even if someone supplies their valid code.

Keep `RSVP_HASH_SECRET` stable: changing it invalidates invitation-code hashes. Never put it in a `NEXT_PUBLIC_` variable. Raw invitation codes are delivered privately; only keyed SHA-256 hashes are stored in Neon. Session tokens are random 256-bit values, with SHA-256 hashes stored in the database. The cookie is HttpOnly, SameSite=Lax, secure in production, and expires after 24 hours. Sessions and invitation access are checked for every read/write.

The server accepts responses only for the current party's invited guests and event, rechecks plus-one permissions, and validates names and note lengths. Saves lock the party and invitation permissions, reject stale revisions, upsert responses rather than duplicating them, and enforce the database deadline before commit. A confirmation appears only after the transaction commits. Provider errors and private payloads are not logged or returned to the browser.

Lookup limits are stored in Neon (15 attempts per IP and code per 15-minute window); submissions allow 30 attempts per session/IP window. IPs and code buckets are keyed hashes, not plaintext. Vercel's overwritten forwarding header supplies the IP; local development uses one shared local bucket. Expired rate-limit rows can be periodically pruned after their `resets_at` timestamp; no scheduled cleanup is installed yet.

## Deployment modes

- Unset `RSVP_MODE`, or `preview`: original browser-only demo; no real database access.
- `database-preview`: persisted sample invitations only; requires `DATABASE_URL` and `RSVP_HASH_SECRET`.
- `live`: real invitations only; excludes all test parties. Do not enable until guest groups and plus-one/child permissions are finalized and imported, production credentials and the matching hash secret are configured, and the flow is verified on Vercel.

Environment-mode changes require a new build/deployment because the public page is statically rendered. The secret and database URL are server-only. Neon preview branching copies database contents; before real guest data is imported, review which preview deployments and collaborators can access those branches. Local setup does not change hosted settings.

## Tests

```sh
npm test
npm run test:rsvp-db
npm run db:verify -- --env-file .env.database.local
```

Unit tests cover the browser demo and request validation. Database integration tests use randomly identified fixtures and an isolated event, then remove only those records. Coverage includes persistence, cross-party authorization, test/live separation, plus-one permissions, duplicate/missing guests, decline cleanup, revisions and simultaneous writes, cutoff enforcement, token hashing/logout, expiry, and durable rate limiting.

## Verification status

On October 28, 2026, migrations `001_rsvp_foundation.sql` and `002_rsvp_access.sql` were applied to the connected Neon database. All eight RSVP tables, the wedding event, the deadline, and the meal policy were verified. Eight database constraint checks and 14 integration tests passed. Verification fixtures were rolled back or removed. Two marked sample invitations remain intentionally for manual testing. Re-running migrations verifies checksums and skips unchanged files.

No real guest data has been imported. Production is explicitly configured with `RSVP_MODE=database-preview` and the matching server-side hash secret. The database preview supports authenticated lookup, saved responses, editing, and save confirmations for sample invitations only. Real invitations are excluded until live mode is deliberately enabled after the guest import and final verification.
