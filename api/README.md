# Legacy Builders API

Azure Functions backend for Legacy Builders Investments portfolio application.

## Quick Start

### 1. Install Dependencies

```bash
cd api
dotnet restore
```

### 2. Configure Application Settings

Copy `local.settings.json.example` (if it exists) or update `local.settings.json` with your settings:

```json
{
  "IsEncrypted": false,
  "Values": {
    "StorageAccountConnectionString": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "CosmosDbConnectionString": "AccountEndpoint=https://localhost:8081/;AccountKey=...",
    "CosmosDbDatabaseName": "LegacyBuilders",
    "CosmosDbContainerName": "projects",
    "APPLICATIONINSIGHTS_CONNECTION_STRING": "InstrumentationKey=YOUR_KEY_HERE;..."
  }
}
```

**Get your Application Insights connection string:**

```bash
# From Azure CLI (Dev environment)
az monitor app-insights component show \
  --resource-group legacy-builders-dev-rg \
  --app legacy-builders-dev-insights \
  --query connectionString -o tsv
```

Or from Azure Portal: **Application Insights > Settings > Properties > Connection String**

### 3. Start Local Cosmos DB Emulator

**Windows:**
- Download and install [Azure Cosmos DB Emulator](https://learn.microsoft.com/en-us/azure/cosmos-db/local-emulator)
- Start the emulator

**Docker (Linux/Mac/Windows):**
```bash
docker run -p 8081:8081 -p 10251-10254:10251-10254 \
  mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest
```

### 4. Run the API

```bash
# Using Azure Functions Core Tools
func start

# Or using dotnet
dotnet run
```

API will be available at: `http://localhost:7071`

## Project Structure

```
api/
├── Functions/              # HTTP-triggered functions
│   ├── AdminDashboardFunction.cs
│   ├── AdminProjectsFunction.cs
│   ├── PublicProjectsFunction.cs
│   └── ImageFunction.cs
├── Middleware/            # Authentication & Authorization
│   ├── AuthenticationMiddleware.cs
│   └── AuthorizationMiddleware.cs
├── Models/                 # Data models and DTOs
│   ├── Project.cs
│   ├── DTOs.cs
│   ├── ApiError.cs
│   └── ClientPrincipal.cs
├── Services/              # Business logic and data access
│   ├── CosmosDbService.cs
│   ├── BlobStorageService.cs
│   └── TelemetryService.cs
├── Program.cs             # Application configuration
├── api.csproj            # Project file with dependencies
└── local.settings.json   # Local configuration (not committed)
```

## Security Architecture

The API implements a **middleware-based security model** for authentication and authorization.

### Authentication & Authorization Flow

```
Request → SWA Route Auth → AuthenticationMiddleware → AuthorizationMiddleware → Function
                                    ↓                         ↓
                              Parse x-ms-client-principal    Check admin role
                              Set context.Items["User"]      Return 401/403 if denied
```

### Protected Routes

| Route Pattern | Required Role | Description |
|--------------|---------------|-------------|
| `/api/manage/*` | `admin` | All admin project management endpoints |
| `/api/dashboard` | `admin` | Dashboard statistics |
| `/api/projects/*` | `anonymous` | Public portfolio endpoints (no auth required) |

### Error Responses

All authentication and authorization errors return structured JSON responses:

```json
{
  "code": "AUTH_REQUIRED",
  "message": "Authentication required"
}
```

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | User is not authenticated |
| `AUTH_FORBIDDEN` | 403 | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_FAILED` | 400 | Input validation error |
| `SERVER_ERROR` | 500 | Internal server error |

### Security Layers

1. **Route-level (staticwebapp.config.json)**: Azure SWA blocks unauthenticated requests
2. **AuthenticationMiddleware**: Parses `x-ms-client-principal` header from SWA
3. **AuthorizationMiddleware**: Enforces admin role for protected routes

### Security Headers

Azure Static Web Apps injects the `x-ms-client-principal` header for authenticated users:

```json
{
  "identityProvider": "aad",
  "userId": "user-guid",
  "userDetails": "user@email.com",
  "userRoles": ["authenticated", "anonymous", "admin"]
}
```

**Security Note**: In production, Azure SWA strips any client-provided `x-ms-client-principal` header. Only SWA can inject this header after validating the user's session.

## Key Features

### Application Insights Integration

The API has comprehensive telemetry tracking:

- ✅ Automatic HTTP request tracking
- ✅ Custom event and metric tracking
- ✅ Cosmos DB RU consumption monitoring
- ✅ End-to-end distributed tracing with frontend
- ✅ Exception tracking with custom properties
- ✅ Authorization failure auditing

**See:** [API Application Insights Setup Guide](../docs/API-APPLICATION-INSIGHTS-SETUP.md)

### Cosmos DB Service

The `CosmosDbService` provides:

- CRUD operations for projects
- Automatic RU tracking
- Query optimization
- Partition key management

### Telemetry Service

Custom telemetry tracking including security events:

```csharp
// Track authorization failures
_telemetry.TrackAuthorizationFailure(
    userId: principal.UserId,
    route: "/api/manage/projects",
    method: "POST",
    reason: "InsufficientRole"
);
```

## Available Endpoints

### Public Endpoints (No Authentication Required)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/projects` | List all published projects |
| GET | `/api/projects/{slug}` | Get project by URL slug |

### Admin Endpoints (Requires `admin` Role)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/dashboard` | Get dashboard statistics |
| GET | `/api/manage/projects` | List all projects (all statuses) |
| GET | `/api/manage/projects/{id}` | Get project by ID |
| POST | `/api/manage/projects` | Create new project |
| PUT | `/api/manage/projects/{id}` | Update project |
| DELETE | `/api/manage/projects/{id}` | Delete project |
| POST | `/api/manage/images/sas-token` | Generate SAS token for image upload |

## Development Commands

```bash
# Build the project
dotnet build

# Run tests
dotnet test

# Clean build artifacts
dotnet clean

# Restore dependencies
dotnet restore

# Start with specific port
func start --port 7072

# Start with detailed logging
func start --verbose
```

## Environment Variables

### Local Development

Configure in `local.settings.json`:

| Variable | Description | Example |
|----------|-------------|---------|
| `FUNCTIONS_WORKER_RUNTIME` | Runtime type | `dotnet-isolated` |
| `CosmosDbConnectionString` | Cosmos DB connection | `AccountEndpoint=https://...` |
| `CosmosDbDatabaseName` | Database name | `LegacyBuilders` |
| `CosmosDbContainerName` | Container name | `projects` |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | App Insights connection | `InstrumentationKey=...` |

## Testing

### E2E Tests with Authentication

E2E tests use the `x-ms-client-principal` header to simulate authentication:

```typescript
// In features/support/api-helpers.ts
const clientPrincipal = {
  identityProvider: 'aad',
  userId: 'test-admin',
  userDetails: 'test-admin@test.com',
  userRoles: ['authenticated', 'anonymous', 'admin'],
};

const encodedPrincipal = Buffer.from(JSON.stringify(clientPrincipal)).toString('base64');

await fetch('/api/manage/projects', {
  headers: { 'x-ms-client-principal': encodedPrincipal }
});
```

This works with SWA CLI in local development. In production, Azure SWA sanitizes this header.

## Documentation

- [API Implementation Plan](../docs/API-IMPLEMENTATION-PLAN.md) - API Security Architecture
- [API Application Insights Setup](../docs/API-APPLICATION-INSIGHTS-SETUP.md) - Complete telemetry guide
- [Authentication Implementation Plan](../docs/authentication-implementation-plan.md) - Backend implementation checklist
- [Main CLAUDE.md](../CLAUDE.md) - Project overview and architecture
