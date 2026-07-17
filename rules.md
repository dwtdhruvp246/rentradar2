# Mushavo Product And Engineering Rules

Last updated: July 17, 2026

Status: Draft for owner review. This file records the current product decisions, business rules, security rules, UI expectations, and regression checks for Mushavo. If this file conflicts with old code or an old continuation prompt, this file represents the newer decision unless the owner explicitly changes it.

## 1. Purpose And Change Control

1. Read this file before changing Mushavo code, SQL, pricing, roles, permissions, subscriptions, invitations, deletion, or navigation.
2. Do not restart the project or replace working features with a new implementation unless explicitly requested.
3. A new feature must preserve all unrelated existing functions.
4. When a product decision changes, update this file in the same change.
5. Search for every implementation path affected by a rule. Do not patch only the screen where the bug was reported.
6. Rules must be enforced in both places where applicable:
   - frontend visibility and validation
   - Supabase RLS, RPCs, constraints, or triggers
7. Never claim a rule is fixed until all account types and creation paths affected by it have been checked.
8. Use current terminology and current rules. Do not revive an older rule because old code still contains it.

## 2. Current Files And Source Of Truth

The public website and client area are separate files:

- `index.html`: public home page
- `about.html`: public About page
- `pricing.html`: public Pricing page
- `contact.html`: public Contact and enquiry page
- `client.html`: login and authenticated client area
- `i18n.js`: shared English, Bahasa Melayu, and Chinese translations
- `mushavo-logo.png`: shared logo
- `rentradar_loop1_schema.sql`: Supabase schema, functions, triggers, storage, and RLS
- `rules.md`: current product and engineering rules


## 3. Brand And Terminology

- Product name: Mushavo
- Tagline: Your property, handled simply.
- IPM means Individual Portfolio Manager.
- PMC means Property Management Company.
- Landlord staff means personal staff created by one landlord and serving only that landlord.
- PMC staff means internal staff created by one PMC and serving only that PMC.
- Admin staff means Mushavo's own staff, created by the super admin and assigned to one or more countries.
- Tenant means a global Mushavo identity linked to landlord-specific tenant relationships.

## 4. Architecture And Security

- Current app architecture is static HTML, Tailwind CSS, Alpine.js, and Supabase.
- The Supabase project URL and anon key are public browser configuration.
- Never place a Supabase service-role key, database password, or other privileged secret in any HTML or frontend JavaScript.
- Supabase RLS, secure RPCs, constraints, triggers, private storage buckets, and signed URLs are the security boundary.
- UI hiding is user experience, not security.
- Passwords must never be stored in app tables, invite metadata, logs, or browser storage.
- Invite validation must use an RPC. Do not make `invite_tokens` publicly readable.
- Invite tokens are single-use and expire after 6 hours.
- Storage buckets for lease documents, payment proofs, and maintenance photos remain private.
- Downloads use short-lived signed URLs.
- Use structured database functions for multi-step operations that must be atomic.

## 5. Account Types And Ownership

### 5.1 Super Admin

- Has platform-wide access across all countries.
- Can add countries.
- Can create, edit, suspend, archive, unarchive, and permanently delete platform-managed users where the product allows it.
- Can manage landlords, admin staff, IPMs, PMCs, tenants, enquiries, and platform finance.
- Can view archived users.

### 5.2 Admin Staff

- Created by the super admin through an invite.
- Can be assigned one or more countries.
- Must see and use the same operational actions as the super admin, but only for records in assigned countries.
- Cannot add countries.
- Cannot view or manage records outside assigned countries.
- Enquiries are filtered by the enquiry country.
- A suspended admin staff account cannot log in.
- Admin staff edits must preserve all selected countries and preselect them when the edit dialog is reopened.

### 5.3 Landlord

- Owns properties, units, landlord-specific tenant relationships, leases, rent records, and maintenance records.
- Can use the direct landlord-only free signup path.
- Can also be invited by admin, admin staff, an IPM, or a PMC.
- Has My Account and Settings as separate pages.
- Can create personal landlord staff subject to plan limits.
- Can connect to an IPM or PMC subject to plan and assignment rules.

### 5.4 Landlord Staff

