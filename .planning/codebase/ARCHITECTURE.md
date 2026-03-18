# Architecture

**Analysis Date:** 2026-03-18

## Pattern Overview

**Overall:** Layered MVC (Model-View-Controller) architecture with separation of concerns across frontend and backend, using token-based authentication and REST API communication.

**Key Characteristics:**
- Frontend and backend are decoupled microservices communicating via HTTP API
- Backend uses Express.js with route-controller-service pattern
- Frontend uses React with context API for state management
- Database-agnostic at application layer (services abstract DB operations)
- Supabase for authentication across both frontend and backend
- PostgreSQL database accessed via pg driver with connection pooling

## Layers

**Frontend View Layer:**
- Purpose: Render UI components and handle user interactions
- Location: `frontend/src/pages/`, `frontend/src/components/`
- Contains: Page components (Dashboard, AddEntry, Entries, Statistics, Settings), UI components (Card, Button, Input), chart components (DistributionPieChart, CategoryBarChart, SpendingLineChart)
- Depends on: Services layer, Context layer, i18n
- Used by: Layouts and routing system

**Frontend Context/State Layer:**
- Purpose: Manage global application state (authentication, language)
- Location: `frontend/src/context/AuthContext.jsx`, `frontend/src/context/LanguageContext.jsx`
- Contains: AuthProvider (user session, login/register/logout), LanguageProvider (i18n state)
- Depends on: Supabase auth client, i18next
- Used by: All pages and components via hooks

**Frontend Services Layer:**
- Purpose: Abstract API calls and provide business logic to components
- Location: `frontend/src/services/entriesService.js`
- Contains: Functions for entries CRUD, stats fetching, trend calculation, breakdown queries
- Depends on: API client (`frontend/src/api.js`), Supabase auth
- Used by: Page components for data operations

**Frontend API Client:**
- Purpose: Handle HTTP communication with backend
- Location: `frontend/src/api.js`
- Contains: Generic request methods (get, post, put, delete) with automatic auth token injection
- Depends on: Supabase session for token retrieval
- Used by: Services layer

**Backend Route Layer:**
- Purpose: Define HTTP endpoints and route requests to controllers
- Location: `backend/routes/auth.js`, `backend/routes/entries.js`, `backend/routes/settings.js`, `backend/routes/breakdownRoutes.js`
- Contains: Express Router definitions with method handlers
- Depends on: Controllers layer, middleware (authentication)
- Used by: Express app

**Backend Controller Layer:**
- Purpose: Handle HTTP request/response, validate input, orchestrate business logic
- Location: `backend/controllers/authController.js`, `backend/controllers/entriesController.js`, `backend/controllers/settingsController.js`, `backend/controllers/breakdownController.js`
- Contains: Async handler functions that validate request data, call services, return JSON responses
- Depends on: Services layer, middleware context (authenticated user)
- Used by: Routes layer

**Backend Services Layer:**
- Purpose: Implement business logic and database operations
- Location: `backend/services/authService.js`, `backend/services/entriesService.js`, `backend/services/settingsService.js`
- Contains: Functions that perform CRUD operations, calculate statistics, transform data
- Depends on: Database layer (db.js pool) and external services (Supabase auth)
- Used by: Controller layer

**Backend Database Layer:**
- Purpose: Manage database connection and provide query pool
- Location: `backend/db.js`
- Contains: PostgreSQL connection pool initialization, connection diagnostics, environment variable resolution
- Depends on: pg driver, environment variables
- Used by: Services layer via getDb() function

**Backend Authentication Middleware:**
- Purpose: Verify JWT tokens and inject user context into requests
- Location: `backend/middleware/auth.js`
- Contains: authenticate() middleware function that validates Authorization header
- Depends on: Supabase client for token validation
- Used by: Routes as middleware

**Backend Configuration:**
- Purpose: Initialize external service clients
- Location: `backend/config/supabase.js`
- Contains: Supabase client initialization with environment variables
- Depends on: Supabase SDK, environment variables
- Used by: Services layer

**Frontend Configuration:**
- Purpose: Initialize external service clients
- Location: `frontend/src/lib/supabase.js`
- Contains: Supabase client initialization for frontend authentication
- Depends on: Supabase SDK, environment variables
- Used by: AuthContext and API client

## Data Flow

**User Registration/Login Flow:**

1. User submits credentials on `frontend/src/pages/Login.jsx` or `Register.jsx`
2. Page component calls `AuthContext.register()` or `AuthContext.login()`
3. AuthContext uses `frontend/src/lib/supabase.js` to call Supabase auth
4. Supabase returns session with JWT access token
5. Token is stored in browser session via Supabase SDK
6. User object is set in AuthContext state
7. App redirects to Dashboard, routes protected by `ProtectedRoute` component

**Entry Creation Flow:**

1. User fills form on `frontend/src/pages/AddEntry.jsx`
2. Page calls `frontend/src/services/entriesService.createEntry(entryData)`
3. Service calls `frontend/src/api.post('/api/entries', entryData)`
4. API client automatically injects Authorization header with Supabase JWT token
5. Request reaches `backend/server.js` → `backend/routes/entries.js` POST handler
6. Route middleware calls `backend/middleware/auth.js` → validates token via Supabase
7. Controller `backend/controllers/entriesController.create()` validates input
8. Controller calls `backend/services/entriesService.createEntry(userId, data)`
9. Service executes INSERT into utility_entries table via `backend/db.js` pool
10. Service also upserts utility_settings with latest unit_price
11. Response returns entry object to frontend
12. Frontend updates component state to reflect new entry

