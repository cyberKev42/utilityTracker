# Structure

## Directory Layout

```
utilityTracker/
├── backend/                           # Express.js API server
│   ├── config/
│   │   └── supabase.js                # Supabase client init
│   ├── middleware/
│   │   └── auth.js                    # Bearer token validation
│   ├── controllers/                   # Request handlers
│   │   ├── authController.js          # Register, login, me
│   │   ├── entriesController.js       # CRUD for utility entries
│   │   ├── breakdownController.js     # Year/month breakdown queries
│   │   └── settingsController.js      # Unit price settings
│   ├── services/                      # Business logic + DB queries
│   │   ├── authService.js             # Supabase auth operations
│   │   ├── entriesService.js          # Entry queries + aggregations
│   │   └── settingsService.js         # Settings persistence
│   ├── routes/                        # Express route definitions
│   │   ├── auth.js
│   │   ├── entries.js
│   │   ├── settings.js
│   │   └── breakdownRoutes.js
│   ├── db.js                          # PostgreSQL pool management
│   ├── server.js                      # Express app init + middleware
│   ├── package.json
│   └── nixpacks.toml                  # Railway build config
│
├── frontend/                          # React + Vite SPA
│   ├── src/
│   │   ├── context/                   # React context providers
│   │   │   ├── AuthContext.jsx        # Auth state + methods
│   │   │   └── LanguageContext.jsx    # i18n language switching
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useAuth.js            # Auth context consumer
│   │   │   └── useLanguage.js        # Language context consumer
│   │   ├── services/                  # API client functions
│   │   │   ├── authService.js
│   │   │   ├── entriesService.js
│   │   │   └── settingsService.js
│   │   ├── components/
│   │   │   ├── ui/                    # Radix UI primitives (shadcn)
│   │   │   │   ├── card.jsx
│   │   │   │   ├── button.jsx
│   │   │   │   ├── input.jsx
│   │   │   │   ├── label.jsx
│   │   │   │   ├── badge.jsx
│   │   │   │   ├── dialog.jsx
│   │   │   │   ├── separator.jsx
│   │   │   │   ├── textarea.jsx
│   │   │   │   ├── background-paths.jsx
│   │   │   │   └── etheral-shadow.jsx
│   │   │   ├── charts/               # Recharts visualizations
│   │   │   │   ├── DistributionPieChart.jsx
│   │   │   │   ├── CategoryBarChart.jsx
│   │   │   │   └── SpendingLineChart.jsx
│   │   │   ├── LanguageSwitcher.jsx
│   │   │   └── ProtectedRoute.jsx    # Auth guard
│   │   ├── layouts/
│   │   │   ├── AuthLayout.jsx        # Login/Register wrapper
│   │   │   └── MainLayout.jsx        # Authenticated app wrapper
│   │   ├── pages/                     # Route-level pages
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AddEntry.jsx
│   │   │   ├── Entries.jsx
│   │   │   ├── Statistics.jsx
│   │   │   ├── StatisticsDetail.jsx
│   │   │   └── Settings.jsx
│   │   ├── i18n/
│   │   │   ├── i18n.js               # i18next config
│   │   │   └── locales/
│   │   │       ├── en/common.json
│   │   │       └── de/common.json
│   │   ├── lib/
│   │   │   ├── supabase.js           # Supabase client instance
│   │   │   └── utils.js              # cn() classname utility
│   │   ├── api.js                    # Fetch wrapper with auth
│   │   ├── App.jsx                   # React Router config
│   │   ├── main.jsx                  # Entry point
│   │   └── index.css                 # Global + Tailwind styles
│   ├── public/assets/
│   │   └── images/                   # logo.png, codedeck.png, etc.
│   ├── vite.config.js                # Dev server on port 5300
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   ├── nixpacks.toml
│   └── index.html
│
├── railway.toml                       # Monorepo deployment config
└── .gitignore
```

## Key Locations

| What | Where |
|------|-------|
| Backend entry point | `backend/server.js` |
| Frontend entry point | `frontend/src/main.jsx` |
| React Router config | `frontend/src/App.jsx` |
| Database connection | `backend/db.js` |
| Auth middleware | `backend/middleware/auth.js` |
| API client (frontend) | `frontend/src/api.js` |
| Supabase config (backend) | `backend/config/supabase.js` |
| Supabase config (frontend) | `frontend/src/lib/supabase.js` |
| i18n translations | `frontend/src/i18n/locales/{en,de}/common.json` |
| UI primitives | `frontend/src/components/ui/` |
| Chart components | `frontend/src/components/charts/` |
| Deployment config | `railway.toml` |

## Naming Conventions

- **Backend files:** camelCase (`entriesController.js`, `authService.js`)
- **Frontend components:** PascalCase (`Dashboard.jsx`, `AddEntry.jsx`)
- **Frontend utilities:** camelCase (`api.js`, `utils.js`)
- **UI primitives:** kebab-case (`background-paths.jsx`, `etheral-shadow.jsx`)
- **Database columns:** snake_case (`user_id`, `usage_amount`, `cost_amount`)
- **Constants:** UPPER_SNAKE_CASE (`VALID_TYPES`, `DATE_REGEX`)

## Where to Add New Code

| Feature type | Location |
|-------------|----------|
| New API endpoint | `backend/routes/` + `backend/controllers/` + `backend/services/` |
| New page | `frontend/src/pages/` + route in `App.jsx` |
| New UI component | `frontend/src/components/` |
| New chart | `frontend/src/components/charts/` |
| New translation | `frontend/src/i18n/locales/{en,de}/common.json` |
| New context/hook | `frontend/src/context/` + `frontend/src/hooks/` |
| New service (frontend) | `frontend/src/services/` |