- Created only by a landlord invite.
- Serves that landlord only.
- Must not have a landlord switcher, Add Landlord field, landlord code field, or multi-landlord request flow.
- Receives permissions from the landlord before access is accepted.
- Its access is also affected by the landlord's subscription state.
- When deleted by its landlord, the account is permanently removed from Supabase Auth/profile so the same email can be invited again.
- Historical records must retain useful staff snapshots or nullable references where required; deleting the login must not corrupt payment, lease, or maintenance history.

### 5.5 IPM

- Created/invited by the Mushavo admin. There is no public IPM signup.
- Can serve multiple landlords according to its subscription limit.
- Uses a Landlords page to search for an existing landlord by email.
- If found, requests access.
- If not found, can invite the landlord to create a free Mushavo landlord account.
- Landlord approval and explicit permissions are required before landlord data becomes accessible.
- Has My Account with subscription details.
- IPM is not a personal landlord staff member.
- IPM does not have a free subscription plan unless the owner later explicitly adds one.

### 5.6 PMC Leader

- Created/invited by the Mushavo admin. There is no public PMC signup.
- Has a landlord-style operational dashboard and pages.
- Can add internal PMC staff before connecting any landlord.
- Uses a separate Connected Landlords page, not a landlord section mixed into the Staff page.
- Searches existing landlords by email or invites a missing landlord onto the free landlord plan.
- Requires landlord approval and explicit permissions before accessing landlord data.
- Can permanently delete its internal PMC staff accounts.
- Has My Account with plan, status, expiry, and limits.
- The PMC company name appears in the header for both the leader and PMC staff.

### 5.7 PMC Staff

- Created by the PMC leader.
- Serves only that PMC.
- Does not require landlord approval merely to activate the Mushavo account.
- Can register and log in immediately after accepting the PMC invite and setting a password, even when no landlord is connected or assigned.
- Access to landlord operations is limited by both:
  - the permissions the landlord granted to the PMC
  - the narrower permissions the PMC leader granted to the PMC staff member
- Must never receive a permission broader than the PMC itself has.

### 5.8 Tenant

- A tenant login is a global Mushavo identity and is not owned permanently by one landlord.
- A tenant can move and later connect to another landlord using the same login.
- Landlord-specific `tenants` rows are relationship records, not separate global identities.
- The same tenant profile can have multiple historical landlord relationships but cannot have duplicate active relationships with the same landlord.

## 6. Account Creation And Invitation Rules

### 6.1 Landlord Defaults

Every new landlord created through any path must receive the same defaults:

- plan: `free`
- status: `active`
- display label: `Active - Free`
- practical expiry: none; current compatibility value is `2099-12-31T23:59:59.000Z`
- property limit: 1
- unit limit: 1
- personal landlord staff limit: 0
- IPM/PMC connection limit: 1
- Finance page included for the one free unit

This applies to:

- direct landlord signup
- super admin invite
- admin staff invite
- IPM landlord invite
- PMC landlord invite


### 6.2 Direct Signup Duplicate Prevention

- Direct signup is for landlords only.
- Before creating a Supabase Auth user, check both normalized email and normalized full phone number.
- If either already exists, stop before `auth.signUp()`.
- Show: `Your account already exists. Please contact Mushavo Support.`
- A duplicate check must not leave a partial Auth user behind.
- Phone matching uses country code plus national number in a normalized international format.

### 6.3 Invite Acceptance

- Email from an invite is read-only.
- Full name must be editable when the invite creator did not provide a valid final name, including landlord invitations from an IPM or PMC.
- After acceptance, update the existing pending invite/relationship state. Do not create a second visible row for the same person.
- Accepted profiles and unused invite rows must be reconciled by invite ID, profile ID, and normalized email.
- Once accepted, a stale Invited row must not remain beside the Approved row.
- Staff request approval must open the permission checklist first. The relationship is accepted only when the landlord clicks Accept at the bottom of that checklist.

### 6.4 Phone Inputs

- Every place that collects a phone number must include a country-code selector.
- Store a normalized full international number.
- Apply this to public signup, admin invites/edits, landlord/tenant/staff/IPM/PMC forms, contact details, and account settings.

## 7. Subscription Plans, Statuses, And Access

### 7.1 Combined Plan And Status

Plan and status are displayed as one combined value.

Landlord examples:

