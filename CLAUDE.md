# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Legacy Builders Investments** - A real estate rehab portfolio application built on Azure Static Web Apps with:
- **Frontend:** React SPA with Vite, TypeScript, and Tailwind CSS
- **Backend:** C# Azure Functions (.NET 8 isolated)
- **Database:** Azure Cosmos DB (serverless/free tier)
- **Authentication:** Microsoft Entra ID (Azure AD) with managed identities
- **Monitoring:** Azure Application Insights (free tier)

## Architecture Principles

### Cost Optimization (Free/Low-Cost Tiers)
```yaml
Azure Static Web Apps: Free tier (100GB bandwidth/month)
Cosmos DB: Serverless mode (pay-per-request, first 1000 RU/s free)
Application Insights: Free tier (5GB/month ingestion)
Azure Functions: Consumption plan (1M executions free/month)
Storage Account: LRS redundancy (5GB free)
Microsoft Entra ID: Free tier (50,000 MAU free)
```

### Security Architecture
- **Managed Identities** for all service-to-service communication (no connection strings)
- **Microsoft Entra ID** for user authentication
- **Role-Based Access Control (RBAC)** for resource access
- **Key Vault** references for any remaining secrets (free tier: 10,000 transactions/month)

## Development Commands

### Local Development (Recommended)
```bash
npm run swa:start            # Start both frontend + API (http://localhost:4280)
```

**That's all you need!** See `docs/LOCAL-DEVELOPMENT-GUIDE.md` for details.

### Frontend Development
```bash
npm install                  # Install dependencies
npm run dev                  # Start dev server (localhost:8080)
npm run build                # Production build
npm run build:dev            # Development build
npm run lint                 # Run ESLint
npm run preview              # Preview production build
```

### Azure Static Web Apps
```bash
npm run swa:start            # Start SWA CLI with dev server
npm run swa:build            # Build and start SWA locally
swa login                    # Authenticate with Azure
swa deploy                   # Deploy to Azure
```

### Backend API (C# Azure Functions)
```bash
cd api
dotnet build                 # Build the API
dotnet run                   # Run locally (requires Azure Functions Core Tools)
```

### Infrastructure Deployment
```bash
# Deploy Azure resources using Bicep (creates separate resource groups per environment)
# Production
az group create --name legacy-builders-prod-rg --location southcentralus
az deployment group create --resource-group legacy-builders-prod-rg \
  --template-file infrastructure/main.bicep --parameters environment=prod

# Staging
az group create --name legacy-builders-staging-rg --location southcentralus
az deployment group create --resource-group legacy-builders-staging-rg \
  --template-file infrastructure/main.bicep --parameters environment=staging

# Dev
az group create --name legacy-builders-dev-rg --location southcentralus
az deployment group create --resource-group legacy-builders-dev-rg \
  --template-file infrastructure/main.bicep --parameters environment=dev
```

### Local Backend Development
```bash
# Run Cosmos DB Emulator (Docker)
docker run -p 8081:8081 -p 10251-10254:10251-10254 \
  mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest

# Or use Azure Cosmos DB Emulator for Windows (download from Microsoft)
```

## Architecture Overview

### Application Structure
This is a **React SPA** for a real estate rehab portfolio with an admin dashboard, deployed to **Azure Static Web Apps**. The frontend is complete and production-ready; the backend API is scaffolded but requires full implementation.

### Key Design Patterns

**1. Authentication Flow**
- Azure Static Web Apps provides built-in authentication via Microsoft Entra ID (Azure AD)
- Frontend checks `/.auth/me` endpoint to get user principal
- `AuthContext` (src/contexts/AuthContext.tsx) manages auth state globally
- `ProtectedRoute` component guards admin routes
- User context is automatically tracked in Application Insights telemetry

**2. Data Fetching Pattern**
- **React Query** handles all server state (caching, refetching, mutations)
- Custom hooks in `src/hooks/use-projects.ts` wrap API calls
- Public hooks: `usePublishedProjects()`, `useProject(slug)`
- Admin hooks: `useAdminProjects()`, `useAdminProject(id)`, `useAdminDashboard()`
- Mutations: `useCreateProject()`, `useUpdateProject()`, `useDeleteProject()`, `useImageUpload()`
- API client in `src/lib/api-client.ts` provides typed fetch wrapper with automatic error handling

**3. Telemetry Integration**
- **Azure Application Insights** is fully integrated throughout the app
- Centralized telemetry service: `src/lib/telemetry.ts`
- Automatic tracking: page views, route changes, API calls, errors, unhandled promise rejections
- Custom tracking: user actions, authentication events, custom metrics
- User context is set on login and cleared on logout
- All API errors and exceptions are automatically tracked with context

