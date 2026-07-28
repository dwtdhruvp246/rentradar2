# Mushavo system rules

This document records durable product rules for Mushavo v2. It incorporates the useful business decisions from the previous `rules.md` and continuation prompt while following the new multi-page architecture in this repository.

## Change control

1. Search every implementation path affected by a rule before changing it.
2. Preserve unrelated working behavior.
3. Enforce permission-sensitive rules in both the interface and Supabase.
4. Update this document when a product decision changes.
5. Do not mark a rule complete until every affected role and creation path has been checked.

## Brand and terminology

- Product name: Mushavo.
- Tagline: Your property, handled simply.
- Do not display RentRadar, Rent Radar, Musha, or legacy branding.
- IPM means Individual Portfolio Manager.
- PMC means Property Management Company.
- Landlord staff serves one landlord.
- PMC staff serves one PMC and may be narrower than the PMC's landlord grant.
- Admin staff means Mushavo platform staff assigned to one or more countries.
- A tenant is a global Mushavo identity linked to landlord-specific relationships.

## Security boundary

- Browser code may contain only the Supabase URL and public anon/publishable key.
- Never store or expose a service-role key, database password, or user password.
- PostgreSQL RLS, secure RPCs, constraints, triggers, private Storage buckets, and signed URLs are the security boundary.
- UI hiding improves clarity but is not authorization.
- Invite validation must use a controlled RPC; invite tables must not be publicly readable.
- Invite tokens are single-use and expire after 48 hours unless the owner changes this rule.
- Lease documents, payment proofs, and maintenance photos belong in private buckets.
- Multi-step operations that must be atomic belong in database functions.
- Avoid mutually recursive RLS policies; use narrowly scoped helper functions where necessary.

## Ownership and roles

### Super admin

- Has platform-wide access across all countries.
- Manages countries, platform staff, users, plans, subscriptions, enquiries, and platform finance.
- Can view archived records and perform deliberate permanent-delete operations where allowed.

### Admin staff

- Is invited by the super admin.
- Sees only assigned countries.
- Cannot create countries.
- Receives operational permissions within assigned countries.
- A suspended admin staff account cannot access the platform.

### Landlord

- Owns property, unit, landlord-tenant relationship, lease, payment, maintenance, and financial history.
- May invite personal staff subject to plan limits.
- May approve and scope an IPM or PMC relationship.
- Keeps My Account separate from Settings.

### Landlord staff

- Is invited by one landlord and serves only that landlord.
- Has no landlord switcher or multi-landlord request flow.
- Requires explicit permissions.
- Deleting the login must not corrupt historical payment, lease, or maintenance records.

### IPM

- Manages multiple approved landlord portfolios subject to plan limits.
- Requires landlord approval and explicit permissions before accessing landlord data.
- Is not landlord staff and keeps an independent account identity.
- Uses a dedicated Connected Landlords area and separately scoped selected-landlord state.

### PMC leader and staff

- A PMC leader coordinates approved landlord portfolios and internal PMC staff.
- PMC staff serves only that PMC.
- PMC staff access is the intersection of the landlord's PMC grant and the narrower staff grant.
- A PMC leader cannot grant staff more access than the PMC received.
- Company name and account context remain visible in the authenticated shell.

### Tenant

- Owns an independent, reusable account identity.
- A landlord-specific tenant record is a relationship, not a second identity.
- A tenant can have historical relationships with multiple landlords.
- Duplicate active relationships with the same landlord are not allowed.

## Tenant-link lifecycle

- `pending`: the landlord sent a request and the tenant has not responded.
- `accepted`: the tenant explicitly accepted and can now appear in assignment controls.
- `rejected`: the request is no longer an available relationship.
- `ended`: access ended while authorised historical records remain.
- Pending tenants never appear in accepted-tenant selectors.
- Notifications store and display the response state.
- Dropping a landlord is allowed only when no active lease blocks the action.
- Dropping a relationship never deletes historical leases, payments, or receipts.

## Permission hierarchy

- A child action is unavailable when its parent view permission is unavailable.
- Navigation visibility and action authorization are separate decisions.
- Missing optional actions must not make an otherwise viewable page disappear.

Properties and units:

- Add, edit, and archive property require property view.
- Unit view requires property view.
- Add, edit, archive, or mark-vacant unit require unit view.

Tenants:

- Add, edit, archive, link, or assign tenant require tenant view.
- Tenant details inside a unit require both relevant unit and tenant visibility.

Leases and documents:

- Lease view requires unit visibility.
- Lease creation requires unit and tenant visibility.
- Edit, terminate, document view, and document upload require lease visibility and their exact action permissions.

Payments and finance:

- Payment view, log, verify, reject, receipt, and finance permissions remain separate.
- A broad payment permission must not silently authorize every payment action.

Maintenance:

- View, create, edit, assign, resolve, and archive are distinct permissions.
- Assignment lists only eligible staff for the current owner and property scope.

## Subscription and account states

- Display plan and status as one value, such as `Free - Active` or `Growth - Trial`.
- `active`, `trial`, `expired`, and `suspended` have different meanings.
- Expiry is derived from the applicable plan or trial date.
- Suspension is an administrative action and must preserve the previous plan and subscription state.
- Free active plans do not expire because of malformed legacy dates.
- Zero is a valid plan limit; use nullish logic rather than replacing zero with a default.
- Limit counts must reconcile accepted accounts and pending invites without double-counting identities.

## Archive, delete, unassign, and history

- Archive hides a record from normal active work while keeping it recoverable.
- Unassign or drop removes a relationship's access without deleting either global identity.
- Permanent delete is admin-controlled and deliberate.
- Historical payment, lease, finance, receipt, and operational records remain intact where legally and operationally required.
- Foreign keys, snapshots, or nullable references must prevent deleted logins from corrupting history.

## Payments and rent balance

- Store payment purpose as structured data: rent, deposit, maintenance, or other.
- Only verified rent assigned to a rent period reduces rent due for that period.
- Deposits are liabilities, not rent revenue.
- Maintenance and other payments do not reduce rent balance unless explicitly classified as rent.
- Current balance covers outstanding rent from the active lease start through the current month.
- Managers may add structured historical rent records.
- Tenant proof submission does not offer backdated manager-only options.
- Receipts include payer, payee, amount, date, purpose, period, reference, and notes.

## Finance

- Admin finance tracks platform subscription income separately from landlord operations.
- Landlord finance separates rent revenue, deposits, expenses, and outstanding rent.
- IPM and PMC finance separates owner money from management-company or management-fee income.
- Financial values use locale-aware currency formatting and auditable references.

## Country and language

- Countries determine market scope, currency, public pricing, enquiries, and admin-staff visibility.
- Direct signup paths must save a required country consistently to every relevant profile and account row.
- Store stable country IDs rather than labels.
- English, Bahasa Melayu, and Chinese translations must cover complete visible workflows rather than navigation alone.

## State, refresh, and loading

- State is scoped by profile and role.
- IPM and PMC selected-landlord state never leaks into another account or role.
- Same-user session refresh does not return the user to Dashboard.
- Realtime events reload only affected sections.
- Background refresh preserves existing content, current view, filters, selections, and scroll position.
- First load may show skeletons; normal refresh must not collapse containers or cause layout jumps.

## Forms, dropdowns, tables, and dialogs

- Forms use visible labels, field-level errors, appropriate input types, loading states, and specific action wording.
- Dropdowns reopen with the stored stable value rather than resetting to the first option.
- A visible sort control must actually reorder the underlying visible rows.
- Text, number, currency, and date columns use the appropriate comparison.
- Dialogs have a maximum viewport height, scrollable content, reachable close control, and reachable actions.
- Raw Supabase, constraint, and RLS errors are translated into useful customer-facing messages.

## Mobile and accessibility

- No page-level horizontal scrolling.
- Wide tables may scroll only inside their own container.
- Touch targets are at least 44px.
- Keyboard focus is visible and follows visual order.
- Status is not conveyed by colour alone.
- Reduced motion is respected.
- Test 320px, 375px, 430px, 768px, 1024px, and wide desktop layouts.

## Public website

- Home clearly explains what Mushavo does and who it serves.
- About explains mission, ownership logic, tenant independence, delegated access, and record preservation.
- Pricing loads public country and plan records from Supabase.
- Contact saves enquiries with country and topic context.
- Public pages do not invent customer statistics, testimonials, property data, or financial results.

## Required regression matrices

Before launch, maintain and execute matrices for:

- every account creation and invitation path;
- active, trial, expired, and suspended subscription states;
- every parent/child permission combination and direct database bypass attempt;
- archive, delete, unassign, and relationship-drop behavior;
- tenant request pending, accepted, rejected, and ended states;
- responsive layouts and dialogs;
- all supported languages;
- selected dropdown values after save and reopen;
- table sorting after filtering and refresh;
- Realtime updates without page reset or layout shift.

## Completion checklist

- Check every affected role and code path.
- Verify frontend and database enforcement.
- Verify referenced tables, columns, functions, constraints, and conflict targets.
- Test RLS with both an allowed and out-of-scope account.
- Translate raw errors.
- Scan for legacy branding, secrets, TODOs, stubs, placeholder logic, and encoding corruption.
- State clearly when SQL has not been applied or remote behavior remains unverified.