- Active - Free
- Starter - Trial
- Starter - Active
- Growth - Trial
- Growth - Active
- Portfolio - Trial
- Portfolio - Active
- Custom - Trial
- Custom - Active

IPM and PMC use the same combined plan/status idea using their own plan names.

Admin and admin staff subscription dialogs use one Plan / Status dropdown, not separate Plan and Status dropdowns.

### 7.2 Status Meaning

- `active`: account is allowed while plan conditions are valid.
- `trial`: account is allowed until trial expiry.
- `suspended`: explicitly paused by Mushavo admin, regardless of an unexpired date.
- `expired`: derived when a paid/trial expiry date is in the past.
- Active - Free - Active has no practical expiry and must not become expired because of a compatibility date or malformed old date.

Do not treat Trial as Suspended.

### 7.3 Access Screens

Suspended account message and expired account message are different.

For an expired subscription:

```text
Your Mushavo subscription has expired, and your account access is currently paused. Your data is still safely stored.

Please contact support to renew your subscription and restore access.
```

For a suspended account, state that access was paused by the Mushavo administrator and direct the user to support. Do not call it expired.

Landlord staff inherit the landlord subscription lockout. PMC staff inherit the PMC subscription lockout.

### 7.4 Expiry Calculation

- Supabase may return a date or a full timestamp.
- Parse only the date component safely; never append a second `T00:00:00` to a full timestamp.
- Compare dates consistently in the configured business timezone/date convention.
- Admin list status, account top badge, My Account, filters, and lockout logic must all use the same computed status helper.
- When expiry passes, the list must show Expired even if the stored status remains Active.

### 7.5 Limits

- A limit of zero is a real limit. Never use `value || default` for numeric limits; use nullish handling such as `value ?? default`.
- Allow creation when `current_count < limit`.
- Block creation when `current_count >= limit`.
- A limit of 2 with 1 existing record must allow the second record.
- Count accepted records and active pending invites deliberately. Do not accidentally count the same accepted person and stale invite twice.
- Convert all database limit failures to clear Mushavo messages.
- Never show RLS, constraint, trigger, SQLSTATE, or raw Supabase errors to users.

### 7.6 Pricing Rules

- Zimbabwe prices display in USD.
- Malaysia prices display in MYR.
- Country pricing is market-specific, not a currency conversion only.
- Pricing page supports monthly/yearly toggle.
- Yearly billing gives one month free.
- Landlord Free plan has a Sign up for free CTA.
- IPM and PMC plans have no public free signup.
- The approved pricing workbook is the source for exact price amounts and limits; do not invent or silently change prices in HTML.
- Unit limit wording must clearly state whether it is total units or units per property. Current product intent is units per property where shown as such.
- For IPM, a property limit refers to the maximum number of properties a connected landlord may have only where the plan explicitly defines it that way. Avoid ambiguous labels.
- PMC plans must explicitly include unit allowances; do not omit units from the pricing matrix.

## 8. Archive, Delete, Drop, And Historical Records

These actions are different and must not share vague confirmation text.

### 8.1 Archive

- Hides an active business relationship while preserving history.
- Only admin can see archived platform users and unarchive them.
- Archiving a tenant relationship terminates active occupancy as appropriate and marks the unit vacant, but does not delete the global tenant Auth/profile.
- Archiving a landlord, property, tenant relationship, lease, or staff relationship must not silently erase historical financial, lease, receipt, or maintenance records.

### 8.2 Permanent Delete

- Must use an in-app confirmation dialog with precise consequences.
- Super admin can permanently delete landlords, tenants, IPMs, PMCs, admin staff, and other supported accounts.
- A landlord permanently deletes its personal landlord staff login.
- A PMC leader permanently deletes its PMC staff login.
- Permanent deletion of an Auth account must not break retained historical rows; use nullable foreign keys, snapshots, or archival records where history is legally/business-required.
- Platform payment history should remain where designed, even if its payer becomes `Unassigned` after a permanent deletion.

### 8.3 Unassign Or Drop

- Unassigning an IPM/PMC removes access, not the landlord's data.
- A Drop Landlord action removes the landlord relationship and all visibility of that landlord's data from the IPM/PMC account.
- The underlying landlord account, properties, units, tenants, leases, payments, and maintenance records remain owned by and visible to the landlord.
- After dropping, the IPM/PMC must not retain or continue to view cached landlord operational data.
- Confirmation copy must say exactly this; do not vaguely say `their data will stay` without identifying whose access is removed and whose records are retained.

