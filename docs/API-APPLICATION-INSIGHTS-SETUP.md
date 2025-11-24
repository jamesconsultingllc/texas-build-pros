# API Application Insights Setup Guide

This guide covers the Application Insights telemetry integration for the Azure Functions API backend.

## Overview

The API has comprehensive Application Insights integration that provides:

- **Automatic Tracking:** HTTP requests, dependencies, exceptions, performance counters
- **Custom Tracking:** Custom events, metrics, Cosmos DB RU consumption
- **Distributed Tracing:** W3C standard correlation between frontend and backend
- **Dependency Tracking:** Cosmos DB operations with detailed RU metrics
- **Exception Tracking:** All unhandled exceptions are automatically tracked

## Configuration

### 1. Get Your Application Insights Connection String

#### From Azure Portal

1. Navigate to your Application Insights resource
2. Go to **Settings** > **Properties**
3. Copy the **Connection String** (starts with `InstrumentationKey=...`)

#### Using Azure CLI

```bash
# Production
az monitor app-insights component show \
  --resource-group legacy-builders-prod-rg \
  --app legacy-builders-prod-insights \
  --query connectionString -o tsv

# Staging
az monitor app-insights component show \
  --resource-group legacy-builders-staging-rg \
  --app legacy-builders-staging-insights \
  --query connectionString -o tsv

# Development
az monitor app-insights component show \
  --resource-group legacy-builders-dev-rg \
  --app legacy-builders-dev-insights \
  --query connectionString -o tsv
```

### 2. Local Development Setup

Update `api/local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "CosmosDbConnectionString": "AccountEndpoint=https://localhost:8081/;AccountKey=...",
    "CosmosDbDatabaseName": "LegacyBuilders",
    "CosmosDbContainerName": "projects",
    "APPLICATIONINSIGHTS_CONNECTION_STRING": "InstrumentationKey=YOUR_KEY_HERE;IngestionEndpoint=..."
  }
}
```

**Note:** `local.settings.json` is in `.gitignore` and should never be committed.

### 3. Azure Deployment Setup

Configure the environment variable in Azure Static Web Apps or Azure Functions:

```bash
# Via Azure Portal
# 1. Go to your Azure Function App or Static Web App
# 2. Settings > Configuration
# 3. Add Application Setting:
#    Name: APPLICATIONINSIGHTS_CONNECTION_STRING
#    Value: Your connection string

# Via Azure CLI
az functionapp config appsettings set \
  --name your-function-app-name \
  --resource-group your-resource-group \
  --settings "APPLICATIONINSIGHTS_CONNECTION_STRING=YourConnectionString"
```

## Architecture

### NuGet Packages

The API uses the following Application Insights packages (already installed):

```xml
<PackageReference Include="Microsoft.ApplicationInsights.WorkerService" Version="2.23.0" />
<PackageReference Include="Microsoft.Azure.Functions.Worker.ApplicationInsights" Version="2.50.0" />
```

### Configuration in Program.cs

Application Insights is configured in `api/Program.cs`:

```csharp
builder.Services
    .AddApplicationInsightsTelemetryWorkerService()
    .ConfigureFunctionsApplicationInsights();

// Register custom telemetry service
builder.Services.AddSingleton<ITelemetryService, TelemetryService>();
```

### Custom Telemetry Service

A custom `TelemetryService` is available for tracking custom events and metrics:

**Location:** `api/Services/TelemetryService.cs`

**Interface:**

```csharp
public interface ITelemetryService
{
    void TrackEvent(string eventName, Dictionary<string, string>? properties = null, Dictionary<string, double>? metrics = null);
    void TrackMetric(string metricName, double value, Dictionary<string, string>? properties = null);
    void TrackDependency(string dependencyName, string commandName, DateTimeOffset startTime, TimeSpan duration, bool success);
    void TrackException(Exception exception, Dictionary<string, string>? properties = null);
}
```

## Usage Examples

### 1. Inject Telemetry Service in Functions

```csharp
public class MyFunction
{
    private readonly ITelemetryService _telemetryService;
    private readonly ILogger<MyFunction> _logger;

    public MyFunction(ITelemetryService telemetryService, ILogger<MyFunction> logger)
    {
        _telemetryService = telemetryService;
        _logger = logger;
    }

    [Function("MyFunction")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequestData req)
    {
        // Track custom event
        _telemetryService.TrackEvent("MyCustomEvent", new Dictionary<string, string>
        {
            { "UserId", "user123" },
            { "Action", "ViewProject" }
        });

        // Track custom metric
        _telemetryService.TrackMetric("ProjectViewCount", 1);

        // Standard logging (automatically tracked)
        _logger.LogInformation("Processing request for MyFunction");

        // ... rest of function logic
    }
}
```

