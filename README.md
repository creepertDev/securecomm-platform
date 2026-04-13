# SecureComm Platform

A secure, end-to-end encrypted communication platform built for defence personnel. Designed from the ground up with data containment in mind — no external forwarding, no screenshots, no exports. All infrastructure runs on India-hosted servers.

---

## What it does

- **Encrypted group messaging** — HQ creates and controls all groups. Users cannot create their own.
- **Membership verification** — every user submits a join request with their credentials. HQ manually approves or rejects access.
- **Device key enforcement** — every WebSocket connection must present a pre-shared device key. Unauthorised connections are dropped at the socket level before any data is exchanged.
- **Screenshot & screen-recording protection** — a solid overlay fires synchronously on `visibilitychange` and `pagehide`, covering the app before iOS/Android can grab a recents thumbnail.
- **Copy/paste blocking** — `copy`, `cut`, and `contextmenu` events are intercepted at the capture phase. Long-press selection on message bubbles is collapsed immediately via `selectionchange`.
- **Session logging** — all activity is logged and visible to HQ via the admin dashboard.
- **HQ admin dashboard** — approve/reject users, manage groups, monitor sessions, view connected clients in real time.

---

## Tech Stack

### Backend
- **Node.js + Express v5** — REST API + static file serving for both the mobile web app and admin dashboard
- **WebSocket (`ws`)** — real-time messaging, live presence, HQ broadcast
- **PostgreSQL** — persistent storage for users, groups, messages, session logs
- **JWT + bcrypt** — token-based auth, passwords hashed at rest
- **Cloudflare Tunnel** — exposes the local server publicly without opening ports; no inbound firewall rules needed

### Mobile Web App (`/app`)
- **React 19 + Vite** — PWA-style mobile web app, served at `inv.works/app`
- **React Router v7** — client-side routing across login, register, chat, groups screens
- **Plain CSS** — no UI library, fully custom dark theme built for small screens
- **Native WebSocket** — real-time connection with device key authentication

### Admin Dashboard (`/hq`)
- **React 19 + Vite + Tailwind CSS** — HQ control panel, served at `inv.works/hq`
- **React Router v7** — multi-page dashboard (users, groups, sessions, logs)

### Infrastructure
- **PM2** — process manager running three services: backend, Cloudflare tunnel, DDNS updater
- **Cloudflare DDNS** — custom script that updates the `wg.inv.works` A record whenever the machine's public IP changes
- **`inv.works`** — domain managed via Cloudflare DNS

---

## Project Structure

```
securecomm-platform/
├── backend/              # Node.js API server
│   ├── server.js         # Express + WebSocket + all route handlers
│   ├── db.js             # PostgreSQL pool + schema init
│   ├── ddns.js           # Cloudflare DDNS updater
│   └── wg.js             # WireGuard helpers (future)
├── mobile-web/           # React mobile web app (production)
│   └── src/
│       ├── main.jsx      # Security layer (shield, copy/paste protection)
│       ├── App.jsx       # Router + auth context
│       └── screens/      # Login, Register, Chat, Groups, Pending, Rejected
├── admin-dashboard/      # React HQ dashboard
│   └── src/
│       ├── pages/        # Users, Groups, Sessions, Logs
│       └── components/   # Tables, modals, status indicators
├── mobile/               # Flutter app (iOS/Android, in progress)
└── ecosystem.config.cjs  # PM2 process definitions
```

---

## Running it

### Prerequisites
- Node.js 20+
- PostgreSQL running locally on port 5432
- `cloudflared` installed and tunnel configured
- PM2 installed globally (`npm i -g pm2`)

### Start everything
```bash
pm2 start ecosystem.config.cjs
pm2 save
```

This starts three processes:

| Process | What it does |
|---|---|
| `securecomm-backend` | API server on port 3000, serves `/app` and `/hq` |
| `securecomm-tunnel` | Cloudflare tunnel → exposes port 3000 publicly |
| `securecomm-ddns` | Polls public IP and updates Cloudflare A record every 5 minutes |

### Build the frontend apps
```bash
# Mobile web app
cd mobile-web && npm install && npm run build

# Admin dashboard
cd admin-dashboard && npm install && npm run build
```

Express serves the `dist/` folders automatically — no separate web server needed.

### Environment variables

Fill in a `.env` file inside `backend/`:

```
PORT=3000
JWT_SECRET=
HQ_PASSWORD=
DEVICE_KEY=
DB_URL=postgresql://user:pass@localhost:5432/securecomm
PUBLIC_URL=https://your-domain.com
CF_API_TOKEN=
CF_ZONE_ID=
```

---

## Security model

| Threat | Mitigation |
|---|---|
| Unauthorised WebSocket connections | Device key checked before socket handshake completes |
| Screenshot / screen recording | Synchronous DOM overlay on `visibilitychange` + `pagehide` |
| Copy/paste data exfiltration | `copy`/`cut`/`contextmenu` blocked at capture phase; `selectionchange` clears any selection outside inputs |
| Unauthenticated API access | JWT required on all protected routes |
| Credential exposure | Passwords hashed with bcrypt (10 rounds), never stored in plaintext |
| Unauthorised group access | Group membership controlled exclusively by HQ |

---

## Out of scope (by design)

- File and multimedia sharing
- Integration with commercial platforms (WhatsApp, Telegram, etc.)
- Cross-platform message forwarding
- Public group creation by users
- Cloud storage sync
- AI-powered features
- Social media integration

---

## License

See `LICENSE`.