## 9. Navigation, Session, And Page Visibility

- All expected navigation pages remain visible for staff account types even when permissions are not granted.
- Opening a page without permission shows an appropriate empty/restricted state; it must not remove the page from navigation solely because no permission is selected.
- Buttons, fields, sensitive details, and actions inside the page remain permission-gated.
- Fresh PMC leader login lands on Dashboard, not Staff.
- Changing browser tab, minimizing the browser, or returning from another app must not reset the user to Dashboard or reload all page state.
- Supabase `SIGNED_IN` or token refresh events for the same current user must not call the full fresh-login flow.
- Restore the last valid page for the current shell.
- Refresh buttons reload current page data and do not route to Dashboard.
- The app must never remain permanently on `Loading Mushavo...`.
- Account type appears beside the logo where appropriate.
- PMC leader and PMC staff show the PMC company name in the agreed header position.

## 10. Permission Model

### 10.1 General Rules

- Permissions form a parent-child tree.
- A child permission has no effect without its required parent.
- If a permission is not granted, its button, editable field, dropdown, sensitive information, and direct action must not appear.
- Backend enforcement must still reject a direct unauthorized request.
- Do not use broad legacy `manage` permissions for unrelated actions.
- Use exact permission helpers with names matching the action.
- Test each permission separately with every other sibling permission off.
- Test important combinations and parent-child dependencies.

### 10.2 Properties And Units

- View properties:
  - shows property name, address, city, and landlord name
  - does not by itself reveal units
- Add property requires View properties.
- Edit property requires View properties.
- Archive property requires View properties.
- View units requires View properties and controls:
  - Open Units button
  - unit information
  - unit details
  - maintenance history under the property/unit
- Add unit requires View units.
- Edit unit requires View units.
- Archive unit requires View units.
- Mark unit vacant requires View units.
- Tenant details inside a unit require both View units and View tenants.
- Lease details inside a unit require the relevant unit and lease permissions.

### 10.3 Tenants

- View tenants controls tenant lists and tenant details.
- Add tenant requires View tenants.
- Edit tenant requires View tenants.
- Archive tenant requires View tenants.
- Tenant details appearing on Properties/Units also require View tenants.

### 10.4 Leases And Documents

- View leases requires relevant unit visibility.
- Create lease requires unit visibility and tenant visibility.
- Edit lease requires View leases.
- Terminate lease requires View leases.
- View lease PDFs requires View leases and View lease documents.
- Upload/replace lease PDFs requires View leases and Upload lease documents.
- Do not use broad `can_manage_leases` for UI actions. Keep exact helpers.

### 10.5 Payments And Finance

- View payments controls payment lists and payment details.
- Log payments controls manual payment forms.
- Verify payments controls approval of tenant submissions.
- Reject payments controls rejection action.
- View proof files controls proof open/download actions.
- View finance controls finance reporting.
- A View button on recent payments opens the complete payment details.
- Notes entered with a payment are visible in payment history for all authorized account types.

### 10.6 Maintenance

Use clear exact permissions:

- View maintenance: see maintenance requests.
- Create maintenance: show and use Log Maintenance/New Request.
- Assign maintenance: show and use assigned-staff dropdown.
- Update maintenance: change status, priority, and editable request details.
- Add resolution notes: add work-completed/resolution notes.
- Delete maintenance: landlord-only unless explicitly expanded later.

Rules:

- If Create maintenance is off, hide Log Maintenance.
- If Assign maintenance is off, hide every assignment dropdown, including in detail dialogs.
- Description display must not be confused with assignment or update permissions.
- Assignment lists only include eligible people under the active landlord/PMC and within the permitted property/unit scope.
- Never list random platform staff, another landlord's staff, or another PMC's staff.
- Maintenance View opens complete work details and history.

### 10.7 Staff And Partner Permissions

- When approving a landlord staff, IPM, or PMC request, open the permission checklist before accepting.
- Editing an accepted relationship reopens the checklist with current values selected.
- The landlord can unassign an IPM/PMC relationship.
- A landlord may assign only one external operator to the same property/unit scope: one IPM or one PMC, not both. Personal landlord staff are outside this exclusivity rule.
- PMC staff permissions cannot exceed the landlord-to-PMC permission envelope.

