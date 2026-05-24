# 🏦 Bourse Tracker — Marrakech

A real-time map app for international students at Marrakech to share which Bank Populaire branches are currently paying out the monthly bourse (scholarship stipend).

## How it works

- Map shows all Bank Populaire branches in Marrakech
- **yellow** = not yet reported today
- **Green** = bourse available (someone just withdrew there)
- **Red** = no bourse (hit the daily limit)
- All statuses **auto-reset every 24 hours**
- Admin sets the bourse period (start/end date) — outside those dates, nobody can report

---

## Run locally

### Requirements
- Node.js v18+

### Steps

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Then open http://localhost:3000 in your browser.

---

## Deploy online (free options)

### Option 1 — Railway (easiest, free tier)
1. Go to https://railway.app and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Upload this folder to a GitHub repo first, then connect it
4. Railway will auto-detect Node.js and deploy
5. You get a public URL like `https://bourse-tracker.up.railway.app`

### Option 2 — Render (also free)
1. Go to https://render.com
2. New → Web Service → connect your GitHub repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Free tier gives you a public URL

### Option 3 — Run on your own computer and share via ngrok
```bash
# Install ngrok from https://ngrok.com
npm start &
ngrok http 3000
# Share the ngrok URL with your friends
```

---

## Admin panel

Click **⚙ Admin** in the top right to:
- Set the bourse start and end dates for the month
- Reset all bank statuses manually

---

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/statuses` | Get all current bank statuses |
| POST | `/api/status` | Report a bank status `{bankId, status}` |
| GET | `/api/period` | Get current bourse period |
| POST | `/api/period` | Set bourse period `{startDate, endDate}` |
| DELETE | `/api/statuses` | Reset all statuses |

---

## Tech stack
- **Backend**: Node.js + Express + sql.js (SQLite in memory, persisted to file)
- **Frontend**: Vanilla HTML/CSS/JS + Leaflet.js maps
- **Database**: `bourse.db` (auto-created on first run)
