# Mushavo

Static Mushavo build created from the supplied continuation prompt and current rules.

Files:

- `index.html`: public home page
- `about.html`: public about page
- `pricing.html`: public pricing page
- `contact.html`: public contact/enquiry page
- `client.html`: client area shell
- `i18n.js`: shared English, Bahasa Melayu, and Chinese translation layer
- `rentradar_loop1_schema.sql`: Supabase starter schema, RLS, and RPC setup
- `mushavo-logo.png`: generated brand image

`client.html` and `contact.html` are configured with the supplied Supabase URL and public anon key. Use only the public anon key in browser code.
