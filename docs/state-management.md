# State management

Browser state uses the namespace `mushavo:v2:{profile_id}:{role}:{key}`. This prevents selected landlord, property, unit, tab, and scroll state from bleeding between accounts or roles on a shared browser.

The app shell stores the current internal view and its scroll position. Realtime refreshes call the current view loader with `quiet: true`, preserving the DOM shell and navigation state. IPM and PMC landlord context will use separate keys because the role is part of the namespace.

Realtime table routing is defined in `assets/js/realtime.js`. A table event is ignored unless the current open view depends on that table.
