# GC Travel & Tours — MCP Server Setup Guide

## What this does
This MCP server gives Base44's AI 5 powerful tools to use for GC Travel:

| Tool | What it does |
|---|---|
| `search_tours` | Search packages by destination, budget, duration |
| `get_tour_details` | Get full info on a specific tour |
| `create_booking` | Create a booking for a customer |
| `check_availability` | Check slots on a date for a group size |
| `get_booking_status` | Look up an existing booking by ID |

---

## Step 1 — Run locally first (test it works)

```bash
# Install dependencies
npm install

# Run in dev mode
npm run dev

# You should see:
# 🌴 GC Travel & Tours MCP Server running!
#    MCP URL: http://localhost:3000/mcp
```

Open http://localhost:3000/ in your browser — you should see the server info JSON.

---

## Step 2 — Deploy to Railway (free, takes 2 minutes)

Railway is the easiest way to get a public HTTPS URL for Base44.

1. Go to **railway.app** and sign up (free)
2. Click **New Project → Deploy from GitHub repo**
3. Connect this repo (push `gc-travel-mcp/` to a GitHub repo first)
4. Railway auto-detects Node.js and deploys
5. Go to **Settings → Networking → Generate Domain**
6. Your MCP URL will be: `https://your-app-name.railway.app/mcp`

**Environment variables to add in Railway dashboard:**
```
BASE_URL = https://your-app-name.railway.app
```

---

## Step 3 — Add to Base44

1. Open your GC Travel app in **Base44**
2. Go to **Settings → Connectors → Add Custom MCP**
3. Paste your URL: `https://your-app-name.railway.app/mcp`
4. Click **Connect**
5. Base44 will discover all 5 tools automatically

---

## Step 4 — Test it in Base44

In your Base44 app, try prompting the AI:

- *"Search for tours to Palawan under ₱20,000"*
- *"Book the Boracay Beach Escape for 2 people on March 15"*
- *"Is the Siargao Surf tour available for 4 people on April 10?"*
- *"What's the status of booking BK1234567890?"*

---

## Step 5 — Connect real Base44 data (optional upgrade)

Right now the server uses demo data. To connect your real Base44 entities:

1. Install the Base44 SDK:
   ```bash
   npm install @base44/sdk
   ```

2. In `src/index.ts`, replace the demo arrays with real calls:
   ```typescript
   import { createClient } from "@base44/sdk";
   const base44 = createClient({ appId: process.env.BASE44_APP_ID });

   // In search_tours tool:
   const results = await base44.entities.Tour.list({ destination });

   // In create_booking tool:
   await base44.entities.Booking.create(booking);
   ```

---

## Alternative deployment options

| Platform | Free tier | Deploy command |
|---|---|---|
| **Railway** | 500hrs/month | Push to GitHub → auto deploy |
| **Render** | 750hrs/month | Push to GitHub → auto deploy |
| **Fly.io** | 3 VMs free | `flyctl deploy` |
| **Vercel** | Unlimited | `vercel deploy` (needs adapter) |