## 11. Properties And Units UX

- Properties page contains properties and their units; there is no separate Units navigation page for landlords.
- Open Units opens the units panel directly beneath the selected property card, not at the bottom of the full property list.
- Only one property panel needs to be open at a time unless a later design explicitly supports multiple.
- Property Edit uses the top property form:
  - click Edit on a property
  - populate Property name, Address, and City at the top
  - change Add Property to Edit Property/Save Changes
  - provide Cancel
  - save updates the selected property
- Do not squeeze property editing into a small card.
- Unit edit must be usable on small screens and follow the same clear editing pattern where practical.
- Unit details for landlord and PMC contexts show which eligible staff/operator is assigned to the unit.
- Tenant Unit Details show assigned contact name, phone, email, and contact type when available.

## 12. Tenant Lifecycle And Search

- Tenant creation starts with search by email.
- Do not show the Add Tenant registration form by default.
- If an existing tenant is found, request/link that global tenant to the landlord relationship.
- If no tenant is found, then reveal the Add Tenant fields and allow a new invitation.
- Landlord, IPM, and PMC tenant flows follow this pattern within their permitted landlord scope.
- Existing tenant accounts sign in with their existing password to accept a new landlord relationship.
- New tenant accounts set a password from the invite.
- Deleting/archiving one landlord relationship does not delete the global tenant login.
- A landlord cannot see tenant information belonging only to another landlord relationship.
- Tenant page lists property name where applicable.
- PMC tenant lists do not show an unnecessary tenant ID column.

## 13. Leases

- Landlords can upload or replace lease agreement PDFs.
- PDF only, maximum 20 MB.
- Tenant can download the active lease agreement.
- Lease details include property, unit, tenant, dates, rent, deposit status, notes, and agreement where authorized.
- Unit Current Tenant + Lease includes View Lease.
- Deleting/terminating a lease updates vacancy correctly.
- Upcoming Lease Expirations include property name and a View action that opens lease and tenant details.
- Lease and payment history must remain available after normal archival transitions.

## 14. Payments, Rent Balance, And Receipts

### 14.1 Payment Purpose

- Payment is for includes rent periods, advance rent where allowed, and Other.
- If Other is selected, show a required description field.
- Rent payment amount label may say Rent amount.
- Other payment amount label must say Amount.
- This applies to tenant submissions, manual logging, and unit quick payment forms.

### 14.2 Rent Balance

- Tenant Current Balance is rent-only.
- Only verified rent payments reduce rent balance.
- Maintenance, repairs, deposits, fees, and Other payments do not reduce rent balance.
- Copy should say: `Based on this month's rent and verified rent payments only.`
- Payment purpose must be stored structurally; do not infer it only from free-text notes.

### 14.3 Deposits And Revenue

- Refundable security deposits are not rental revenue when received.
- Keep deposits separate from rent revenue in finance reporting.
- Only recognize a deposit as revenue if a legitimate later event applies it to rent/damages according to the business/legal process.

### 14.4 Proofs And Receipts

- Accept proof uploads as JPEG, PNG, WebP, or PDF, maximum 10 MB.
- Use private storage and signed URLs.
- Receipt numbers are generated by the database without ambiguous column references.
- Payment notes are visible in authorized payment histories.
- Payment View opens complete details, including purpose, description, notes, proof, payer, property/unit, date, and verification information.

## 15. Finance

### 15.1 Admin Finance

- Shows platform revenue and recorded subscription payments.
- Separates money by country.
- Includes landlords, IPMs, and PMCs as payer types.
- IPM must display as IPM, not Staff.
- Supports Record Payment, Edit, Delete, dates covered, amount, notes, and filters.
- Deleting/archiving a payer should not silently erase valid platform payment history; nullable payer references may display as Unassigned.

### 15.2 Landlord Finance

- Reports landlord rental revenue and related finance data.
- Supports filters, property selection, date range, charts where useful, and download/export.
- Free landlord plan includes finance for its allowed unit.
- Deposits remain separate from revenue.

### 15.3 IPM And PMC Finance