**Data Read Flow (Statistics):**

1. User navigates to `frontend/src/pages/Statistics.jsx`
2. Component uses useEffect to call `frontend/src/services/entriesService.getStats()`
3. Service makes GET request to `/api/entries/stats` via API client
4. Request includes JWT token in Authorization header
5. Backend route → auth middleware → `backend/controllers/entriesController.getStats()`
6. Controller calls `backend/services/entriesService.getStats(userId)`
7. Service executes three parallel queries: totals, by-type aggregation, monthly aggregation
8. Queries filter by user_id to ensure data isolation
9. Response returns aggregated statistics object
10. Frontend receives stats and renders charts using Recharts library

**State Management:**

- Authentication state lives in `frontend/src/context/AuthContext.jsx` using React hooks
- Language preference lives in `frontend/src/context/LanguageContext.jsx`
- Page-level component state (form inputs, loaded data) managed with useState in each page
- No global state management library (Redux/Zustand) - Context API sufficient for app scope
- Backend is stateless except for database connection pool
- User context attached to req.user by middleware after token validation

## Key Abstractions

**API Client Abstraction:**
- Purpose: Centralize HTTP communication with automatic token injection
- Examples: `frontend/src/api.js`
- Pattern: Object with methods (get, post, put, delete) that handle fetch, headers, error handling
- Benefit: Service layer doesn't need to know about token management

**Service Pattern:**
- Purpose: Encapsulate database and business logic away from HTTP layer
- Examples: `backend/services/entriesService.js`, `frontend/src/services/entriesService.js`
- Pattern: Async functions that take user/resource IDs and data, return objects or throw errors
- Benefit: Services can be tested independently, reused by multiple controllers

**Controller Pattern:**
- Purpose: Handle request validation, call services, format responses
- Examples: `backend/controllers/entriesController.js`
- Pattern: Async functions that receive req/res, validate inputs with status codes, call services
- Benefit: Consistent error handling, input validation centralized

**Context Provider Pattern:**
- Purpose: Provide global state to entire app tree
- Examples: `frontend/src/context/AuthContext.jsx`
- Pattern: createContext + Provider component with custom hooks (useAuth, useLanguage)
- Benefit: Any component can access auth state without prop drilling

**Database Connection Pool:**
- Purpose: Manage PostgreSQL connections efficiently
- Examples: `backend/db.js`
- Pattern: Singleton pool instance initialized on server startup, diagnostics for troubleshooting
- Benefit: Connection reuse reduces overhead, graceful error handling

## Entry Points

**Frontend:**
- Location: `frontend/src/main.jsx`
- Triggers: Browser loads application
- Responsibilities: Render React app into DOM, initialize i18n, provide Auth/Language context

**Frontend Router:**
- Location: `frontend/src/App.jsx`
- Triggers: After main.jsx mounts
- Responsibilities: Define all routes, apply layout wrappers, protect routes with ProtectedRoute component

**Backend Server:**
- Location: `backend/server.js`
- Triggers: Node.js process starts
- Responsibilities: Initialize Express app, configure CORS, connect to database, mount all route handlers, start listening on PORT

## Error Handling

**Strategy:** Layered error handling with context-specific responses

**Patterns:**

- **Request Validation Errors** (400): Controllers validate input format, type, and constraints before calling services. Specific error messages like "usage_amount must be a non-negative number"

- **Authentication Errors** (401): Middleware rejects requests without valid Authorization header or invalid JWT. Controllers return 401 if token validation fails in Supabase

- **Not Found Errors** (404): Controllers check if resource exists (e.g., entry deletion) and return 404 if missing

- **Conflict Errors** (409): Controllers detect duplicate resources (e.g., email already registered) and return 409

- **Service Unavailability** (503): Controllers catch "Database not configured" errors from services and return 503 instead of 500 to indicate temporary infrastructure issue

- **Generic Server Errors** (500): Uncaught errors in services default to 500 with generic message to client

- **Frontend Error Handling**: API client throws error objects with `.status` property. Pages use try/catch in useEffect hooks. Most pages don't yet have error UI - they silently fail or use console.error

## Cross-Cutting Concerns

**Logging:**
- Backend: console.log/console.error in db.js for connection diagnostics and server startup messages
- Frontend: console.log in main.jsx for deployment test message, limited other logging
- No structured logging framework (Pino/Winston) implemented

**Validation:**
- Backend: Heavy validation in controllers (regex patterns, type checking, range validation) before service calls
- Frontend: HTML5 input type validation (date picker, number inputs) and form libraries handle most validation
- Constants like VALID_TYPES defined at controller level to prevent invalid data

**Authentication:**
- Frontend: Supabase auth SDK handles session management, token refresh
- Backend: Supabase JWT token verification in middleware, user ID extracted into req.user
- Tokens included automatically by API client in Authorization header
- No refresh token handling visible - relying on Supabase SDK

**Authorization:**
- Backend: All protected routes apply authenticate middleware
- Data isolation enforced at database query level - all queries filter WHERE user_id = $1
- No role-based access control (RBAC) - all authenticated users have equal access

**Internationalization (i18n):**
- Frontend: i18next + react-i18next for translation keys
- Translations stored in `frontend/src/i18n/locales/en/` and `frontend/src/i18n/locales/de/`
- Language detection uses browser preference, switcher allows manual override
- All UI strings use translation keys (nav.dashboard, app.name, etc.)

---

*Architecture analysis: 2026-03-18*
