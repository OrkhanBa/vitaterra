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
All data is stored in the browser's `localStorage`. This means:
- Data persists on the same browser/device
- For multi-device use, consider upgrading to a backend (Supabase, Firebase, etc.)

<!-- deploy pipeline test: 2026-05-18T11:54:46Z -->