- Uses landlords instead of countries as the primary grouping.
- Shows the details of connected landlords.
- Includes Record Payment for payments made by landlords to the IPM/PMC.
- Supports edit/delete and partnership/contract date context.
- Dropped landlords no longer expose operational data, but legitimate IPM/PMC contract payment records may remain as the IPM/PMC's own financial history with an appropriate snapshot, subject to final retention policy.

## 16. IPM/PMC Landlord Relationships

Landlord list information should include as applicable:

- landlord name
- email
- phone
- property count
- tenant count
- permissions
- partnered/start date
- contract expiry date
- computed partnership status
- actions

Rules:

- Partnership status is derived consistently from relationship status and expiry.
- Both landlord and IPM/PMC can see partnered date, expiry date, and status.
- PMC Landlords View opens the expanded property/unit details for that landlord, not Dashboard and not an incomplete generic property page.
- IPM landlord list has equivalent useful columns and behavior.
- Search supports agreed identity and portfolio fields without leaking unrelated landlord data.
- Drop Landlord removes access and cached context from the IPM/PMC, while landlord-owned data remains intact.

## 17. Staff Lists And Assignment

- Admin IPM page lists only IPMs and pending IPM invites.
- Admin Staff page lists only Mushavo admin staff.
- Landlord Staff page lists personal landlord staff, eligible IPM requests/relationships, and PMC requests/relationships in clearly separate concepts.
- PMC Staff page lists only that PMC's internal staff.
- Accepted accounts and pending invites must not appear as duplicates.
- Pending rows include Copy Link, Edit Invite, and Delete where applicable.
- Accepted rows include the relevant Edit Permissions, Suspend/Reactivate, Archive/Unarchive, Delete, or Unassign actions based on role ownership.
- An accepted IPM with zero landlords is Active, not Pending Approval. Landlord approval applies to data access, not to whether the IPM account exists.

## 18. Public Website

### 18.1 Home

- Clearly explains what Mushavo is and who it benefits.
- Covers landlords, tenants, IPMs, and PMCs.
- Explains properties/units, rent and payments, leases/documents, maintenance, files, finance, and account collaboration.
- Uses the full available desktop width responsibly while remaining unchanged/responsive on phones.
- Logo is the brand; do not repeat a separate Mushavo text wordmark next to it if redundant.

### 18.2 About

- Includes company vision, mission, goals, values, and who Mushavo serves.
- Must match actual functionality and avoid unsupported claims.

### 18.3 Pricing

- Uses country-specific pricing for Zimbabwe and Malaysia.
- Supports monthly/yearly toggle.
- Yearly gives one month free.
- Clearly distinguishes Landlord, IPM, and PMC plans and allowances.
- Free landlord CTA goes to landlord signup.

### 18.4 Contact And Enquiries

- Country dropdown includes all countries, even unsupported markets.
- Submits directly to Supabase `enquiries`; do not open `mailto:`.
- Super admin sees all enquiries.
- Admin staff sees only enquiries from assigned countries.
- Success copy is customer-facing, for example: `Thank you. Your enquiry has been submitted successfully.`
- Never tell the customer that the team will review it `from the admin area` or expose internal workflow details.
- Enquiry form errors are friendly and do not expose Supabase internals.

## 19. Internationalization

- Supported languages:
  - English
  - Bahasa Melayu
  - Chinese
- `i18n.js` is the shared translation dictionary/system.
- Language selection persists in `localStorage` under `mushavo_language`.
- Translate all static and dynamically rendered UI text, including headings, labels, buttons, badges, empty states, dialogs, validation messages, table headings, and helper text.
- Do not translate user-created data: names, emails, property names, notes, filenames, or free-text descriptions.
- Do not translate the Mushavo brand.
- Dynamic mixed labels such as Unit 24 and Paid/Unpaid need explicit formatting support.
- A translation change must scan all public files and `client.html`, not only the reported screenshot.
- Grammar must be natural in each language; do not use broken word-by-word substitutions.

## 20. UI, Responsive Layout, And Dialogs

