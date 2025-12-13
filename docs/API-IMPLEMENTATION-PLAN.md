# API Implementation Plan

## Overview
This document outlines the step-by-step implementation plan for connecting the React frontend to Azure Functions backend with Cosmos DB.

## API Endpoints Required

### Public Endpoints (Anonymous Access)
```
GET  /api/projects?status=published    - Get all published projects
GET  /api/projects/{slug}              - Get single project by slug
```

### Admin Endpoints (Authenticated Access)
```
GET  /api/dashboard                     - Get dashboard stats + recent projects
GET  /api/manage/projects               - Get all projects (all statuses)
GET  /api/manage/projects/{id}          - Get single project by ID
POST /api/manage/projects               - Create new project
PUT  /api/manage/projects/{id}          - Update existing project
DELETE /api/manage/projects/{id}        - Delete project
POST /api/manage/images/sas-token       - Generate SAS token for image upload
```

## API Security Architecture

### Overview

Security is implemented using a **middleware-based approach** for authentication and authorization. This follows the DRY principle and ensures consistent security across all admin endpoints.

```
Request Flow:
┌─────────────┐    ┌──────────────────┐    ┌───────────────────────┐    ┌──────────────────────┐    ┌──────────┐
│   Request   │───▶│ SWA Route Auth   │───▶│ AuthenticationMiddleware │───▶│ AuthorizationMiddleware │───▶│ Function │
└─────────────┘    └──────────────────┘    └───────────────────────┘    └──────────────────────┘    └──────────┘
                          │                         │                            │
                          ▼                         ▼                            ▼
                   Route-level auth          Parse x-ms-client-principal    Check admin role
                   (staticwebapp.config)     Store in context.Items         Return 401/403 if denied
```

### Layer 1: Azure Static Web Apps Route Protection

The `staticwebapp.config.json` provides first-line defense by blocking unauthenticated requests at the SWA level:

```json
{
  "routes": [
    {
      "route": "/api/manage/*",
      "allowedRoles": ["authenticated"]
    },
    {
      "route": "/api/dashboard",
      "allowedRoles": ["authenticated"]
    },
    {
      "route": "/api/projects/*",
      "allowedRoles": ["anonymous"]
    }
  ]
}
```

### Layer 2: Authentication Middleware

The `AuthenticationMiddleware` parses the `x-ms-client-principal` header injected by Azure Static Web Apps:

```csharp
/// <summary>
/// Middleware that extracts and validates the Azure Static Web Apps client principal.
/// </summary>
/// <remarks>
/// Azure SWA injects the x-ms-client-principal header for authenticated requests.
/// This middleware decodes and stores the principal in FunctionContext.Items.
/// </remarks>
public class AuthenticationMiddleware : IFunctionsWorkerMiddleware
{
    public async Task Invoke(FunctionContext context, FunctionExecutionDelegate next)
    {
        // 1. Get HttpRequestData from context
        // 2. Extract x-ms-client-principal header
        // 3. Base64 decode and parse to ClientPrincipal
        // 4. Store in context.Items["ClientPrincipal"]
        // 5. Call next(context)
    }
}
```

### Layer 3: Authorization Middleware

The `AuthorizationMiddleware` enforces role-based access control for admin routes:

```csharp
/// <summary>
/// Middleware that enforces admin role requirement for protected routes.
/// </summary>
/// <remarks>
/// Routes matching /api/manage/* or /api/dashboard require the "admin" role.
/// Returns 401 AUTH_REQUIRED if not authenticated.
/// Returns 403 AUTH_FORBIDDEN if authenticated but not admin.
/// </remarks>
public class AuthorizationMiddleware : IFunctionsWorkerMiddleware
{
    private readonly string[] _adminRoutes = { "/api/manage", "/api/dashboard" };
    
    public async Task Invoke(FunctionContext context, FunctionExecutionDelegate next)
    {
        // 1. Check if route requires admin access
        // 2. If admin required:
        //    a. Get ClientPrincipal from context.Items
        //    b. If null → return 401 with AUTH_REQUIRED code
        //    c. If no admin role → return 403 with AUTH_FORBIDDEN code
        //    d. Log authorization failure
        // 3. Call next(context)
    }
}
```

### Middleware Registration

Register middleware in `Program.cs`:

```csharp
var host = new HostBuilder()
    .ConfigureFunctionsWebApplication(workerApp =>
    {
        // Order matters: Authentication must run before Authorization
        workerApp.UseMiddleware<AuthenticationMiddleware>();
        workerApp.UseMiddleware<AuthorizationMiddleware>();
    })
    .ConfigureServices(services =>
    {
        // ... service registrations
    })
    .Build();
```

### Structured Error Responses

All authentication/authorization errors return structured responses with error codes:

```csharp
/// <summary>
/// Structured error response for API errors.
/// </summary>
/// <remarks>
/// Error codes are used for client-side localization instead of hardcoded messages.
/// </remarks>
public class ApiError
{
    /// <summary>Error code for client-side localization.</summary>
    public string Code { get; set; }
    
    /// <summary>Default English message (fallback).</summary>
    public string Message { get; set; }
    
    /// <summary>Optional additional details.</summary>
    public object? Details { get; set; }
}

// Standard error codes:
public static class ErrorCodes
{
    public const string AuthRequired = "AUTH_REQUIRED";
    public const string AuthForbidden = "AUTH_FORBIDDEN";
    public const string ResourceNotFound = "RESOURCE_NOT_FOUND";
    public const string ValidationFailed = "VALIDATION_FAILED";
    public const string ServerError = "SERVER_ERROR";
}
```

### Client Principal Model

```csharp
/// <summary>
/// Represents the Azure Static Web Apps client principal from x-ms-client-principal header.
/// </summary>
public class ClientPrincipal
{
    public string IdentityProvider { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserDetails { get; set; } = string.Empty;
    public IEnumerable<string> UserRoles { get; set; } = Array.Empty<string>();
    
    /// <summary>
    /// Checks if the user has a specific role.
    /// </summary>
    public bool IsInRole(string role) => 
        UserRoles.Contains(role, StringComparer.OrdinalIgnoreCase);
}
```

### E2E Test Compatibility

For E2E tests, authentication is mocked by injecting the `x-ms-client-principal` header:

```typescript
// In features/support/api-helpers.ts
const clientPrincipal = {
  identityProvider: 'aad',
  userId: 'test-admin',
  userDetails: 'test-admin@test.com',
  userRoles: ['authenticated', 'anonymous', 'admin'],
};

const encodedPrincipal = Buffer.from(JSON.stringify(clientPrincipal)).toString('base64');

await fetch(`${baseUrl}/api/manage/projects`, {
  headers: {
    'x-ms-client-principal': encodedPrincipal,
    'Content-Type': 'application/json'
  }
});
```

### Security Logging

All authorization failures are logged for audit purposes:

```csharp
_logger.LogWarning(
    "Authorization failed: User {UserId} attempted {Method} {Route} without {RequiredRole} role",
    principal?.UserId ?? "anonymous",
    request.Method,
    request.Url.AbsolutePath,
    "admin"
);

_telemetryService.TrackEvent("AuthorizationFailure", new Dictionary<string, string>
{
    { "UserId", principal?.UserId ?? "anonymous" },
    { "Route", request.Url.AbsolutePath },
    { "Reason", principal == null ? "NotAuthenticated" : "InsufficientRole" }
});
```

---

## Data Models

### Project (Cosmos DB Document)
```csharp
public class Project
{
    [JsonProperty("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string Title { get; set; }
    public string Slug { get; set; }
    public string Location { get; set; }
    public string ShortDescription { get; set; }
    public string FullDescription { get; set; }
    public string ScopeOfWork { get; set; }
    public string Challenges { get; set; }
    public string Outcomes { get; set; }
    public string PurchaseDate { get; set; }
    public string CompletionDate { get; set; }
    public decimal Budget { get; set; }
    public decimal FinalCost { get; set; }
    public int SquareFootage { get; set; }
    public string Status { get; set; } // "draft" | "published" | "archived"
    public List<ProjectImage> BeforeImages { get; set; } = new();
    public List<ProjectImage> AfterImages { get; set; } = new();
    public string PrimaryBeforeImage { get; set; }
    public string PrimaryAfterImage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class ProjectImage
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Url { get; set; }
    public string Thumbnail { get; set; }
    public string Alt { get; set; }
    public int Order { get; set; }
}
```

### DTOs
```csharp
public class ProjectFormData
{
    public string Title { get; set; }
    public string Location { get; set; }
    public string ShortDescription { get; set; }
    public string FullDescription { get; set; }
    public string ScopeOfWork { get; set; }
    public string Challenges { get; set; }
    public string Outcomes { get; set; }
    public string PurchaseDate { get; set; }
    public string CompletionDate { get; set; }
    public decimal Budget { get; set; }
    public decimal FinalCost { get; set; }
    public int SquareFootage { get; set; }
    public string Status { get; set; }
}

public class DashboardStatsResponse
{
    public StatsData Stats { get; set; }
    public List<Project> RecentProjects { get; set; }
}

public class StatsData
{
    public int Total { get; set; }
    public int Published { get; set; }
    public int Draft { get; set; }
}
```

## Implementation Phases

### Phase 1: Backend Setup ✓ (Scaffolding exists)
- [x] Azure Functions project structure
- [x] Program.cs with Application Insights

### Phase 2: Cosmos DB Integration
- [ ] Install NuGet packages
- [ ] Create CosmosDbService
- [ ] Configure connection strings
- [ ] Create ProjectRepository

### Phase 3: API Implementation (Page by Page)

#### 3.1 Dashboard API (First Implementation)
**Endpoint:** `GET /api/admin/dashboard`

**What it does:**
- Queries Cosmos DB for project counts by status
- Returns 5 most recent projects (ordered by updatedAt desc)

**Response:**
```json
{
  "stats": {
    "total": 10,
    "published": 7,
    "draft": 3
  },
  "recentProjects": [
    { /* project object */ }
  ]
}
```

