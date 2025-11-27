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
│   └── AdminDashboardFunction.cs
├── Models/                 # Data models and DTOs
│   ├── Project.cs
│   └── DTOs.cs
├── Services/              # Business logic and data access
│   ├── CosmosDbService.cs
│   └── TelemetryService.cs
├── Program.cs             # Application configuration
├── api.csproj            # Project file with dependencies
└── local.settings.json   # Local configuration (not committed)
```

## Key Features

### Application Insights Integration

The API has comprehensive telemetry tracking:

- ✅ Automatic HTTP request tracking
- ✅ Custom event and metric tracking
- ✅ Cosmos DB RU consumption monitoring
- ✅ End-to-end distributed tracing with frontend
- ✅ Exception tracking with custom properties

**See:** [API Application Insights Setup Guide](../docs/API-APPLICATION-INSIGHTS-SETUP.md)

### Cosmos DB Service

The `CosmosDbService` provides:

- CRUD operations for projects
- Automatic RU tracking
- Query optimization
- Partition key management

**Usage example:**

```csharp
public class MyFunction
{
    private readonly ICosmosDbService _cosmosDb;

    public MyFunction(ICosmosDbService cosmosDb)
    {
        _cosmosDb = cosmosDb;
    }

    [Function("GetProjects")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequestData req)
    {
        var projects = await _cosmosDb.GetProjectsAsync("published");
        // ...
    }
}
```

### Telemetry Service

Custom telemetry tracking for business events:

```csharp
public class MyFunction
{
    private readonly ITelemetryService _telemetry;

    public MyFunction(ITelemetryService telemetry)
    {
        _telemetry = telemetry;
    }

    [Function("PublishProject")]
    public async Task<HttpResponseData> Run(...)
    {
        // Track custom event
        _telemetry.TrackEvent("ProjectPublished", new Dictionary<string, string>
        {
            { "ProjectId", projectId },
            { "UserId", userId }
        });

        // Track custom metric
        _telemetry.TrackMetric("ProjectPublishCount", 1);
    }
}
```

## Available Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/dashboard` | Get dashboard statistics |
| GET | `/api/projects` | List all published projects (public) |
| GET | `/api/projects/{slug}` | Get project by slug (public) |
| GET | `/api/admin/projects` | List all projects (admin) |
| GET | `/api/admin/projects/{id}` | Get project by ID (admin) |
| POST | `/api/admin/projects` | Create new project (admin) |
| PUT | `/api/admin/projects/{id}` | Update project (admin) |
| DELETE | `/api/admin/projects/{id}` | Delete project (admin) |
| POST | `/api/admin/images/upload` | Upload project image (admin) |

**Note:** Admin endpoints require authentication via Microsoft Entra ID (Azure AD).

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

### Azure Deployment

Configure in Azure Portal or via CLI:

```bash
# Set environment variable
az functionapp config appsettings set \
  --name your-function-app \
  --resource-group your-resource-group \
  --settings "APPLICATIONINSIGHTS_CONNECTION_STRING=YourConnectionString"
```

## Testing

### Unit Tests

```bash
# Run all tests
dotnet test

# Run with coverage
dotnet test /p:CollectCoverage=true
```

### Manual Testing

```bash
# Test dashboard endpoint
curl http://localhost:7071/api/admin/dashboard

# Test with authentication header
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:7071/api/admin/projects
```

## Deployment

### Using Azure Static Web Apps CLI

```bash
# Build and deploy
swa deploy --app-location . --api-location api
```

### Using Azure Functions Core Tools

```bash
# Deploy to Azure Functions
func azure functionapp publish your-function-app-name
```

### Using Azure CLI

```bash
# Deploy from local build
az functionapp deployment source config-zip \
  --resource-group your-resource-group \
  --name your-function-app \
  --src api.zip
```

## Troubleshooting

### Cosmos DB Connection Issues

```bash
# Test Cosmos DB emulator connection
curl https://localhost:8081/_explorer/index.html

# Check if container exists
az cosmosdb sql container show \
  --account-name your-cosmos-account \
  --database-name LegacyBuilders \
  --name projects \
  --resource-group your-resource-group
```

### Application Insights Not Working

1. Verify connection string is set:
   ```bash
   echo $APPLICATIONINSIGHTS_CONNECTION_STRING
   ```

2. Check Azure Portal > Application Insights > Live Metrics

3. Enable verbose logging:
   ```bash
   func start --verbose
   ```

### Function Not Triggering

1. Check function.json is generated (done automatically)
2. Verify route configuration in `[HttpTrigger]` attribute
3. Check CORS settings in `host.json`

## Documentation

- [API Application Insights Setup](../docs/API-APPLICATION-INSIGHTS-SETUP.md) - Complete telemetry guide
- [Authentication Implementation Plan](../docs/authentication-implementation-plan.md) - Backend implementation checklist
- [Main CLAUDE.md](../CLAUDE.md) - Project overview and architecture

## Package Dependencies

Key NuGet packages:

- **Microsoft.Azure.Functions.Worker** (v2.50.0) - Azure Functions runtime
- **Microsoft.Azure.Cosmos** (v3.44.1) - Cosmos DB SDK
- **Microsoft.ApplicationInsights.WorkerService** (v2.23.0) - Application Insights SDK
- **Microsoft.Azure.Functions.Worker.ApplicationInsights** (v2.50.0) - Functions + App Insights integration

## Support

For issues or questions:

1. Check the documentation in `/docs`
2. Review Azure Functions logs in Azure Portal
3. Check Application Insights for errors and performance issues
4. Review CLAUDE.md for architecture decisions
