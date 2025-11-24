using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Cosmos.Linq;
using Microsoft.Extensions.Logging;
using LegacyBuilders.Api.Models;

namespace LegacyBuilders.Api.Services;

public interface ICosmosDbService
{
    Task<Project?> GetProjectByIdAsync(string id);
    Task<Project?> GetProjectBySlugAsync(string slug);
    Task<bool> SlugExistsAsync(string slug, string? excludeProjectId = null);
    Task<List<Project>> GetProjectsAsync(string? status = null);
    Task<List<Project>> GetRecentProjectsAsync(int count = 5);
    Task<Project> CreateProjectAsync(Project project);
    Task<Project> UpdateProjectAsync(Project project);
    Task DeleteProjectAsync(string id);
    Task<(int total, int published, int draft)> GetProjectStatsAsync();
}

public class CosmosDbService : ICosmosDbService
{
    private readonly Container _container;
    private readonly ILogger<CosmosDbService> _logger;
    private readonly ITelemetryService? _telemetryService;

    public CosmosDbService(
        CosmosClient cosmosClient,
        string databaseName,
        string containerName,
        ILogger<CosmosDbService> logger,
        ITelemetryService? telemetryService = null)
    {
        _container = cosmosClient.GetContainer(databaseName, containerName);
        _logger = logger;
        _telemetryService = telemetryService;
    }

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

    public async Task<Project?> GetProjectByIdAsync(string id)
    {
        try
        {
            // Query by id since we don't know the partition key
            var query = _container.GetItemLinqQueryable<Project>()
                .Where(p => p.Id == id)
                .ToFeedIterator();

            if (query.HasMoreResults)
            {
                var response = await query.ReadNextAsync();
                return response.FirstOrDefault();
            }

            return null;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Project with ID {ProjectId} not found", id);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching project by ID {ProjectId}", id);
            throw;
        }
    }

    public async Task<Project?> GetProjectBySlugAsync(string slug)
    {
        try
        {
            var query = _container.GetItemLinqQueryable<Project>()
                .Where(p => p.Slug == slug && p.Status == "published")
                .ToFeedIterator();

            if (query.HasMoreResults)
            {
                var response = await query.ReadNextAsync();
                return response.FirstOrDefault();
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching project by slug {Slug}", slug);
            throw;
        }
    }

    public async Task<bool> SlugExistsAsync(string slug, string? excludeProjectId = null)
    {
        try
        {
            var query = _container.GetItemLinqQueryable<Project>()
                .Where(p => p.Slug == slug)
                .ToFeedIterator();

            while (query.HasMoreResults)
            {
                var response = await query.ReadNextAsync();
                var projects = response.ToList();

                // If we're excluding a project (for updates), filter it out
                if (!string.IsNullOrEmpty(excludeProjectId))
                {
                    projects = projects.Where(p => p.Id != excludeProjectId).ToList();
                }

                if (projects.Any())
                {
                    return true;
                }
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if slug exists {Slug}", slug);
            throw;
        }
    }

    public async Task<List<Project>> GetProjectsAsync(string? status = null)
    {
        try
        {
            IQueryable<Project> query = _container.GetItemLinqQueryable<Project>();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(p => p.Status == status);
            }

            var iterator = query
                .OrderByDescending(p => p.UpdatedAt)
                .ToFeedIterator();

            var projects = new List<Project>();
            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                projects.AddRange(response);
            }

            return projects;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching projects with status {Status}", status);
            throw;
        }
    }

    public async Task<List<Project>> GetRecentProjectsAsync(int count = 5)
    {
        try
        {
            var query = _container.GetItemLinqQueryable<Project>()
                .OrderByDescending(p => p.UpdatedAt)
                .Take(count)
                .ToFeedIterator();

            var projects = new List<Project>();
            if (query.HasMoreResults)
            {
                var response = await query.ReadNextAsync();
                projects.AddRange(response);
            }

            return projects;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching recent projects");
            throw;
        }
    }

    public async Task<Project> CreateProjectAsync(Project project)
    {
        var startTime = DateTimeOffset.UtcNow;
        try
        {
            project.CreatedAt = DateTime.UtcNow;
            project.UpdatedAt = DateTime.UtcNow;

            var response = await _container.CreateItemAsync(project, new PartitionKey(project.Status));
            var duration = DateTimeOffset.UtcNow - startTime;

            _logger.LogInformation("Created project {ProjectId} with title {ProjectTitle}. RU consumed: {RequestCharge}",
                project.Id, project.Title, response.RequestCharge);

            // Track Cosmos DB operation with RU consumption
            TrackCosmosOperation("CreateProject", response.RequestCharge, true, duration);

            return response.Resource;
        }
        catch (Exception ex)
        {
            var duration = DateTimeOffset.UtcNow - startTime;
            _logger.LogError(ex, "Error creating project {ProjectTitle}", project.Title);

            // Track failed operation
            TrackCosmosOperation("CreateProject", 0, false, duration);

            throw;
        }
    }

    public async Task<Project> UpdateProjectAsync(Project project)
    {
        try
        {
            // Get the existing project to check if status changed (partition key change)
            var existing = await GetProjectByIdAsync(project.Id);
            if (existing == null)
            {
                throw new InvalidOperationException($"Project with ID {project.Id} not found");
            }

            project.UpdatedAt = DateTime.UtcNow;

            // If status changed, we need to delete old and create new (partition key changed)
            if (existing.Status != project.Status)
            {
                _logger.LogInformation("Project {ProjectId} status changed from {OldStatus} to {NewStatus}, recreating document",
                    project.Id, existing.Status, project.Status);

                await _container.DeleteItemAsync<Project>(existing.Id, new PartitionKey(existing.Status));
                var response = await _container.CreateItemAsync(project, new PartitionKey(project.Status));
                return response.Resource;
            }
            else
            {
                var response = await _container.ReplaceItemAsync(project, project.Id, new PartitionKey(project.Status));
                _logger.LogInformation("Updated project {ProjectId}", project.Id);
                return response.Resource;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating project {ProjectId}", project.Id);
            throw;
        }
    }

    public async Task DeleteProjectAsync(string id)
    {
        try
        {
            // First get the project to know its partition key
            var project = await GetProjectByIdAsync(id);
            if (project == null)
            {
                throw new InvalidOperationException($"Project with ID {id} not found");
            }

            await _container.DeleteItemAsync<Project>(id, new PartitionKey(project.Status));
            _logger.LogInformation("Deleted project {ProjectId}", id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting project {ProjectId}", id);
            throw;
        }
    }

    public async Task<(int total, int published, int draft)> GetProjectStatsAsync()
    {
        try
        {
            // Get all projects
            var query = _container.GetItemLinqQueryable<Project>().ToFeedIterator();

            var allProjects = new List<Project>();
            while (query.HasMoreResults)
            {
                var response = await query.ReadNextAsync();
                allProjects.AddRange(response);
            }

            var total = allProjects.Count;
            var published = allProjects.Count(p => p.Status == "published");
            var draft = allProjects.Count(p => p.Status == "draft");

            return (total, published, draft);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching project stats");
            throw;
        }
    }
}
