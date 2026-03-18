# Integrations

## Database

### PostgreSQL
- **Client:** `pg` (v8.13.1) with connection pooling (`pg.Pool`)
- **Connection:** SSL enabled (`rejectUnauthorized: false`)
- **Config file:** `backend/db.js`
- **Connection string env vars** (checked in order):
  - `DB_URL_OVERRIDE`
  - `DATABASE_URL`
  - `POSTGRES_URL`
  - `POSTGRESQL_URL`
  - `SUPABASE_DB_URL`
  - `SUPABASE_DATABASE_URL`

### Tables
- `utility_entries` — electricity, water, fuel usage records
- `utility_settings` — unit price settings per utility type
- User management handled by Supabase Auth (no local users table)

## Authentication

### Supabase Auth
- **Backend:** `@supabase/supabase-js` v2.49.1 with Service Role Key
- **Frontend:** `@supabase/supabase-js` v2.97.0 with Anon Key
- **Config:** `backend/config/supabase.js`, `frontend/src/lib/supabase.js`

**Auth flow:**
1. Frontend registers/logs in via `supabase.auth.signUp` / `signInWithPassword`
2. Supabase returns session with `access_token`
3. Frontend API wrapper auto-attaches `Authorization: Bearer <token>` header
4. Backend middleware (`backend/middleware/auth.js`) verifies via `supabase.auth.getUser(token)`
5. Valid token → `req.user` attached to request

**Env vars:**
- `SUPABASE_URL` — Supabase project URL (backend)
- `SUPABASE_SERVICE_ROLE_KEY` — Service role JWT (backend)
- `VITE_SUPABASE_URL` — Supabase project URL (frontend)
- `VITE_SUPABASE_ANON_KEY` — Anon key JWT (frontend)

## REST API

### Backend Endpoints
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/register` | No | Create user account |
| POST | `/api/auth/login` | No | Sign in |
| GET | `/api/auth/me` | Yes | Current user info |
| POST | `/api/entries` | Yes | Create utility entry |
| GET | `/api/entries` | Yes | List entries (filter by type/date) |
| GET | `/api/entries/stats` | Yes | Aggregate statistics |
| GET | `/api/entries/trend` | Yes | Trend data |
| DELETE | `/api/entries/:id` | Yes | Delete entry |
| GET | `/api/entries/breakdown/:type` | Yes | Year/month breakdown |
| GET | `/api/settings/:type` | Yes | Get unit price setting |
| GET | `/api/health` | No | Health check |

### Frontend API Client
- **File:** `frontend/src/api.js`
- Fetch wrapper with methods: `get`, `post`, `put`, `delete`
- Auto-attaches Bearer token from Supabase session
- Throws errors with `.status` property for HTTP status codes

## Deployment

### Railway
- **Config:** `railway.toml` (monorepo root)
- **Builder:** Nixpacks for both services
- **Backend:** Node.js 20, `npm start`, health check at `/api/health` (300s timeout)
- **Frontend:** Node.js 20, `npm install && npm run build`, served via `npx serve dist -s -l $PORT`
- **Env vars:** `PORT` (backend), `FRONTEND_URL` (CORS), `VERCEL_URL` (dynamic CORS fallback)

## External Dependencies Summary
- **Supabase** — Auth + hosted PostgreSQL
- **Railway** — Deployment platform (monorepo)
- **No other external APIs** — self-contained application
