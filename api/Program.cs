using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = FunctionsApplication.CreateBuilder(args);

builder.ConfigureFunctionsWebApplication();

builder.Services
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
