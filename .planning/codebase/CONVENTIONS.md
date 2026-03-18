# Conventions

## Module System
- ES6 modules throughout (`import`/`export`)
- Backend: `"type": "module"` in `package.json`, `.js` extensions required in imports
- Frontend: Vite-resolved, no extensions needed in imports

## Import Organization

**Backend pattern:**
```javascript
import express from 'express';                        // External packages
import * as authService from '../services/authService.js';  // Internal (wildcard for services)
import { authenticate } from '../middleware/auth.js';        // Internal (named)
```

**Frontend pattern:**
```javascript
import { useState, useEffect } from 'react';          // React
import { useTranslation } from 'react-i18next';       // External packages
import { Card, CardContent } from '../components/ui/card';  // Internal components
import { api } from '../api';                          // Internal utilities
```

## Code Organization

### Backend Controllers
1. Imports
2. Constants (`VALID_TYPES`, regex patterns)
3. Helper functions (`isDbUnavailable`)
4. Exported async handler functions
5. Pattern: validate input → call service → return response

### Backend Services
1. Imports (db pool)
2. Exported async functions with parameterized SQL queries (`$1`, `$2`)
3. Return `result.rows[0]` or `result.rows`
4. Errors propagate to controllers

### Frontend Pages
1. Imports
2. Config objects (`TYPE_CONFIG`, animation variants)
3. Helper functions (`formatCurrency`, `formatDate`)
4. Default export function component
5. Hooks at top (`useState`, `useTranslation`, `useAuth`)
6. `useEffect` for data loading
7. JSX return

### Frontend UI Components
- `React.forwardRef` for primitives
- `displayName` set on forwardRef components
- `cn()` utility for conditional classnames (class-variance-authority)
- Props destructured in function params

## Error Handling

### Backend
- Try-catch in controllers with specific HTTP status mapping
- Helper `isDbUnavailable(error)` for database error detection
- Structured JSON responses: `{ error: 'message' }`
- Status codes: 400 (validation), 401 (auth), 404 (not found), 409 (conflict), 503 (db unavailable), 500 (generic)
- Input validation with regex before service calls

```javascript
if (!VALID_TYPES.includes(type)) {
  return res.status(400).json({
    error: `Type must be one of: ${VALID_TYPES.join(', ')}`,
  });
}
```

### Frontend
- Try-catch with error state: `const [error, setError] = useState('')`
- API wrapper throws with `.status` property
- Form validation: `fieldErrors` object + `touched` tracking
- Conditional rendering: `{error && <div>{error}</div>}`

## Naming

| Context | Convention | Example |
|---------|-----------|---------|
| Backend files | camelCase | `entriesController.js` |
| Frontend components | PascalCase | `Dashboard.jsx` |
| Functions | camelCase | `createEntry`, `formatCurrency` |
| React components | PascalCase | `ProtectedRoute`, `AddEntry` |
| Constants | UPPER_SNAKE_CASE | `VALID_TYPES`, `DATE_REGEX` |
| DB columns | snake_case | `user_id`, `usage_amount` |
| CSS classes | Tailwind utilities | `className="flex items-center gap-2"` |

## Patterns

### API Client
Frontend uses a centralized fetch wrapper (`frontend/src/api.js`) that auto-attaches auth headers from Supabase session. All frontend services call through this wrapper.

### Context Providers
Auth and language state managed via React Context (`AuthContext`, `LanguageContext`) with dedicated hooks (`useAuth`, `useLanguage`).

### i18n
- i18next with `react-i18next`
- Two languages: English (`en`), German (`de`)
- Single namespace: `common`
- Translation files: `frontend/src/i18n/locales/{en,de}/common.json`
- Usage: `const { t } = useTranslation(); t('key')`

### Utility Types
Three tracked types throughout the app: `electricity`, `water`, `fuel` — defined as `VALID_TYPES` constant in both frontend config objects and backend validation.
