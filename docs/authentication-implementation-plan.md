# Authentication & API Integration Plan with Cosmos DB

## 📋 Implementation Checklist

### Phase 1: Azure Infrastructure Setup

#### Azure Cosmos DB Configuration
- [x] **Create Cosmos DB Account** *(Completed - using serverless mode)*
  - [x] Choose SQL API for familiarity with SQL syntax
  - [x] Set up preferred regions for low latency
  - [x] Enable Point-in-time restore for backup

- [x] **Design Data Model**
  - [x] Create `LegacyBuilders` database
  - [x] Create containers with appropriate partition keys:
    - Projects container with `/status` partition key

- [x] **Local Development Setup**
  - [x] Configure Cosmos DB connection strings for local development
  - [x] Support both connection string and managed identity

#### Microsoft Entra ID (Azure AD) Setup
- [x] **Configure Authentication** *(Using Azure SWA built-in auth)*
  - [x] Azure SWA handles Azure AD authentication automatically
  - [x] Configure `staticwebapp.config.json` for route protection

- [ ] **Define App Roles**
  - [ ] Create "Admin" role in app manifest
  - [ ] Assign roles to users in Enterprise Applications

### Phase 2: Backend API Implementation (C#)

#### API Project Setup
- [x] **Azure Functions Project** *(Using .NET 8 isolated worker)*
  - [x] Project structure with Functions, Models, Services, Middleware

- [x] **Install Required NuGet Packages**
  - [x] Microsoft.Azure.Cosmos
  - [x] Azure.Storage.Blobs
  - [x] Microsoft.ApplicationInsights

- [x] **Configure Authentication via Middleware**
  - [x] `AuthenticationMiddleware` - Parses `x-ms-client-principal` header from Azure SWA
  - [x] `AuthorizationMiddleware` - Enforces admin role for protected routes
  - [x] Middleware registered in `Program.cs`

#### Cosmos DB Integration
- [x] **Create Cosmos DB Service**
  - [x] `ICosmosDbService` interface with CRUD operations
  - [x] `CosmosDbService` implementation
  - [x] Singleton `CosmosClient` for connection reuse
  - [x] RU consumption tracking via telemetry

- [x] **Implement Repository Pattern**
  - [x] Project CRUD operations in CosmosDbService
  - [x] Automatic slug generation

- [x] **Create API Functions**
  - [x] `AdminDashboardFunction` - Dashboard statistics
  - [x] `AdminProjectsFunction` - Project CRUD operations
  - [x] `PublicProjectsFunction` - Public portfolio endpoints
  - [x] `ImageFunction` - SAS token generation for image uploads

- [x] **Implement Error Handling**
  - [x] `ApiError` model with error codes for localization
  - [x] Standard error codes: AUTH_REQUIRED, AUTH_FORBIDDEN, RESOURCE_NOT_FOUND, etc.
  - [x] Middleware returns structured error responses

### Phase 3: Frontend Integration

#### Azure SWA Authentication (Alternative to MSAL)
- [x] **Use Azure SWA Built-in Authentication**
  - [x] `/.auth/me` endpoint for user info
  - [x] `/.auth/login/aad` for login
  - [x] `/.auth/logout` for logout

- [x] **AuthContext Implementation**
  - [x] Check `/.auth/me` on app load
  - [x] Store user principal in context
  - [x] `isAdmin` computed from userRoles

- [x] **API Client**
  - [x] Typed API client in `src/lib/api-client.ts`
  - [x] React Query hooks for data fetching
  - [x] Error handling with toast notifications

#### Admin Pages Implementation
- [x] **Admin Dashboard**
  - [x] Display statistics from API
  - [x] Recent projects list
  - [x] Role-based UI (admin check)

- [x] **Project Management**
  - [x] ProjectList with CRUD operations
  - [x] ProjectForm for create/edit
  - [x] Image upload via SAS tokens
  - [x] Optimistic updates with React Query

- [x] **Error Handling**
  - [x] ErrorBoundary component
  - [x] Toast notifications for API responses
  - [x] Loading states with skeletons

### Phase 4: Azure Static Web App Deployment

#### Configuration Files
- [x] **`staticwebapp.config.json`** *(Updated with security routes)*
  ```json
  {
    "routes": [
      { "route": "/api/manage/*", "allowedRoles": ["authenticated"] },
      { "route": "/api/dashboard", "allowedRoles": ["authenticated"] },
      { "route": "/api/projects/*", "allowedRoles": ["anonymous"] },
      { "route": "/admin/*", "allowedRoles": ["authenticated"] }
    ]
  }
  ```

- [x] **GitHub Actions Workflow**
  - [x] Azure Static Web Apps deployment workflow
  - [x] Build and deploy pipeline
  - [x] Environment configuration

#### Azure Configuration
- [x] **Application Settings**
  - [x] Cosmos DB connection (via managed identity or connection string)
  - [x] Application Insights connection
  - [x] Storage Account for images

### Phase 5: Testing & Monitoring

#### Testing
- [x] **Unit Tests**
  - [x] Component tests with Vitest
  - [x] 231+ unit tests passing

- [x] **E2E Tests**
  - [x] Cucumber + Playwright setup
  - [x] Mock authentication via `x-ms-client-principal` header
  - [x] `ApiHelpers` class with `setAdminAuth()`, `setUserAuth()`, `clearAuth()`

- [ ] **Authorization Tests**
  - [ ] Test 401 for unauthenticated requests to admin endpoints
  - [ ] Test 403 for non-admin users accessing admin endpoints
  - [ ] Test public endpoints accessible without auth

#### Monitoring Setup
- [x] **Application Insights**
  - [x] Frontend telemetry in `src/lib/telemetry.ts`
  - [x] Backend telemetry in `TelemetryService`
  - [x] Authorization failure tracking
  - [x] Custom events and metrics

- [x] **Security Monitoring**
  - [x] `TrackAuthorizationFailure()` method for audit logging
  - [x] Structured logging with user context

### Phase 6: Production Readiness

#### Security Hardening
- [x] **Implement Security Best Practices**
  - [x] HTTPS enforced by Azure SWA
  - [x] Middleware-based authorization (deny by default)
  - [x] Structured error codes (no sensitive info in errors)
  - [x] Authorization failure auditing

#### Documentation
- [x] **API Documentation**
  - [x] `api/README.md` with security architecture
  - [x] `docs/API-IMPLEMENTATION-PLAN.md` with middleware details
  - [x] Error codes documented

## 📊 Success Criteria

- [x] Admin users can successfully authenticate via Microsoft Entra ID (Azure SWA)
- [x] Projects are stored and retrieved from Cosmos DB
- [x] Images are uploaded to Azure Blob Storage (via SAS tokens)
- [x] Role-based access control is enforced (middleware)
- [x] API builds and unit tests pass
- [ ] E2E tests verify authorization works correctly
- [ ] Zero unauthorized access incidents (to be monitored)

## 📚 Additional Resources

- [Azure Cosmos DB Best Practices](https://learn.microsoft.com/azure/cosmos-db/best-practice)
- [Azure Static Web Apps Authentication](https://learn.microsoft.com/azure/static-web-apps/authentication-authorization)
- [Azure Functions Middleware](https://learn.microsoft.com/azure/azure-functions/dotnet-isolated-process-guide#middleware)
- [Microsoft Identity Platform](https://learn.microsoft.com/azure/active-directory/develop/)

---

*Last updated: API Security middleware implementation completed.*