### 2. Tracking Cosmos DB Operations

The `CosmosDbService` automatically tracks RU consumption for Cosmos DB operations:

```csharp
private void TrackCosmosOperation(string operationName, double requestCharge, bool success, TimeSpan duration)
{
    _telemetryService?.TrackMetric($"CosmosDB.{operationName}.RU", requestCharge, new Dictionary<string, string>
    {
        { "Operation", operationName },
        { "Success", success.ToString() },
        { "DurationMs", duration.TotalMilliseconds.ToString("F2") }
    });

    _telemetryService?.TrackDependency(
        "CosmosDB",
        operationName,
        DateTimeOffset.UtcNow - duration,
        duration,
        success
    );
}
```

**Example usage in CreateProjectAsync:**

```csharp
public async Task<Project> CreateProjectAsync(Project project)
{
    var startTime = DateTimeOffset.UtcNow;
    try
    {
        var response = await _container.CreateItemAsync(project, new PartitionKey(project.Status));
        var duration = DateTimeOffset.UtcNow - startTime;

        _logger.LogInformation("Created project {ProjectId}. RU consumed: {RequestCharge}",
            project.Id, response.RequestCharge);

        // Track operation with RU consumption
        TrackCosmosOperation("CreateProject", response.RequestCharge, true, duration);

        return response.Resource;
    }
    catch (Exception ex)
    {
        var duration = DateTimeOffset.UtcNow - startTime;
        _logger.LogError(ex, "Error creating project");
        TrackCosmosOperation("CreateProject", 0, false, duration);
        throw;
    }
}
```

### 3. Exception Tracking

Exceptions are automatically tracked, but you can add custom properties:

```csharp
try
{
    // Your code
}
catch (Exception ex)
{
    _telemetryService.TrackException(ex, new Dictionary<string, string>
    {
        { "ProjectId", projectId },
        { "Operation", "CreateProject" },
        { "UserId", userId }
    });

    _logger.LogError(ex, "Failed to create project {ProjectId}", projectId);
    throw;
}
```

## What Gets Tracked Automatically

The Application Insights SDK automatically tracks:

1. **HTTP Requests:**
   - All incoming HTTP requests to Azure Functions
   - Request duration, response codes, URLs
   - Distributed trace correlation headers (W3C standard)

2. **Dependencies:**
   - HTTP calls to external services
   - Cosmos DB operations (when using custom tracking)
   - Other external dependencies

3. **Exceptions:**
   - All unhandled exceptions
   - Exception type, message, stack trace

4. **Performance Counters:**
   - CPU usage
   - Memory usage
   - Request rate

5. **Logs:**
   - All `ILogger` logs are sent to Application Insights
   - Log levels: Trace, Debug, Information, Warning, Error, Critical

## Distributed Tracing (Frontend to Backend)

The API automatically participates in W3C distributed tracing, allowing end-to-end correlation with the frontend:

### How It Works

1. **Frontend** (src/lib/telemetry.ts):
   - Configured with `enableCorsCorrelation: true`
   - Uses `distributedTracingMode: 2` (W3C standard)
   - Sends `traceparent` and `tracestate` headers

2. **Backend** (API):
   - Automatically reads W3C trace headers from requests
   - Correlates backend operations with frontend requests
   - Maintains the same operation ID across the entire request flow

### Viewing Correlated Traces

In Azure Portal > Application Insights:

1. Go to **Transaction Search** or **End-to-end transaction details**
2. Select a request from the frontend
3. View the entire operation tree including:
   - Frontend page view
   - API HTTP request
   - Cosmos DB dependencies
   - Any exceptions

## Monitoring and Queries

### Key Metrics to Monitor

1. **Request Rate:** `requests | summarize count() by bin(timestamp, 5m)`
2. **Failed Requests:** `requests | where success == false`
3. **Cosmos DB RU Consumption:** `customMetrics | where name startswith "CosmosDB" and name endswith ".RU"`
4. **Average Response Time:** `requests | summarize avg(duration) by name`
5. **Exceptions:** `exceptions | order by timestamp desc`

### KQL Query Examples

#### Top 10 Cosmos DB Operations by RU

```kusto
customMetrics
| where name endswith ".RU"
| extend Operation = tostring(customDimensions.Operation)
| summarize TotalRU = sum(value), AvgRU = avg(value), Count = count() by Operation
| order by TotalRU desc
| take 10
```

#### Request Success Rate

```kusto
requests
| summarize Total = count(), Failed = countif(success == false) by name
| extend SuccessRate = (Total - Failed) * 100.0 / Total
| order by SuccessRate asc
```

#### Exception Rate by Function