- Mobile-first and no page-level horizontal scrolling at 320, 375, or 430 px.
- Tablet and desktop must use more available width without breaking phone layouts.
- Wide tables may scroll inside their own `overflow-x-auto` container only.
- Use responsive widths, `min-w-0`, wrapping, and stacked mobile controls.
- Inputs, buttons, and cards must fit the viewport.
- Long text and emails wrap or truncate intentionally.
- Navigation uses a mobile drawer/hamburger where needed.
- Use clear, modern, professional styling with consistent spacing and accessible contrast.
- Do not hide real layout bugs with global overflow clipping.
- All dialogs must:
  - fit within the viewport
  - use a scrollable content region on small/short screens
  - keep Close, Cancel, and Save/Accept/Delete actions reachable
  - allow Escape and visible X close where appropriate
  - prevent the background page from scrolling while open
  - restore background scrolling when closed
- Do not use browser `alert()` or `confirm()` for product actions.
- Use in-app confirmation and success/error dialogs.
- Visible form labels are required; do not rely only on placeholders.

## 21. User-Facing Errors

- Wrong email/password: `The email or password is incorrect.`
- Existing account during signup: `Your account already exists. Please contact Mushavo Support.`
- Missing/deleted profile after valid Auth login: `Your account does not exist or has been removed. Please contact Mushavo Support.`
- Do not show `Your session could not be verified` for ordinary wrong credentials.
- Do not expose SQL function names, table names, policy names, constraints, SQLSTATE codes, or raw Supabase messages.
- Translate known error categories into specific actions:
  - plan limit reached
  - permission denied
  - duplicate relationship
  - invite expired/used
  - invalid credentials
  - account suspended
  - subscription/trial expired
  - upload type/size failure
  - temporary connection failure
- Keep developer details in console logging only when safe; customer UI gets a clean message.

## 22. Known Failure Patterns To Prevent

These are mistakes that previously caused the owner to repeat instructions.

1. Only one creation path was changed while another path kept old defaults.
   - Prevention: test direct signup, admin, admin staff, IPM, and PMC landlord creation as one matrix.
2. Admin staff landlord creation still used Starter - Trial.
   - Prevention: centralize free landlord defaults and call the same RPC/helper from every path.
3. Free - Active saved in admin but old status remained in landlord shell.
   - Prevention: save plan/status atomically, reload subscription, clear stale local state, and use one display helper.
4. Expired rows displayed Active because timestamps were parsed incorrectly.
   - Prevention: one date parser and one computed-status helper for lists, badges, filters, and lockout.
5. Trial was treated as suspended.
   - Prevention: separate stored status, computed expiry, and suspension logic.
6. Broad permissions exposed unrelated buttons.
   - Prevention: exact helpers for each action plus RLS/trigger checks.
7. Pages disappeared when permissions were absent.
   - Prevention: navigation visibility and action authorization are separate rules.
8. A zero plan limit was replaced by a default because `||` was used.
   - Prevention: use `??` and test zero explicitly.
9. Limit counts included accepted accounts and stale invites twice.
   - Prevention: reconcile records and count unique active/pending identities deliberately.
10. Approved and Invited duplicate rows appeared.
    - Prevention: one lifecycle record where possible; otherwise de-duplicate by invite/profile/email and mark invite used atomically.
11. Raw RLS and constraint messages reached users.
    - Prevention: pre-check known cases and centralize database error translation.
12. User duplication checks happened after Auth signup.
    - Prevention: duplicate email/phone RPC runs before creating Auth user; registration is atomic or cleans up on failure.
13. Modal footers and X buttons were unreachable on smaller screens.
    - Prevention: one shared viewport-safe modal component/pattern used by every dialog.
14. Property units opened at the bottom of the entire list.
    - Prevention: render the selected units panel immediately after its property card.
15. Edit forms were cramped inside cards.
    - Prevention: reuse the full-width top form or a properly sized responsive modal.
16. Staff assignment listed people outside the current scope.
    - Prevention: use a server-filtered eligible-assignee query and enforce assignment scope in SQL.
17. Tenant relationship deletion deleted or blocked a reusable global account.
    - Prevention: archive landlord relationship; preserve tenant Auth/profile.
18. Personal landlord staff deletion left Auth behind.
    - Prevention: personal staff delete RPC removes Auth/profile and allows re-invite; IPM unassignment does not delete IPM identity.
19. Auth refresh on tab focus reset the page to Dashboard.
    - Prevention: ignore same-user refresh events and preserve current shell/page.
