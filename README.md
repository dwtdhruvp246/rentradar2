# Mushavo v2

Mushavo v2 is a new static, multi-page property operations application designed for GitHub source control and Cloudflare Pages hosting. Supabase provides Auth, PostgreSQL, Realtime, Storage, and row-level security.

## Page structure

- Public pages live at the project root.
- The authenticated operational shell is `app/index.html`.
- Reports, account, and settings are separate pages under `app/`.
- Administration pages live under `admin/`.
- Shared styles and ES modules live under `assets/`.
- Supabase migrations live under `supabase/migrations/`.
- Canonical v2 business and engineering rules live in `docs/system-rules.md`.
- Legacy prompt decisions and unresolved conflicts are mapped in `docs/legacy-material-review.md`.

## Run locally

Serve the project directory through an HTTP server. ES modules will not work reliably by opening the HTML files directly.

```powershell
python -m http.server 4173 --directory mushavo-v2
```

Then open `http://localhost:4173`.

## Database

For a new Supabase project, run `supabase/mushavo_complete_setup.sql` once in the SQL Editor. It contains the complete schema, canonical rules, and super-admin bootstrap in the correct order.

The separate migration files remain available for CLI and source-controlled deployment workflows:

1. `supabase/migrations/202607280001_foundation.sql`
2. `supabase/migrations/202607280002_apply_canonical_rules.sql`
3. `supabase/migrations/202607280003_bootstrap_super_admin.sql`

Do not seed countries or pricing. The bootstrap super admin creates those records from the admin workspace. `supabase/seed.sql` is intentionally a no-op.

After migration 003, create the bootstrap email as a Supabase Auth user. The database trigger consumes the one-time bootstrap record and creates its authoritative `super_admin` profile.

Deploy the `invite-user` Edge Function and set its `SITE_URL` secret to the deployed website origin. Add that origin plus `/accept-invitation.html` to the Supabase Auth redirect allow list.

The public anon key in `assets/js/config.js` is intentionally a browser key. The service-role key is read only from Supabase Edge Function secrets; never add it to this repository or browser code.

Until the migrations, seed, Auth redirect settings, and Edge Function are applied to the remote project, database-backed pages intentionally show unavailable or empty states.
