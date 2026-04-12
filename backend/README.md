# SecureComm — Defence Communication Platform
## Real-Time Chat Demo Setup

---

## QUICK START (3 steps)

### Step 1 — Install Node.js on your laptop
Download from https://nodejs.org (LTS version)

### Step 2 — Run the server on your laptop
```
# Extract the ZIP, open terminal in the securecomm folder, then:
npm install
node server.js
```

You'll see:
```
╔══════════════════════════════════════════╗
║       SECURECOMM SERVER RUNNING          ║
║  Network:  http://192.168.x.x:3000       ║
╚══════════════════════════════════════════╝
```

### Step 3 — Connect phones
1. Make sure phones and laptop are on the **same WiFi network**
2. On each phone, open the browser and go to: `http://192.168.x.x:3000`
   (use your actual IP shown in the terminal)
3. Or open `http://localhost:3000/admin.html` on your laptop to see a QR code — scan it on phones

---

## WHAT EACH URL DOES

| URL | Purpose |
|-----|---------|
| `http://[ip]:3000` | Mobile chat app (open on phones) |
| `http://localhost:3000/admin.html` | HQ Admin monitor (open on laptop) |
| `http://localhost:3000/status` | JSON status API |
| `http://localhost:3000/qr` | QR code for phone connection |

---

## FEATURES

- **Real-time messaging** — WebSocket push delivery, < 50ms on LAN
- **Multiple users** — as many phones as you want on the same WiFi
- **Message history** — last 200 messages stored in memory, shown to new joiners
- **Typing indicators** — live "X is typing…" display
- **Online presence** — see who's connected in real time
- **HQ Admin monitor** — laptop view shows all messages + online users + live audit log
- **Auto-reconnect** — phones reconnect automatically if connection drops

---

## TROUBLESHOOTING

**Phones can't connect?**
- Check phones and laptop are on the **same WiFi** (not mobile data)
- Disable laptop firewall temporarily, or allow port 3000
- Try typing the IP manually in the phone browser
- On Windows: run `ipconfig` to find your IP. On Mac/Linux: run `ifconfig` or `ip addr`

**Windows firewall:**
```
netsh advfirewall firewall add rule name="SecureComm" dir=in action=allow protocol=TCP localport=3000
```

**Change port:**
```
PORT=8080 node server.js
```

---

## ARCHITECTURE

```
[Phone 1 Browser] ──WebSocket──┐
[Phone 2 Browser] ──WebSocket──┤── Node.js Server (laptop) ── HTTP/WS
[Phone N Browser] ──WebSocket──┘         port 3000
[Admin Browser]   ──WebSocket──┘
```

All communication is over WebSocket on your local WiFi.
No data leaves your network — fully self-contained.
