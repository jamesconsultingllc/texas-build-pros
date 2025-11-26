using Azure.Identity;
using LegacyBuilders.Api.Services;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Text.Json.Serialization;

var host = new HostBuilder()
    .ConfigureFunctionsWebApplication()
    .ConfigureServices(services =>
    {
        // Configure JSON serialization options for camelCase
        services.Configure<JsonSerializerOptions>(options =>
        {
            options.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            options.Converters.Add(new JsonStringEnumConverter());
        });

        // Configure CORS for local development and Azure Static Web Apps
        services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", policy =>
            {
                policy.WithOrigins(
                        "http://localhost:8080",
                        "http://127.0.0.1:8080",
                        "https://*.azurestaticapps.net"
                    )
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .AllowCredentials();
            });
        });

        services
            .AddApplicationInsightsTelemetryWorkerService()
            .ConfigureFunctionsApplicationInsights();

        // Register custom telemetry service
        services.AddSingleton<ITelemetryService, TelemetryService>();

        // Configure Cosmos DB with either Connection String or Managed Identity
        var cosmosConnectionString = Environment.GetEnvironmentVariable("CosmosDbConnectionString");
        var cosmosEndpoint = Environment.GetEnvironmentVariable("CosmosDbEndpoint");
        var databaseName = Environment.GetEnvironmentVariable("CosmosDbDatabaseName") ?? "LegacyBuilders";
        var containerName = Environment.GetEnvironmentVariable("CosmosDbContainerName") ?? "projects";

        services.AddSingleton(s =>
        {
            CosmosClient cosmosClient;
            var cosmosClientOptions = new CosmosClientOptions
            {
                SerializerOptions = new CosmosSerializationOptions
                {
                    PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase
                }
            };

            // Prefer connection string if available (for preview environments and local development)
            if (!string.IsNullOrEmpty(cosmosConnectionString))
            {
                cosmosClient = new CosmosClient(cosmosConnectionString, cosmosClientOptions);
            }
            else if (!string.IsNullOrEmpty(cosmosEndpoint))
            {
                // Use Managed Identity for production environment
                cosmosClient = new CosmosClient(cosmosEndpoint, 
                    new DefaultAzureCredential(), 
                    cosmosClientOptions);
            }
            else
            {
                throw new InvalidOperationException(
                    "Neither CosmosDbConnectionString nor CosmosDbEndpoint environment variable is configured. " +
                    "Please set CosmosDbConnectionString for preview/local environments or CosmosDbEndpoint for production.");
            }

            return cosmosClient;
        });

        services.AddSingleton<ICosmosDbService>(s =>
        {
            var cosmosClient = s.GetRequiredService<CosmosClient>();
            var logger = s.GetRequiredService<ILogger<CosmosDbService>>();
            var telemetryService = s.GetService<ITelemetryService>();
            return new CosmosDbService(cosmosClient, databaseName, containerName, logger, telemetryService);
        });
    })
    .Build();

await host.RunAsync();
