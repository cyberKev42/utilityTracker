# Technology Stack

**Analysis Date:** 2026-03-18

## Languages

**Primary:**
- JavaScript (ES6+) - Used across frontend and backend
- JSX - React component syntax in frontend

**Version:**
- Node.js 20.x (required for both backend and frontend)

## Runtime

**Environment:**
- Node.js 20.x

**Package Manager:**
- npm (v10+)
- Lockfiles: `package-lock.json` in both `/frontend` and `/backend`

## Frameworks

**Frontend:**
- React 19.1.0 - UI library and component framework
- React Router 7.13.0 - Client-side routing
- Vite 6.3.5 - Build tool and dev server
- Tailwind CSS 3.4.17 - Utility-first CSS framework
- Framer Motion 11.18.2 - Animation library

**Backend:**
- Express 5.1.0 - Web framework and HTTP server

**Testing:**
- Not currently implemented

**Build/Dev:**
- Vite - Frontend dev server (port 5300) and production bundler
- Nodemon 3.1.11 - Dev server auto-reload for backend
- Nixpacks - Container build system (Railway deployment)
- PostCSS 8.5.4 - CSS transformation
- Autoprefixer 10.4.21 - CSS vendor prefix addition

## Key Dependencies

**Frontend Critical:**
- `@supabase/supabase-js` 2.97.0 - Supabase client for auth and real-time DB access
- `react-router-dom` 7.13.0 - Routing
- `recharts` 3.7.0 - Data visualization charts
- `framer-motion` 11.18.2 - Smooth animations
- `i18next` 25.8.13 - Internationalization (i18n)
- `react-i18next` 16.5.4 - React i18n integration
- `i18next-browser-languagedetector` 8.2.1 - Auto language detection
- `@radix-ui/react-dialog` 1.1.4 - Accessible dialog component
- `clsx` 2.1.1 - Conditional CSS class merging

**Backend Critical:**
- `@supabase/supabase-js` 2.49.1 - Supabase admin client
- `pg` 8.13.1 - PostgreSQL driver for direct database queries
- `express` 5.1.0 - HTTP server framework
- `cors` 2.8.6 - Cross-origin resource sharing middleware
- `dotenv` 16.5.0 - Environment variable loading

**UI/Styling:**
- `tailwindcss` 3.4.17 - Utility-first CSS
- `class-variance-authority` 0.7.1 - Component variants utility
- `tailwind-merge` 2.6.0 - Merge Tailwind classes without conflicts
- `react-icons` 5.5.0 - Icon library

**Utilities:**
- `serve` 14.2.4 - Static file server for production frontend

## Configuration

**Environment Variables:**

Frontend (`/frontend/.env.local`):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous public key for client-side auth
- `VITE_API_URL` - Backend API base URL (defaults to empty string for same-origin)

Backend (`/backend/.env`):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for admin operations
- `PORT` - Server port (defaults to 3000)
- `FRONTEND_URL` - Allowed CORS origin
- Database connection (one of):
  - `DB_URL_OVERRIDE`
  - `DATABASE_URL`
  - `POSTGRES_URL`
  - `POSTGRESQL_URL`
  - `SUPABASE_DB_URL`
  - `SUPABASE_DATABASE_URL`

**Build Configuration:**
- `vite.config.js` - Vite build and dev server settings
- `tailwind.config.js` - Tailwind CSS theme customization
- `postcss.config.js` - PostCSS plugins (Tailwind, Autoprefixer)
- Backend entry: `server.js`
- Frontend entry: `src/main.jsx`

## Platform Requirements

**Development:**
- Node.js 20.x
- npm
- Unix-like shell (for dev scripts)
- Modern browser (Chrome/Safari/Firefox/Edge)

**Production:**
- Node.js 20.x runtime
- Railway.app (current deployment platform)
- PostgreSQL database (Supabase or self-hosted)
- Static hosting for frontend (served via `npx serve`)

## Port Configuration

**Development:**
- Frontend: Port 5300 (Vite dev server)
- Backend: Port 3000 (Express server)

**Production:**
- Frontend: Port 3000 (served by `npx serve`)
- Backend: Port configurable via `PORT` env var (Railway-assigned)

## Deployment

**Infrastructure:**
- Railway.app with nixpacks builder
- Monorepo setup: separate services for `/backend` and `/frontend`
- Health checks configured:
  - Backend: `/api/health` endpoint
  - Frontend: `/` root path

**Build Process (Railway):**

Backend:
1. Install: `npm install`
2. Start: `npm start` (runs `node server.js`)

Frontend:
1. Install: `npm install`
2. Build: `npm run build` (Vite bundle)
3. Start: `npx serve dist -s -l $PORT`

---

*Stack analysis: 2026-03-18*
