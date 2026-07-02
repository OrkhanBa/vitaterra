# Vita Terra Website

## Structure
```
vitaterra/
├── index.html          ← Public website (EN/AZ bilingual)
├── css/
│   ├── style.css       ← Main public site styles
│   ├── dashboard.css   ← Admin & Sales dashboard styles
│   └── sales-extra.css ← Sales portal extras
├── js/
│   ├── data.js         ← Shared data layer (localStorage)
│   └── main.js         ← Public site logic
├── admin/
│   ├── index.html      ← Admin dashboard
│   └── admin.js        ← Admin logic
├── sales/
│   ├── index.html      ← Sales portal
│   └── sales.js        ← Sales logic
└── netlify.toml        ← Netlify config
```

## Default Passwords
- **Admin:** `admin2025`
- **Sales:** `sales2025`

Change both immediately in Admin → Settings after first login.

## Deploying to Netlify

### Option A: Drag & Drop
1. Go to https://app.netlify.com
2. Click **Add new site → Deploy manually**
3. Drag the entire `vitaterra/` folder onto the upload zone
4. Done — your site is live!

### Option B: GitHub
1. Push this folder to a GitHub repo
2. In Netlify: **Add new site → Import from Git**
3. Select the repo, set publish directory to `/` (root)
4. Deploy

## Importing Your Excel File
1. Log in to Admin Portal (`/admin`)
2. Go to **Import Excel**
3. Upload your `.xlsx` file
4. Required columns: `name`, `sku`, `category`, `costPrice`, `stock`, `unitSize`
5. Click **Import** — products are merged/added instantly

## How Pricing Works
- **Cost Price** is stored in admin only, never shown to customers or sales team
- **Markup %** is set globally in Admin → Settings (default: 30%)
- **Sale Price** = Cost Price × (1 + Markup%)
- Sales team only sees sale prices, never cost prices

## Data Storage
- **Products, site content, sales-users logins**: `localStorage`, published to GitHub (`products.json`, `site-content.json`, `sales-users.json`) via the "Publish" button in the admin panel.
- **Sales + activity log (audit trail)**: `localStorage` (instant local cache) synced in real time to a Supabase Postgres database — no GitHub push needed per sale. This is what makes a sale confirmed on one device visible to the admin on any other device.
  - Project: `VitaTerra` (Supabase, `eu-central-1`), tables `sales` and `activity_log`.
  - Client uses the public anon key (`SUPABASE_URL` / `SUPABASE_ANON_KEY` constants in `index.html`) with Row Level Security allowing insert/select/update but never delete — voids are soft-deletes (`voided` flag), so the admin Activity Log always keeps a full, un-erasable history.
  - Admin panel pulls the latest rows from Supabase in the background whenever the dashboard, Sales Log, or Activity Log tab is opened, or via the "☁️ Sinxronlaşdır" button.
- **Stock (inventory)**: `products.json`'s `stock` field is only a snapshot from the last Publish. The Supabase `inventory` table (`product_id`, `stock`) is now the live, cross-device source of truth — every stock change (sale confirm/edit/void, admin stock edits, bulk imports) goes through the central `saveProducts()` write point in `index.html`, which diffs against the previous snapshot and pushes only what changed to `inventory`. Every device pulls the latest `inventory` rows on the same 15s auto-sync/tab-open cycle as sales, so two salespeople never oversell the same batch.
- **Warehouse fulfillment ("Anbar")**: confirming a sale generates a human-readable **Satış ID** (`VT-YYMMDD-####`) shared by every line item in that checkout. The Sales portal's **📦 Anbar** tab groups sales by that ID into one order/slip with a status (`Anbarda` → `Çatdırıldı`) that any sales rep can change; every change is appended to the Supabase `warehouse_status_log` table (`sale_id`, `status`, `changed_by`, `changed_at`) so the full dated history of when goods left the warehouse is preserved and visible from any device. Each order can be re-exported at any time as a printable release-slip PDF (see below).
- **Warehouse release slip (PDF)**: right after a sale is confirmed — and again anytime from the Anbar tab's "🖨 Sənəd" button — the app generates a PDF (via `jsPDF`, loaded from CDN) listing the Satış ID, date, customer, salesperson, line items and signature lines, meant to be physically handed to warehouse staff so they release exactly those products.
