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
GET  /api/admin/dashboard               - Get dashboard stats + recent projects
GET  /api/admin/projects                - Get all projects (all statuses)
GET  /api/admin/projects/{id}           - Get single project by ID
POST /api/admin/projects                - Create new project
PUT  /api/admin/projects/{id}           - Update existing project
DELETE /api/admin/projects/{id}         - Delete project
POST /api/admin/images/upload           - Upload image to Azure Blob Storage
```

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
