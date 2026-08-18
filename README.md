# Water Billing System – Harcourts Golden Links
## Vercel Deployment Guide

### Project structure
```
water-billing/
├── water-billing-app.html   ← Main app (all PMs use this URL)
├── api/
│   └── monday.js            ← Serverless proxy (keeps Token secret)
├── vercel.json              ← Vercel routing config
├── get-column-ids.js        ← One-time helper to find real column IDs
└── README.md
```

---

## Step 1 — Get your real Monday column IDs (IMPORTANT)

Monday auto-generates column IDs that don't match the column title.
Run this once before deploying:

```bash
# Edit get-column-ids.js — fill in your token and board ID, then:
node get-column-ids.js
```

It will print something like:
```
const COL = {
  // "Status" (color)
  status: 'status',
  // "Property Address" (text)
  property_address: 'text',
  // "Client Name" (text)
  client_name: 'text7',     ← this is what you need
  ...
}
```

Copy those values into `api/monday.js` in the `COL = { ... }` block.

---

## Step 2 — Push to GitHub

Create a **private** repo and push all files:
```bash
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/YOUR_ORG/gl-water-billing.git
git push -u origin main
```

---

## Step 3 — Deploy to Vercel

1. vercel.com → **New Project** → Import your GitHub repo
2. Leave all build settings as default → **Deploy**

---

## Step 4 — Add Environment Variables (ONE TIME ONLY)

Vercel project dashboard → **Settings → Environment Variables**:

| Name | Value |
|------|-------|
| `MONDAY_TOKEN` | Your Monday.com API token |
| `MONDAY_BOARD_ID` | Your board ID (numbers only) |

After adding → click **Redeploy**.

---

## Step 5 — Share URL with PMs

Your URL will be:
```
https://gl-water-billing.vercel.app/water-billing-app.html
```

**Bookmark and share this.** No login, no config for any PM.

---

## Monday.com Board Column Reference

| Column Title         | Type     | Notes                        |
|----------------------|----------|------------------------------|
| Status               | Status   | Auto-set: New → Completed    |
| Property Address     | Text     |                              |
| Client Name          | Text     |                              |
| Agent / Staff        | Text     |                              |
| Last Reading Date    | Date     |                              |
| Last Reading         | Numbers  |                              |
| Current Reading Date | Date     |                              |
| Current Reading      | Numbers  |                              |
| Total Usage          | Numbers  | Auto-calculated              |
| Water Rate           | Numbers  |                              |
| Wastewater Rate      | Numbers  |                              |
| Wastewater Usage     | Numbers  | Auto-calculated              |
| Water Amount         | Numbers  | Auto-calculated              |
| Wastewater Amount    | Numbers  | Auto-calculated              |
| Total Amount Due     | Numbers  | Auto-calculated              |
| Invoice PDF          | File     | Original invoice             |
| Meter Photos         | File     | All meter photos uploaded    |
| Water Bill PDF       | File     | WaterCare bill               |
| Power Bill PDF       | File     | Optional                     |
| Final Merged PDF     | File     | Auto-generated merged PDF    |
| Error Message        | Long Text| Auto-filled if sync fails    |

Status flow:  **New** (on create) → **Completed** (all uploads done) → **Error** (if something fails)

---

## Updating the app

Push to GitHub → Vercel auto-redeploys in ~30 seconds.
