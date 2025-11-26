using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.WebUtilities;
using System.Net;
using LegacyBuilders.Api.Services;
using LegacyBuilders.Api.Models;

namespace LegacyBuilders.Api.Functions;

public class PublicProjectsFunction(
    ICosmosDbService cosmosDbService,
    ILogger<PublicProjectsFunction> logger,
    ITelemetryService? telemetryService = null)
{
    /// <summary>
    /// GET /api/projects?status=published
    /// Returns all published projects for the public portfolio page
    /// </summary>
    [Function("GetPublishedProjects")]
    public async Task<HttpResponseData> GetPublishedProjects(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "projects")] HttpRequestData req)
    {
        var startTime = DateTimeOffset.UtcNow;
        logger.LogInformation("Getting published projects");

        try
        {
            // Get status from query string (defaults to "published" for public API)
            var queryParams = QueryHelpers.ParseQuery(req.Url.Query);
            var status = queryParams.TryGetValue("status", out var statusValue)
                ? statusValue.ToString()
                : "published";

            telemetryService?.TrackEvent("GetPublishedProjects", new Dictionary<string, string>
            {
                { "Status", status }
            });

            var projects = await cosmosDbService.GetProjectsAsync(status);

            var duration = DateTimeOffset.UtcNow - startTime;
            logger.LogInformation("Fetched {Count} projects with status {Status} in {Duration}ms",
                projects.Count, status, duration.TotalMilliseconds);

            telemetryService?.TrackMetric("Projects.Get.Duration", duration.TotalMilliseconds);
            telemetryService?.TrackMetric("Projects.Get.Count", projects.Count);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(projects);

            return response;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error fetching published projects");
            telemetryService?.TrackException(ex, new Dictionary<string, string>
            {
                { "Function", "GetPublishedProjects" }
            });

            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteAsJsonAsync(new { message = "Failed to fetch projects" });
            return errorResponse;
        }
    }

    /// <summary>
    /// GET /api/projects/{slug}
    /// Returns a single published project by its slug for the project detail page
    /// </summary>
    [Function("GetProjectBySlug")]
    public async Task<HttpResponseData> GetProjectBySlug(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "projects/{slug}")] HttpRequestData req,
        string slug)
    {
        var startTime = DateTimeOffset.UtcNow;
        logger.LogInformation("Getting project by slug: {Slug}", slug);

        try
        {
            telemetryService?.TrackEvent("GetProjectBySlug", new Dictionary<string, string>
            {
                { "Slug", slug }
            });

            var project = await cosmosDbService.GetProjectBySlugAsync(slug);

            if (project == null)
            {
                logger.LogWarning("Project with slug {Slug} not found", slug);
                var notFoundResponse = req.CreateResponse(HttpStatusCode.NotFound);
                await notFoundResponse.WriteAsJsonAsync(new { message = $"Project with slug '{slug}' not found" });
                return notFoundResponse;
            }

            var duration = DateTimeOffset.UtcNow - startTime;
            logger.LogInformation("Fetched project {ProjectId} by slug {Slug} in {Duration}ms",
                project.Id, slug, duration.TotalMilliseconds);

            telemetryService?.TrackMetric("Project.GetBySlug.Duration", duration.TotalMilliseconds);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(project);

            return response;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error fetching project by slug {Slug}", slug);
            telemetryService?.TrackException(ex, new Dictionary<string, string>
            {
                { "Function", "GetProjectBySlug" },
                { "Slug", slug }
            });

            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteAsJsonAsync(new { message = "Failed to fetch project" });
            return errorResponse;
        }
    }
}