20. RLS policies caused infinite recursion.
    - Prevention: use carefully scoped security-definer helpers instead of policies querying each other.
21. New enum values were used before their transaction committed.
    - Prevention: add enum values in a committed migration step before using them in constraints/policies.
22. SQL references were ambiguous, such as receipt year.
    - Prevention: qualify columns and parameters consistently.
23. `ON CONFLICT` targeted columns without a matching unique constraint.
    - Prevention: add/verify the intended unique constraint before using the conflict target.
24. Translation was added only to obvious navigation labels.
    - Prevention: scan all rendered text and test each role/page in all supported languages.
25. Internal implementation wording appeared in customer messages.
    - Prevention: review success/error text from the customer's perspective.

## 23. Required Regression Matrices

### 23.1 Landlord Creation Matrix

Test all five routes:

| Route | Expected result |
|---|---|
| Direct landlord signup | Active - Free and free limits |
| Super admin invite | Active - Free and free limits |
| Admin staff invite | Active - Free and free limits |
| IPM invite | Active - Free, pending IPM request, no IPM access yet |
| PMC invite | Active - Free, pending PMC request, no PMC access yet |

Verify only one profile, one active subscription, and one visible relationship/invite lifecycle per account.

### 23.2 Subscription Matrix

Test for landlord, IPM, and PMC where supported:

- Free - Active
- paid plan - Trial before expiry
- paid plan - Trial after expiry
- paid plan - Active before expiry
- paid plan - Active after expiry
- Suspended before expiry
- Suspended after expiry
- missing/malformed old expiry data

Verify admin list, top badge, My Account, filters, and lockout page agree.

### 23.3 Permission Matrix

For landlord staff, IPM, PMC, and PMC staff:

- each parent permission alone
- each child with parent off
- each child with parent on
- every sibling off while one action is on
- direct database write attempt with UI bypassed
- PMC staff narrower than PMC grant

Verify page remains visible, unauthorized controls/details are hidden, and backend denies unauthorized writes.

### 23.4 Deletion Matrix

- archive tenant relationship, then connect same tenant to another landlord
- delete personal landlord staff, then re-invite same email
- unassign IPM without deleting IPM account
- drop landlord from PMC/IPM and confirm data disappears only from partner view
- archive/unarchive users as admin
- permanently delete as admin with history behavior verified

### 23.5 Responsive Matrix

Test at:

- 320 px
- 375 px
- 430 px
- 768 px
- 1024 px
- wide desktop

Check every dialog, table, navigation drawer, form, long email, action group, and expanded property/unit panel.

### 23.6 Language Matrix

For English, Bahasa Melayu, and Chinese, inspect:

- public pages
- login/signup/invite screens
- admin and admin staff
- landlord and landlord staff
- IPM
- PMC leader and PMC staff
- tenant
- all dialogs, errors, empty states, badges, and table headings

## 24. Technical Verification Before Handoff

For every frontend change:

1. Parse-check all inline JavaScript in changed HTML files.
2. Run `node --check` on `i18n.js` when changed.
3. Search for accidental old branding, secrets, mojibake, TODOs, stubs, and placeholder logic.
4. Verify referenced RPC names exist in SQL.
5. Verify SQL functions use columns that exist and conflict targets have matching unique constraints.
6. Confirm RLS allows the intended role and rejects an out-of-scope role.
7. Check that raw Supabase errors are translated.
8. Check mobile dialogs and page overflow.
9. Synchronize source and output copies.
10. State clearly if SQL still needs to be run by the owner.

Suggested scans:


## 25. Before Marking A Task Complete

Answer these questions:

- Did I find every path that implements this rule?
- Did I update frontend and database enforcement where needed?
- Did I test the role that reported the bug and all other affected roles?
- Did I preserve zero values and avoid duplicate counting?
- Did I update existing rows instead of creating duplicate lifecycle rows?
- Did I check archive, delete, unassign, and historical-record consequences?
- Did I check all supported languages?
- Did I check small-screen dialogs and horizontal overflow?
- Did I replace raw technical errors with customer-facing text?
- Did I update this rules file if the product decision changed?

Do not mark the work complete if a required answer is unknown. Report the exact unverified area instead.
if something is undefined or does not make logical sense, you may ask the user questions related to it to make sense out of it. 