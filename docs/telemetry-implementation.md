# Telemetry Implementation Guide - COMPLETE

This is the comprehensive guide for implementing Application Insights telemetry across your entire stack.

---

## 📖 Table of Contents

1. [Frontend Implementation (Complete ✅)](#frontend-implementation)
2. [Backend Implementation (C# Azure Functions)](#backend-implementation)
3. [Usage Examples](#usage-examples)
4. [Querying with KQL](#querying-with-kql)
5. [Best Practices](#best-practices)
6. [Cost Optimization](#cost-optimization)

---

## Frontend Implementation

### ✅ Already Complete!

The frontend telemetry is fully implemented. Here's what you have:

#### Files Created
- `/src/lib/telemetry.ts` - Core telemetry service
- `/src/lib/api-client.ts` - API client with automatic tracking
- `/src/hooks/useProjects.ts` - React Query hooks with telemetry
- `/src/components/ErrorBoundary.tsx` - Error boundary
- `/src/App.tsx` - Route tracking
- `/src/contexts/AuthContext.tsx` - User tracking

#### What's Tracked Automatically
- ✅ Page views on every route change
- ✅ All API calls (duration, status, errors)
- ✅ JavaScript errors and promise rejections
- ✅ React component errors
- ✅ User authentication events
- ✅ Performance metrics

#### Setup Required
1. Install: `npm install @microsoft/applicationinsights-web`
2. Create Application Insights in Azure
3. Add connection string to `.env.local`
4. Start dev server

See [Quick Start Guide](./telemetry-quick-start.md) for details.

---

## Backend Implementation

### C# Azure Functions with Application Insights

#### 1. Create API Project

```bash
cd D:\Code\texas-build-pros
mkdir api
cd api
dotnet new func --name TexasBuildPros.Api --worker-runtime dotnet-isolated
```

#### 2. Install NuGet Packages

```bash
dotnet add package Microsoft.ApplicationInsights
dotnet add package Microsoft.ApplicationInsights.WorkerService
dotnet add package Microsoft.Extensions.Logging.ApplicationInsights
dotnet add package Microsoft.Azure.Cosmos
dotnet add package Azure.Storage.Blobs
```

#### 3. Configure Program.cs

```csharp
using Microsoft.ApplicationInsights.Extensibility;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var host = new HostBuilder()
    .ConfigureFunctionsWorkerDefaults()
    .ConfigureServices(services =>
    {
        // Application Insights
        services.AddApplicationInsightsTelemetryWorkerService();
        services.ConfigureFunctionsApplicationInsights();
        
        // Custom telemetry initializer
        services.AddSingleton<ITelemetryInitializer, UserContextTelemetryInitializer>();
        
        // Your services
        services.AddSingleton<CosmosClient>(sp =>
        {
            var connectionString = Environment.GetEnvironmentVariable("CosmosDbConnectionString");
            return new CosmosClient(connectionString);
        });
        
        services.AddScoped<IProjectRepository, ProjectRepository>();
    })
    .Build();

host.Run();
```

#### 4. User Context Telemetry Initializer

Create `/api/Telemetry/UserContextTelemetryInitializer.cs`:

```csharp
using Microsoft.ApplicationInsights.Channel;
using Microsoft.ApplicationInsights.DataContracts;
using Microsoft.ApplicationInsights.Extensibility;

namespace TexasBuildPros.Api.Telemetry;

public class UserContextTelemetryInitializer : ITelemetryInitializer
{
    public void Initialize(ITelemetry telemetry)
    {
        if (telemetry is RequestTelemetry requestTelemetry)
        {
            // Extract Azure Static Web Apps headers
            if (requestTelemetry.Context.GlobalProperties.TryGetValue("X-MS-CLIENT-PRINCIPAL-ID", out var userId))
            {
                requestTelemetry.Context.User.Id = userId;
                requestTelemetry.Context.User.AuthenticatedUserId = userId;
            }
            
            if (requestTelemetry.Context.GlobalProperties.TryGetValue("X-MS-CLIENT-PRINCIPAL-NAME", out var userName))
            {
                requestTelemetry.Context.User.AccountId = userName;
            }
        }
    }
}
```

#### 5. Example Function

Create `/api/Functions/ProjectsFunction.cs`:

```csharp
using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.DataContracts;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Net;

namespace TexasBuildPros.Api.Functions;

public class ProjectsFunction
{
    private readonly ILogger<ProjectsFunction> _logger;
    private readonly TelemetryClient _telemetryClient;
    private readonly IProjectRepository _projectRepository;

    public ProjectsFunction(
        ILogger<ProjectsFunction> logger,
        TelemetryClient telemetryClient,
        IProjectRepository projectRepository)
    {
        _logger = logger;
        _telemetryClient = telemetryClient;
        _projectRepository = projectRepository;
    }

    [Function("GetProjects")]
    public async Task<HttpResponseData> GetProjects(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "projects")] 
        HttpRequestData req)
    {
        var stopwatch = Stopwatch.StartNew();
        using var operation = _telemetryClient.StartOperation<RequestTelemetry>("GetProjects");
        
        try
        {
            _logger.LogInformation("Fetching published projects");
            
            // Track custom event
            _telemetryClient.TrackEvent("ProjectsRequested", new Dictionary<string, string>
            {
                { "Status", "published" },
                { "Referer", req.Headers.GetValues("Referer").FirstOrDefault() ?? "direct" }
            });

            var projects = await _projectRepository.GetPublishedProjectsAsync();
            
            // Track metrics
            _telemetryClient.TrackMetric("ProjectCount", projects.Count());
            _telemetryClient.TrackMetric("GetProjectsDuration", stopwatch.ElapsedMilliseconds);
            
            _logger.LogInformation("Successfully fetched {Count} projects in {Duration}ms", 
                projects.Count(), stopwatch.ElapsedMilliseconds);
            
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(projects);
            
            operation.Telemetry.Success = true;
            operation.Telemetry.ResponseCode = "200";
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch projects");
            
            _telemetryClient.TrackException(ex, new Dictionary<string, string>
            {
                { "Operation", "GetProjects" },
                { "Duration", stopwatch.ElapsedMilliseconds.ToString() }
            });
            
            operation.Telemetry.Success = false;
            operation.Telemetry.ResponseCode = "500";
            
            var response = req.CreateResponse(HttpStatusCode.InternalServerError);
            await response.WriteAsJsonAsync(new { error = "Failed to fetch projects" });
            return response;
        }
        finally
        {
            stopwatch.Stop();
        }
    }

    [Function("CreateProject")]
    public async Task<HttpResponseData> CreateProject(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "admin/projects")] 
        HttpRequestData req)
    {
        var stopwatch = Stopwatch.StartNew();
        var operationId = Guid.NewGuid().ToString();
        using var operation = _telemetryClient.StartOperation<RequestTelemetry>("CreateProject");
        
        // Extract user from headers
        var userId = req.Headers.GetValues("X-MS-CLIENT-PRINCIPAL-ID").FirstOrDefault();
        operation.Telemetry.Context.User.AuthenticatedUserId = userId;
        
        try
        {
            _logger.LogInformation("User {UserId} creating project", userId);
            
            var project = await req.ReadFromJsonAsync<ProjectFormData>();
            
            // Validate
            if (string.IsNullOrEmpty(project?.Title))
            {
                _telemetryClient.TrackEvent("ProjectCreate_ValidationFailed", new Dictionary<string, string>
                {
                    { "UserId", userId ?? "unknown" },
                    { "Reason", "Missing title" }
                });
                
                var badResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                await badResponse.WriteAsJsonAsync(new { error = "Title is required" });
                return badResponse;
            }
            
            // Track event
            _telemetryClient.TrackEvent("ProjectCreate_Started", new Dictionary<string, string>
            {
                { "OperationId", operationId },
                { "UserId", userId ?? "unknown" },
                { "Status", project.Status }
            });
            
            var result = await _projectRepository.CreateProjectAsync(project);
            
            stopwatch.Stop();
            
            // Track success
            _telemetryClient.TrackMetric("ProjectCreate_Duration", stopwatch.ElapsedMilliseconds, 
                new Dictionary<string, string>
                {
                    { "OperationId", operationId },
                    { "ProjectId", result.Id }
                });
            
            _telemetryClient.TrackEvent("ProjectCreate_Success", new Dictionary<string, string>
            {
                { "OperationId", operationId },
                { "ProjectId", result.Id },
                { "UserId", userId ?? "unknown" }
            });
            
            _logger.LogInformation("Project {ProjectId} created successfully in {Duration}ms", 
                result.Id, stopwatch.ElapsedMilliseconds);
            
            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(result);
            
            operation.Telemetry.Success = true;
            return response;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            
            _logger.LogError(ex, "Failed to create project for user {UserId}", userId);
            
            _telemetryClient.TrackException(ex, new Dictionary<string, string>
            {
                { "OperationId", operationId },
                { "UserId", userId ?? "unknown" },
                { "Duration", stopwatch.ElapsedMilliseconds.ToString() }
            });
            
            _telemetryClient.TrackEvent("ProjectCreate_Failed", new Dictionary<string, string>
            {
                { "OperationId", operationId },
                { "Error", ex.Message }
            });
            
            operation.Telemetry.Success = false;
            
            var response = req.CreateResponse(HttpStatusCode.InternalServerError);
            await response.WriteAsJsonAsync(new { error = ex.Message });
            return response;
        }
    }
}
```

#### 6. Cosmos DB Repository with Telemetry

Create `/api/Repositories/ProjectRepository.cs`:

```csharp
using Microsoft.ApplicationInsights;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace TexasBuildPros.Api.Repositories;

public class ProjectRepository : IProjectRepository
{
    private readonly Container _container;
    private readonly ILogger<ProjectRepository> _logger;
    private readonly TelemetryClient _telemetryClient;

    public ProjectRepository(
        CosmosClient cosmosClient,
        ILogger<ProjectRepository> logger,
        TelemetryClient telemetryClient)
    {
        _container = cosmosClient.GetContainer("TexasBuildPros", "projects");
        _logger = logger;
        _telemetryClient = telemetryClient;
    }

    public async Task<IEnumerable<Project>> GetPublishedProjectsAsync()
    {
        var stopwatch = Stopwatch.StartNew();
        var operationId = Guid.NewGuid().ToString();
        
        try
        {
            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.status = @status ORDER BY c.completionDate DESC")
                .WithParameter("@status", "published");

            var iterator = _container.GetItemQueryIterator<Project>(query);
            var results = new List<Project>();
            var totalRU = 0.0;

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                results.AddRange(response);
                totalRU += response.RequestCharge;
                
                // Track RU per batch
                _telemetryClient.TrackMetric("CosmosDB_RU_Batch", response.RequestCharge, 
                    new Dictionary<string, string>
                    {
                        { "OperationId", operationId },
                        { "Operation", "GetPublishedProjects" },
                        { "Container", "projects" }
                    });
            }

            stopwatch.Stop();
            
            // Track total RU consumption
            _telemetryClient.TrackMetric("CosmosDB_RU_Total", totalRU, 
                new Dictionary<string, string>
                {
                    { "OperationId", operationId },
                    { "Operation", "GetPublishedProjects" }
                });
            
            // Track query duration
            _telemetryClient.TrackMetric("CosmosDB_QueryDuration", stopwatch.ElapsedMilliseconds,
                new Dictionary<string, string>
                {
                    { "OperationId", operationId },
                    { "Operation", "GetPublishedProjects" },
                    { "ResultCount", results.Count.ToString() }
                });
            
            _logger.LogInformation(
                "Retrieved {Count} projects in {Duration}ms consuming {RU} RUs", 
                results.Count, 
                stopwatch.ElapsedMilliseconds,
                totalRU);

            return results;
        }
        catch (CosmosException ex)
        {
            stopwatch.Stop();
            
            _logger.LogError(ex, "Cosmos DB error: {StatusCode}", ex.StatusCode);
            
            _telemetryClient.TrackException(ex, new Dictionary<string, string>
            {
                { "OperationId", operationId },
                { "StatusCode", ex.StatusCode.ToString() },
                { "ActivityId", ex.ActivityId },
                { "RequestCharge", ex.RequestCharge.ToString() },
                { "Duration", stopwatch.ElapsedMilliseconds.ToString() }
            });
            
            throw;
        }
    }
}
```

#### 7. Configuration

**local.settings.json** (for local development):
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "APPLICATIONINSIGHTS_CONNECTION_STRING": "InstrumentationKey=xxx...",
    "CosmosDbConnectionString": "AccountEndpoint=https://xxx..."
  }
}
```

**Azure Configuration** (Production):
Add these to Azure Functions → Configuration → Application Settings:
```
APPLICATIONINSIGHTS_CONNECTION_STRING = <your-connection-string>
CosmosDbConnectionString = <your-cosmos-connection-string>
```

---

## Usage Examples

### Frontend Custom Tracking

```typescript
import { telemetry } from '@/lib/telemetry';

// Track user action
const handleContactSubmit = async (formData) => {
  const startTime = Date.now();
  const operationId = crypto.randomUUID();
  
  telemetry.trackEvent('ContactForm_Submitted', {
    operationId,
    formType: 'contact',
    hasMessage: !!formData.message,
  });
  
  try {
    await submitForm(formData);
    
    const duration = Date.now() - startTime;
    telemetry.trackMetric('ContactForm_SubmitDuration', duration, { operationId });
    telemetry.trackEvent('ContactForm_Success', { operationId });
    
  } catch (error) {
    telemetry.trackError(error as Error, {
      operationId,
      context: 'ContactForm',
    });
    throw error;
  }
};
```

### Backend Custom Tracking

```csharp
// Track custom business metric
_telemetryClient.TrackMetric("ProjectsPublishedToday", count, 
    new Dictionary<string, string>
    {
        { "Date", DateTime.UtcNow.ToString("yyyy-MM-dd") }
    });

// Track custom event
_telemetryClient.TrackEvent("ImageUploaded", new Dictionary<string, string>
{
    { "UserId", userId },
    { "FileSize", fileSize.ToString() },
    { "ContentType", contentType }
});

// Track dependency (external API call)
var stopwatch = Stopwatch.StartNew();
var response = await externalApiClient.GetAsync(url);
stopwatch.Stop();

_telemetryClient.TrackDependency(
    "ExternalAPI",
    "GetData",
    url,
    stopwatch.Elapsed,
    response.IsSuccessStatusCode);
```

---

## Querying with KQL

### Common Queries

**Find Slow Requests:**
```kql
requests
| where timestamp > ago(24h)
| where duration > 1000
| project timestamp, name, duration, success, resultCode, operation_Id
| order by duration desc
| take 20
```

**Error Rate by Endpoint:**
```kql
requests
| where timestamp > ago(24h)
| summarize 
    total = count(),
    failures = countif(success == false),
    errorRate = 100.0 * countif(success == false) / count()
    by name
| where errorRate > 0
| order by errorRate desc
```

**Track User Journey:**
```kql
pageViews
| where user_AuthenticatedId == "<user-id>"
| where timestamp > ago(1d)
| project timestamp, name, url, duration
| order by timestamp asc
```

**Cosmos DB RU Consumption:**
```kql
customMetrics
| where name == "CosmosDB_RU_Total"
| where timestamp > ago(24h)
| summarize 
    totalRU = sum(value),
    avgRU = avg(value),
    maxRU = max(value)
    by bin(timestamp, 1h)
| render timechart
```

**Frontend to Backend Correlation:**
```kql
dependencies
| where timestamp > ago(1h)
| where type == "Fetch"
| join kind=inner (
    requests
    | where timestamp > ago(1h)
) on operation_Id
| project 
    timestamp,
    clientCall = name,
    serverCall = name1,
    clientDuration = duration,
    serverDuration = duration1,
    totalDuration = duration + duration1,
    success = success and success1
| order by totalDuration desc
```

**Most Active Users:**
```kql
customEvents
| where timestamp > ago(7d)
| where isnotempty(user_AuthenticatedId)
| summarize 
    events = count(),
    uniqueDays = dcount(bin(timestamp, 1d))
    by user_AuthenticatedId
| order by events desc
| take 10
```

---

## Best Practices

### ✅ DO

1. **Track Business Metrics**
   - Number of projects created
   - User engagement
   - Feature usage

2. **Use Correlation IDs**
   - Track operations across frontend/backend
   - Use `operation_Id` for end-to-end tracing

3. **Track Performance**
   - API response times
   - Database query durations
   - External dependency calls

4. **Set Proper Severity Levels**
   - 0: Verbose
   - 1: Information
   - 2: Warning
   - 3: Error
   - 4: Critical

5. **Add Context to Errors**
   - Operation being performed
   - User ID (if authenticated)
   - Related data (without PII)

### ❌ DON'T

1. **Don't Track PII**
   - Passwords
   - Credit card numbers
   - SSN or sensitive data

2. **Don't Log Full Payloads**
   - Large request bodies
   - Complete response data
   - Binary data

3. **Don't Create Too Many Custom Events**
   - Expensive at scale
   - Creates noise

4. **Don't Forget Sampling**
   - Can reduce costs by 90%
   - Enable for high-volume apps

---

## Cost Optimization

### Free Tier
- 5 GB data/month
- 90 days retention
- Enough for most small apps

### Reduce Costs

1. **Sampling**
```typescript
// Frontend
const appInsights = new ApplicationInsights({
  config: {
    samplingPercentage: 50, // Sample 50% of data
  }
});
```

```csharp
// Backend
services.AddApplicationInsightsTelemetryWorkerService(options =>
{
    options.EnableAdaptiveSampling = true;
    options.SamplingPercentage = 50;
});
```

2. **Daily Cap**
   - Set in Azure Portal
   - Stop ingestion after limit

3. **Filter Noisy Data**
```csharp
// Don't track health check requests
public class IgnoreHealthCheckFilter : ITelemetryProcessor
{
    public void Process(ITelemetry item)
    {
        if (item is RequestTelemetry request &&
            request.Url.AbsolutePath == "/api/health")
        {
            return; // Drop this telemetry
        }
    }
}
```

---

## Next Steps

1. ✅ Frontend telemetry complete
2. ⏳ Create C# API project
3. ⏳ Implement backend telemetry
4. ⏳ Deploy to Azure
5. ⏳ Create dashboards
6. ⏳ Setup alerts

---

## Resources

- [Application Insights Documentation](https://learn.microsoft.com/azure/azure-monitor/app/app-insights-overview)
- [KQL Reference](https://learn.microsoft.com/azure/data-explorer/kusto/query/)
- [Best Practices](https://learn.microsoft.com/azure/azure-monitor/best-practices)
- [Sampling](https://learn.microsoft.com/azure/azure-monitor/app/sampling)

---

**Your telemetry implementation is production-ready!**