**4. Project Data Model**
```typescript
// Core entity: Project (src/types/project.ts)
interface Project {
  id: string;
  title: string;
  slug: string;              // URL-friendly identifier
  location: string;
  shortDescription: string;
  fullDescription: string;
  scopeOfWork: string;
  challenges: string;
  outcomes: string;
  purchaseDate: string;
  completionDate: string;
  budget: number;
  finalCost: number;
  squareFootage: number;
  status: 'draft' | 'published' | 'archived';
  beforeImages: ProjectImage[];
  afterImages: ProjectImage[];
  primaryBeforeImage: string;
  primaryAfterImage: string;
}
```

**5. Backend Architecture (To Be Implemented)**
- **Azure Functions** (C# .NET 8 isolated worker model)
- **Cosmos DB** for data persistence (serverless, session consistency)
  - Database: `LegacyBuilders`
  - Containers with partition key strategies:
    - `projects` - partitioned by `/status` (draft/published/archived)
    - `users` - partitioned by `/tenantId` (for multi-tenant support)
    - `audit` - partitioned by `/entityType` (project/user), 30-day TTL for automatic cleanup
  - Use singleton `CosmosClient` for connection reuse
  - Implement repository pattern for data access
- **Azure Blob Storage** for image storage (container: `project-images`)
- **Application Insights** fully integrated for API telemetry
  - Custom `TelemetryService` for tracking events, metrics, and dependencies
  - Automatic HTTP request tracking and W3C distributed tracing
  - Cosmos DB RU consumption tracking for cost monitoring
  - End-to-end correlation with frontend requests
  - See `docs/API-APPLICATION-INSIGHTS-SETUP.md` for complete setup guide
- API scaffold exists in `/api` directory but needs full implementation
- See `docs/authentication-implementation-plan.md` for detailed backend implementation checklist

### File Organization

**Frontend (`src/`)**
- `components/` - Reusable UI components (public and admin layouts)
- `components/ui/` - shadcn/ui component library (40+ components)
- `contexts/` - React contexts (AuthContext for global auth state)
- `hooks/` - Custom React hooks (use-projects.ts, use-toast.ts)
- `lib/` - Core utilities
  - `api-client.ts` - Typed API client with error handling
  - `telemetry.ts` - Application Insights wrapper
  - `utils.ts` - Helper functions
- `pages/` - Route components
  - Public: Index, Portfolio, ProjectDetail, NotFound
  - Admin: Login, Dashboard, ProjectList, ProjectForm
- `types/` - TypeScript type definitions (project.ts)

**Backend (`api/`)**
- `Program.cs` - Azure Functions host configuration
- `HttpTrigger1.cs` - Example function (replace with actual API endpoints)
- `api.csproj` - C# project file

**Infrastructure (`infrastructure/`)**
- `main.bicep` - Complete IaC for all Azure resources
- Creates: App Insights + Log Analytics, Cosmos DB (serverless), Storage Account

**Configuration**
- `vite.config.ts` - Vite bundler config, uses port 8080, path alias `@` -> `./src`
- `staticwebapp.config.json` - Azure SWA config (SPA fallback to index.html)
- `tsconfig.json` - TypeScript config

### Critical Implementation Notes

**Route Definition Order**
All custom routes MUST be defined BEFORE the catch-all `*` route in App.tsx:
```typescript
// src/App.tsx
<Routes>
  {/* Custom routes first */}
  <Route path="/portfolio/:slug" element={<ProjectDetail />} />

  {/* Catch-all LAST - any route below this will never match */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

**Environment Variables**
Required `.env.local` variables (never commit this file):
```env
VITE_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx...
```

**Image Upload Flow**
1. User selects image in ImageUpload component
2. Frontend calls `api.admin.images.upload(file)` with FormData
3. API uploads to Azure Blob Storage and generates thumbnail
4. Returns `{ url: string; thumbnail: string }`
5. URLs are stored in Project entity

**Error Handling Pattern**
- `ErrorBoundary` component wraps entire app (src/components/ErrorBoundary.tsx)
- All React errors are caught and tracked to Application Insights
- API errors throw `ApiError` with status code and message
- React Query handles mutation errors with toast notifications

**Authentication Integration**
- Login redirects to `/.auth/login/aad`
- Logout redirects to `/.auth/logout`
- User info available at `/.auth/me`
- Admin role required for `/admin/*` routes (checked in ProtectedRoute)

### Component Library
Built with **shadcn/ui** - a copy-paste component library based on Radix UI and Tailwind CSS. Components are in `src/components/ui/` and can be modified directly (not installed via npm).

## Development Principles

Follow these principles in order of priority:

1. **Security First** - All code must be secure by default
2. **Accessibility** - All UI must be accessible (WCAG 2.1 AA)
3. **Localization** - All user-facing text must be localizable
4. **Documentation** - All code must be fully documented
5. **Observability** - Add logging, metrics, and telemetry

### Security Requirements

**Frontend Authorization:**
- **Hide, Don't Disable**: Unauthorized features must be hidden entirely, not disabled
- **Conditional Rendering**: Check permissions before rendering menu items, buttons, pages
- **Route Guards**: Redirect unauthorized route access attempts
- **No Client-Side Trust**: UI hiding is for UX only; always enforce server-side

**Backend Authorization:**
- **Tenant Isolation**: Every request scoped to authenticated tenant
- **Role Validation**: Return `403 Forbidden` for unauthorized access
- **Deny by Default**: No implicit permissions
- **Audit Logging**: Log all authorization failures and data modifications

**API Error Codes:**
Always return structured error responses with error codes (not hardcoded messages):
- `AUTH_REQUIRED` - Authentication required
- `AUTH_FORBIDDEN` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Resource does not exist
- `VALIDATION_FAILED` - Input validation error
- `RATE_LIMITED` - Too many requests
- `SERVER_ERROR` - Internal server error

### Code Documentation

- **Functions/Methods**: JSDoc (TS/JS) or XML docs (.NET) with purpose, parameters, return values, exceptions
- **Classes/Interfaces**: Document purpose and usage patterns
- **Complex Logic**: Inline comments for non-obvious algorithms
- **Public APIs**: Request/response examples
- **Configuration**: All environment variables documented

### Accessibility (a11y)

- Use semantic HTML (`<button>`, `<nav>`, `<main>`, `<article>`)
- Include proper ARIA attributes where needed
- Keyboard navigation for all interactive elements
- Focus management for modals, dropdowns, dynamic content
- Visible focus indicators
- Sufficient color contrast (WCAG 2.1 AA: 4.5:1 for text)
- Alt text for all images and meaningful icons
- Screen reader support with labels and live regions

### Localization (i18n)

- Never hardcode user-facing strings
- Use translation keys with react-i18next
- Support RTL layouts (CSS logical properties)
- Format dates/numbers/currencies per locale
- Account for text expansion (30-50% longer than English)
- Use ICU message format for pluralization

---

## Testing

### Test Commands

```bash
# Unit Tests (Vitest)
npm run test:unit              # Run unit tests
npm run test:unit:watch        # Watch mode
npm run test:unit:coverage     # With coverage report

# BDD E2E Tests (Cucumber + Playwright)
npm run test:bdd               # Run all BDD tests
npm run test:smoke             # Quick smoke tests (public pages)
npm run test:e2e               # Full E2E suite
npm run test:validation        # Form validation tests

# All Tests
npm run test                   # Unit + BDD tests
npm run test:ci                # CI mode (unit + SWA + E2E)
```

### Test Structure

```
src/
├── components/
│   └── ComponentName.test.tsx  # Component unit tests
├── hooks/
│   └── use-hook.test.tsx       # Hook unit tests
└── test/
    └── setup.ts                # Vitest setup (mocks, cleanup)

features/
├── homepage.feature            # BDD feature files
├── portfolio.feature
├── contact.feature
├── admin.feature
├── step-definitions/           # Cucumber step implementations
│   ├── navigation.steps.ts
│   ├── contact.steps.ts
│   └── auth.steps.ts
└── support/
    └── hooks.ts                # Playwright browser setup
```

### Test Tags

- `@smoke` - Quick sanity tests for public pages (CI default)
- `@e2e` - Full E2E tests including all pages
- `@auth` - Tests requiring authentication (admin features)
- `@validation` - Form validation tests

### Testing Requirements

- **90% minimum code coverage** for all new code
- Unit tests for all business logic
- E2E tests for critical user flows
- Accessibility tests using jest-axe
- Authorization tests: verify 403 for unauthorized access

### Running E2E Tests Locally

1. Start SWA CLI (includes frontend + API):
   ```bash
   npm run swa:start
   ```

2. In another terminal, run tests:
   ```bash
   npm run test:smoke
   ```

### CI Workflows

- **`tests.yml`** - Runs on every push/PR:
  1. Unit tests (Vitest)
  2. Build frontend + API
  3. Start SWA CLI
  4. Run E2E smoke tests

- **`codeql.yml`** - Security scanning for C# and TypeScript

---

## Development Workflow

### Adding a New Public Route
1. Create page component in `src/pages/`
2. Add route in `App.tsx` BEFORE the `*` catch-all route
3. Add navigation link in `Header.tsx` or `Footer.tsx`

### Adding a New Admin Route
1. Create page component in `src/pages/admin/`
2. Wrap in `<ProtectedRoute>` in `App.tsx`
3. Add navigation in `AdminLayout.tsx`

### Adding a New API Endpoint
1. Define types in `src/types/` if needed
2. Add API method to `src/lib/api-client.ts`
3. Create custom hook in `src/hooks/` if appropriate
4. Implement C# function in `api/` directory

### Testing Telemetry
1. Check browser console for telemetry confirmation logs
2. Visit Azure Portal → Application Insights → Live Metrics
3. Test error tracking: `throw new Error("Test error")` in console
4. Verify user tracking after login

## Deployment Strategy

### GitFlow Branch → Environment Mapping

This project uses **GitFlow** with Azure Static Web Apps automatic environment provisioning:

| Branch Pattern | Environment | Azure Resource Group | Purpose |
|----------------|-------------|---------------------|---------|
| `main` | Production | `legacy-builders-prod-rg` | Live customer traffic |
| `develop` | Development | `legacy-builders-dev-rg` | Integration testing + daily QA |
| `release/*` | Staging | `legacy-builders-staging-rg` | Final validation before production |
| `feature/*` | Preview (auto) | Uses dev infrastructure | PR verification per feature |
| `hotfix/*` | Preview (auto) | Uses dev infrastructure | Emergency fixes validated before release |

**Key Points:**
- Each environment has its own infrastructure (Cosmos DB, Storage, App Insights)
- Azure SWA automatically creates/destroys preview environments for PRs
- Protect `main` and `develop` branches in GitHub (require PR + passing CI)
- Use `git flow` CLI or manual git commands for branch management

### Typical Deployment Workflow

```bash
# 1. Start feature from develop
git flow feature start my-feature
git push origin feature/my-feature    # Creates preview SWA environment

# 2. Merge feature to develop (after PR approval)
git flow feature finish my-feature    # Updates dev environment

# 3. Cut release branch for final validation
git flow release start 1.2.0
git push origin release/1.2.0         # Deploys to staging environment

# 4. Finish release (merges to main and back to develop)
git flow release finish 1.2.0         # Deploys to production
git push origin main --tags

# 5. Emergency hotfix from main
git flow hotfix start 1.2.1           # Creates preview environment
git flow hotfix finish 1.2.1          # Patches prod + syncs develop
```

### Azure Static Web Apps Configuration

**Build Settings:**
- Build command: `npm run build`
- Output directory: `dist`
- API location: `api` (when backend implemented)
- App location: `/`

**Environment Variables (per environment):**
Configure in Azure Portal → Static Web Apps → Configuration:
- `VITE_APPINSIGHTS_CONNECTION_STRING` - App Insights connection string (different per env)
- `CosmosDbEndpoint` - Cosmos DB endpoint (backend only, different per env)
- `CosmosDbDatabaseName` - Always `LegacyBuilders`
- `Environment` - `prod`, `staging`, or `dev`

**Get connection strings:**
```bash
# Production
az deployment group show --resource-group legacy-builders-prod-rg \
  --name main --query properties.outputs.appInsightsConnectionString.value -o tsv

# Staging
az deployment group show --resource-group legacy-builders-staging-rg \
  --name main --query properties.outputs.appInsightsConnectionString.value -o tsv

# Dev
az deployment group show --resource-group legacy-builders-dev-rg \
  --name main --query properties.outputs.appInsightsConnectionString.value -o tsv
```

### Static Web App Details

The existing Static Web App resource:
- Name: `legacy-builders`
- Resource Group: `legacy-builders`
- View details: `az staticwebapp show --name legacy-builders --resource-group legacy-builders`

## Documentation References

- **Local Development:** `docs/LOCAL-DEVELOPMENT-GUIDE.md` - How to run frontend + API locally (CORS, telemetry)
- **Environment Setup:** `docs/ENVIRONMENT-QUICK-START.md` - Quick commands for all environments
- **Environment Details:** `docs/ENVIRONMENT-SETUP-GUIDE.md` - Complete environment coordination guide
- **Backend Implementation:** `docs/authentication-implementation-plan.md` - Full API implementation checklist
- **Frontend Telemetry Setup:** `docs/telemetry-quick-start.md` - 5-minute telemetry setup
- **Frontend Telemetry Details:** `docs/telemetry-implementation.md` - Complete frontend telemetry guide
- **API Telemetry:** `docs/API-APPLICATION-INSIGHTS-SETUP.md` - Complete API Application Insights guide
- **Infrastructure:** `infrastructure/README.md` - Bicep deployment guide
- **API Documentation:** `api/README.md` - API quick start and reference