**Frontend integration:**
- Update Dashboard.tsx to use `useAdminDashboard()` hook
- Remove manual fetch code
- Add error handling

#### 3.2 Project List API
**Endpoint:** `GET /api/admin/projects`

**What it does:**
- Returns all projects (all statuses)
- Ordered by updatedAt desc

**Frontend integration:**
- ProjectList.tsx uses `useAdminProjects()` hook

#### 3.3 Project Detail/Edit API
**Endpoint:** `GET /api/admin/projects/{id}`

**What it does:**
- Returns single project by ID

**Frontend integration:**
- ProjectForm.tsx uses `useAdminProject(id)` for edit mode

#### 3.4 Create Project API
**Endpoint:** `POST /api/admin/projects`

**What it does:**
- Validates input
- Generates slug from title
- Creates new project in Cosmos DB
- Returns created project

**Frontend integration:**
- ProjectForm.tsx uses `useCreateProject()` mutation

#### 3.5 Update Project API
**Endpoint:** `PUT /api/admin/projects/{id}`

**What it does:**
- Validates input
- Updates project in Cosmos DB
- Updates slug if title changed
- Sets UpdatedAt timestamp
- Returns updated project

**Frontend integration:**
- ProjectForm.tsx uses `useUpdateProject()` mutation

#### 3.6 Delete Project API
**Endpoint:** `DELETE /api/admin/projects/{id}`

**What it does:**
- Deletes project from Cosmos DB
- TODO: Also delete associated images from Blob Storage

**Frontend integration:**
- ProjectList.tsx uses `useDeleteProject()` mutation

#### 3.7 Public Projects API
**Endpoints:**
- `GET /api/projects?status=published`
- `GET /api/projects/{slug}`

**What they do:**
- Get published projects for portfolio page
- Get single project by slug for detail page

**Frontend integration:**
- Portfolio.tsx uses `usePublishedProjects()`
- ProjectDetail.tsx uses `useProject(slug)`

#### 3.8 Image Upload API (Later Phase)
**Endpoint:** `POST /api/admin/images/upload`

**What it does:**
- Uploads image to Azure Blob Storage
- Generates thumbnail
- Returns URLs

**Frontend integration:**
- ImageUpload component uses `useImageUpload()` mutation

## Implementation Order

### Step 1: Setup Cosmos DB Service (Infrastructure)
1. Add NuGet packages to api.csproj
2. Create Models folder with Project.cs
3. Create Services/CosmosDbService.cs
4. Add Cosmos DB configuration

### Step 2: Dashboard Endpoint (First Feature)
1. Create Functions/AdminDashboardFunction.cs
2. Implement dashboard stats logic
3. Test with local Cosmos DB emulator
4. Update frontend Dashboard.tsx
5. Test end-to-end

### Step 3: Projects CRUD (Core Features)
1. Create Functions/AdminProjectsFunction.cs (GET all, GET by ID)
2. Create Functions/AdminProjectCreateFunction.cs (POST)
3. Create Functions/AdminProjectUpdateFunction.cs (PUT)
4. Create Functions/AdminProjectDeleteFunction.cs (DELETE)
5. Update frontend pages one by one
6. Test each endpoint

### Step 4: Public Endpoints
1. Create Functions/PublicProjectsFunction.cs
2. Update Portfolio and ProjectDetail pages

### Step 5: Image Upload (Advanced Feature)
1. Add Azure Storage SDK
2. Create Functions/ImageUploadFunction.cs
3. Implement upload and thumbnail generation
4. Update ImageUpload component

## Environment Configuration

### Local Development (.env.local)
```env
VITE_APPINSIGHTS_CONNECTION_STRING=...
```

### Backend (local.settings.json)
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "CosmosDbConnectionString": "AccountEndpoint=https://localhost:8081/;AccountKey=...",
    "CosmosDbDatabaseName": "LegacyBuilders",
    "CosmosDbContainerName": "projects",
    "APPLICATIONINSIGHTS_CONNECTION_STRING": "..."
  }
}
```

## Testing Strategy

### Unit Tests
- Test repository methods with Cosmos DB emulator
- Test slug generation
- Test validation logic

### Integration Tests
- Test each endpoint with local emulator
- Test authentication/authorization
- Test error scenarios

### Manual Testing
1. Start Cosmos DB emulator
2. Run Azure Functions locally
3. Run frontend dev server
4. Test each page functionality
5. Verify data persistence

## Success Criteria

- [ ] Dashboard displays real stats from Cosmos DB
- [ ] Can create new projects via admin UI
- [ ] Can edit existing projects
- [ ] Can delete projects
- [ ] Published projects appear on public portfolio
- [ ] All API calls have proper error handling
- [ ] All operations tracked in Application Insights
- [ ] No CORS issues
- [ ] Data persists across server restarts

## Next Steps After Basic CRUD

1. Add authentication/authorization enforcement
2. Implement image upload functionality
3. Add data validation with FluentValidation
4. Add audit logging to audit container
5. Implement search/filtering
6. Add pagination for large datasets
7. Optimize Cosmos DB queries
8. Add caching layer
