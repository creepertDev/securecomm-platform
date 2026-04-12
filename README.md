# SecureComm Platform

Defence personnel secure messaging platform.

## Structure

- `backend/` — Node.js WebSocket server with Express, PostgreSQL, JWT auth
- `mobile/` — Flutter mobile app for iOS/Android
- `admin-dashboard/` — React/Vite admin dashboard

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
node server.js
```

## Mobile Setup

```bash
cd mobile
flutter pub get
flutter run
```

## Admin Dashboard Setup

```bash
cd admin-dashboard
npm install
npm run dev
```