```kusto
exceptions
| extend FunctionName = tostring(customDimensions.FunctionName)
| summarize Count = count() by FunctionName, type
| order by Count desc
```

#### End-to-End Request Correlation

```kusto
union requests, dependencies
| where operation_Id == "YOUR_OPERATION_ID"
| project timestamp, itemType, name, duration, success
| order by timestamp asc
```

## Best Practices

### 1. Use Structured Logging

```csharp
// Good - structured with parameters
_logger.LogInformation("Created project {ProjectId} with status {Status}", projectId, status);

// Bad - string interpolation (not queryable)
_logger.LogInformation($"Created project {projectId} with status {status}");
```

### 2. Track Business Metrics

```csharp
// Track meaningful business events
_telemetryService.TrackEvent("ProjectPublished", new Dictionary<string, string>
{
    { "ProjectId", projectId },
    { "Budget", budget.ToString() },
    { "DaysToComplete", daysToComplete.ToString() }
});
```

### 3. Monitor RU Consumption

Always track Cosmos DB RU consumption to:
- Identify expensive queries
- Optimize partition key usage
- Control costs in serverless mode

### 4. Set Alert Rules

Create alerts for:
- Failed request rate > threshold
- Average response time > threshold
- Exception rate > threshold
- Daily RU consumption > budget

## Testing the Integration

### 1. Verify Local Tracking

```bash
# Start the API locally
cd api
func start

# Make a request
curl http://localhost:7071/api/admin/dashboard

# Check logs for telemetry confirmation
# Look for: "Tracked event", "Tracked metric", "Tracked dependency"
```

### 2. View in Azure Portal

1. Go to **Application Insights** > **Live Metrics**
2. Make requests to your API
3. See real-time telemetry flowing in

### 3. Test End-to-End Correlation

1. Open the frontend application
2. Perform an action that calls the API
3. In Application Insights:
   - Go to **Transaction Search**
   - Find the frontend page view
   - Click to see the full operation tree including backend calls

## Troubleshooting

### Telemetry Not Showing Up

1. **Check connection string:**
   ```bash
   # Verify environment variable is set
   echo $APPLICATIONINSIGHTS_CONNECTION_STRING
   ```

2. **Check Azure Portal:**
   - Data may take 2-3 minutes to appear
   - Check **Live Metrics** for real-time data

3. **Check logs:**
   ```bash
   # Look for Application Insights initialization messages
   func start --verbose
   ```

### High RU Consumption

1. **Identify expensive queries:**
   ```kusto
   customMetrics
   | where name endswith ".RU"
   | where value > 10
   | extend Operation = tostring(customDimensions.Operation)
   | order by value desc
   ```

2. **Optimize:**
   - Review partition key strategy
   - Add composite indexes
   - Use point reads instead of queries where possible
   - Implement caching for frequently accessed data

### Missing Correlation

1. **Verify W3C headers:**
   - Check that frontend sends `traceparent` header
   - Verify CORS configuration allows trace headers

2. **Check configuration:**
   - Frontend: `enableCorsCorrelation: true`
   - Backend: Application Insights automatically handles W3C headers

## Cost Optimization

Application Insights free tier includes:
- **5 GB/month** data ingestion (free)
- **90-day data retention**

To stay within free tier:

1. **Sample high-volume telemetry:**
   ```csharp
   builder.Services.Configure<TelemetryConfiguration>(config =>
   {
       config.TelemetryProcessorChainBuilder
           .UseAdaptiveSampling(maxTelemetryItemsPerSecond: 5)
           .Build();
   });
   ```

2. **Filter unnecessary telemetry:**
   - Exclude health check requests
   - Filter out known successful operations in high-traffic scenarios

3. **Monitor usage:**
   ```bash
   az monitor app-insights metrics show \
     --app legacy-builders-prod-insights \
     --resource-group legacy-builders-prod-rg \
     --metric "dataPoints" \
     --aggregation count
   ```

## Additional Resources

- [Application Insights for Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-monitoring)
- [W3C Distributed Tracing](https://www.w3.org/TR/trace-context/)
- [KQL Query Language](https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/)
- [Application Insights SDK Reference](https://learn.microsoft.com/en-us/dotnet/api/microsoft.applicationinsights)

## Summary

Your API now has:

- ✅ **Automatic HTTP request tracking**
- ✅ **Custom telemetry service for events and metrics**
- ✅ **Cosmos DB RU consumption tracking**
- ✅ **End-to-end distributed tracing with frontend**
- ✅ **Exception tracking with custom properties**
- ✅ **Performance monitoring**

All telemetry data flows to Azure Application Insights where you can:
- Monitor live metrics
- Query logs and metrics
- Set up alerts
- View end-to-end transaction traces
- Analyze performance bottlenecks
