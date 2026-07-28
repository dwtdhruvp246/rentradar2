# Legacy material review

Sources reviewed:

- `rentradar_next_chat_prompt.md`
- `rules.md` dated July 18, 2026

The old `rules.md` is more current and internally consistent than the continuation prompt. Its durable business rules have been incorporated into `docs/system-rules.md`.

## Retained

- Mushavo branding and tagline.
- Landlord ownership and tenant-independent identity.
- IPM and PMC delegated-access model.
- Parent-child permission dependencies.
- Country-scoped admin staff.
- Combined plan/status display and separate suspension/expiry behavior.
- Invite expiry, single-use invite lifecycle, and duplicate prevention.
- Private Storage buckets and signed downloads.
- Structured payment-purpose and rent-balance rules.
- Historical record preservation.
- Tenant request approval lifecycle.
- Stable section loading, scoped Realtime refresh, and preserved view state.
- Dropdown persistence, working table sorting, accessible dialogs, and error translation.
- Admin notes, responsive, language, permission, deletion, and subscription regression matrices.

## Retired implementation assumptions

- The old single-file `client.html` architecture.
- The earlier all-in-one `index.html` application.
- Old `outputs/` and RentRadar file paths.
- Tailwind and Alpine as mandatory implementation choices.
- GitHub Pages as the deployment target; Mushavo v2 targets Cloudflare Pages.
- Legacy user-facing labels such as Freelancer and Management Company where IPM and PMC are now required.
- Old instructions to patch a monolithic SQL file instead of using versioned migrations.

## Decisions requiring owner confirmation

1. Direct signup eligibility.

   The older continuation prompt says all access is invite-only. The later rules allow direct landlord signup, and the newest direct-country rule mentions both landlord and tenant signup. The current v2 UI offers landlord, tenant, IPM, and PMC signup. Before final Auth implementation, confirm whether direct signup is:

   - landlord and tenant only; or
   - landlord only; or
   - all four account types.

2. Exact free-plan limits.

   The legacy rule specifies one property, one unit, no personal staff, and one IPM/PMC connection. Confirm these commercial limits before enforcing them in production.

3. IPM and PMC account creation.

   The later rules say both are admin-invited only. Confirm before removing them from public signup.

4. Permanent deletion.

   Confirm which identities can be permanently deleted and which historical rows must keep snapshots or nullable references.

5. Email confirmation and invite acceptance.

   The old static app disabled email confirmation to obtain a session immediately. The v2 flow should use a current, secure Supabase Auth design rather than carrying that workaround forward automatically.

6. Legacy internal identifiers.

   Decide whether database names such as `management_leader`, `management_staff`, and `freelancer` will be migrated or retained internally behind current UI terminology.

## Precedence

Until the owner resolves the items above:

1. Explicit new owner instructions take priority.
2. `docs/system-rules.md` governs durable v2 behavior.
3. This review documents unresolved conflicts.
4. The old files remain historical references and do not override the new folder structure or architecture.
