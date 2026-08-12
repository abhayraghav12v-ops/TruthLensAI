# TruthLens AI

Deepfake / AI-media detection demo: React + Vite frontend and Express backend powered by [Sightengine](https://sightengine.com/docs).

## Environment variables

Copy the server example env and fill in your Sightengine credentials:

```bash
cd server
copy .env.example .env
```

Required in `server/.env`:

| Variable | Description |
| --- | --- |
| `SIGHTENGINE_API_USER` | Sightengine API user id |
| `SIGHTENGINE_API_SECRET` | Sightengine API secret |
| `PORT` | Optional, defaults to `3001` |

Do **not** put keys in the frontend — only the Express server talks to Sightengine.

## Run (two terminals)

**1. Backend**

```bash
cd server
npm install
# create .env from .env.example and fill keys
npm run dev
```

API: `http://localhost:3001`  
Health check: `GET /api/v1/health`

**2. Frontend**

```bash
# from project root
npm install
npm run dev
```

App: `http://localhost:5173`  
Vite proxies `/api` → `http://localhost:3001`.

## API routes

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/v1/verify` | Multipart upload (`file`) → Sightengine → verification result |
| `GET` | `/api/v1/verifications` | Stored verification history |
| `GET` | `/api/v1/dashboard-stats` | Aggregated stats |
| `GET` | `/api/v1/notifications` | Notifications derived from scans |
| `GET` | `/api/v1/activity` | Activity feed |

Results are stored in `server/data.json` (created automatically).
