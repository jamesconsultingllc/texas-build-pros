using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Text.Json;
using LegacyBuilders.Api.Services;
using LegacyBuilders.Api.Models;
using System.Text.RegularExpressions;

namespace LegacyBuilders.Api.Functions;

public class AdminProjectsFunction(
    ICosmosDbService cosmosDbService,
    ILogger<AdminProjectsFunction> logger,
    ITelemetryService? telemetryService = null)
{
    /// <summary>
    /// GET /api/manage/projects
    /// Returns all projects (any status) for the admin dashboard
    /// </summary>
    [Function("GetAllProjects")]
    public async Task<HttpResponseData> GetAllProjects(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "manage/projects")] HttpRequestData req)
    {
        var startTime = DateTimeOffset.UtcNow;
        logger.LogInformation("Admin: Getting all projects");

        try
        {
            // TODO: Add authentication check here
            // For now, this is open for development purposes

            telemetryService?.TrackEvent("Admin.GetAllProjects");

            var projects = await cosmosDbService.GetProjectsAsync();

            var duration = DateTimeOffset.UtcNow - startTime;
            logger.LogInformation("Admin: Fetched {Count} projects in {Duration}ms",
                projects.Count, duration.TotalMilliseconds);

            telemetryService?.TrackMetric("Admin.Projects.GetAll.Duration", duration.TotalMilliseconds);
            telemetryService?.TrackMetric("Admin.Projects.GetAll.Count", projects.Count);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(projects);

            return response;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Admin: Error fetching all projects");
            telemetryService?.TrackException(ex, new Dictionary<string, string>
            {
                { "Function", "GetAllProjects" }
            });

            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteAsJsonAsync(new { message = "Failed to fetch projects" });
            return errorResponse;
        }
    }

    /// <summary>
    /// GET /api/manage/projects/{id}
    /// Returns a single project by ID (any status) for editing
    /// </summary>
    [Function("GetProjectById")]
    public async Task<HttpResponseData> GetProjectById(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "manage/projects/{id}")] HttpRequestData req,
        string id)
    {
        var startTime = DateTimeOffset.UtcNow;
        logger.LogInformation("Admin: Getting project by ID: {ProjectId}", id);

        try
        {
            // TODO: Add authentication check here

            telemetryService?.TrackEvent("Admin.GetProjectById", new Dictionary<string, string>
            {
                { "ProjectId", id }
            });

            var project = await cosmosDbService.GetProjectByIdAsync(id);

            if (project == null)
            {
                logger.LogWarning("Admin: Project with ID {ProjectId} not found", id);
                var notFoundResponse = req.CreateResponse(HttpStatusCode.NotFound);
                await notFoundResponse.WriteAsJsonAsync(new { message = $"Project with ID '{id}' not found" });
                return notFoundResponse;
            }

            var duration = DateTimeOffset.UtcNow - startTime;
            logger.LogInformation("Admin: Fetched project {ProjectId} in {Duration}ms",
                id, duration.TotalMilliseconds);

            telemetryService?.TrackMetric("Admin.Project.GetById.Duration", duration.TotalMilliseconds);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(project);

            return response;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Admin: Error fetching project by ID {ProjectId}", id);
            telemetryService?.TrackException(ex, new Dictionary<string, string>
            {
                { "Function", "GetProjectById" },
                { "ProjectId", id }
            });

            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteAsJsonAsync(new { message = "Failed to fetch project" });
            return errorResponse;
        }
    }

    /// <summary>
    /// POST /api/manage/projects
    /// Creates a new project
    /// </summary>
    [Function("CreateProject")]
    public async Task<HttpResponseData> CreateProject(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "manage/projects")] HttpRequestData req)
    {
        var startTime = DateTimeOffset.UtcNow;
        logger.LogInformation("Admin: Creating new project");

        try
        {
            // TODO: Add authentication check here

            // Parse request body
            var body = await req.ReadAsStringAsync();
            if (string.IsNullOrEmpty(body))
            {
                var badRequestResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                await badRequestResponse.WriteAsJsonAsync(new { message = "Request body is required" });
                return badRequestResponse;
            }

            var formData = JsonSerializer.Deserialize<ProjectFormData>(body, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (formData == null)
            {
                var badRequestResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                await badRequestResponse.WriteAsJsonAsync(new { message = "Invalid request body" });
                return badRequestResponse;
            }

            // Only validate required fields when publishing, allow incomplete drafts
            var validationErrors = ValidateProjectFormData(formData, formData.Status == "published");
            if (validationErrors.Count > 0)
            {
                var validationResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                await validationResponse.WriteAsJsonAsync(new
                {
                    message = "Validation failed",
                    errors = validationErrors
                });
                return validationResponse;
            }

            // Check for unique slug
            var slug = GenerateSlug(formData.Title);
            var slugExists = await cosmosDbService.SlugExistsAsync(slug);
            if (slugExists)
            {
                var conflictResponse = req.CreateResponse(HttpStatusCode.Conflict);
                await conflictResponse.WriteAsJsonAsync(new
                {
                    message = $"A project with the title '{formData.Title}' already exists. Please use a different title."
                });
                return conflictResponse;
            }

            // Create new project entity
            var project = new Project
            {
                Id = Guid.NewGuid().ToString(),
                Title = formData.Title,
                Slug = slug,
                Location = formData.Location,
                ShortDescription = formData.ShortDescription,
                FullDescription = formData.FullDescription,
                ScopeOfWork = formData.ScopeOfWork,
                Challenges = formData.Challenges,
                Outcomes = formData.Outcomes,
                PurchaseDate = formData.PurchaseDate,
                CompletionDate = formData.CompletionDate,
                Budget = formData.Budget,
                FinalCost = formData.FinalCost,
                SquareFootage = formData.SquareFootage,
                Status = formData.Status,
                BeforeImages = new List<ProjectImage>(),
                AfterImages = new List<ProjectImage>(),
                PrimaryBeforeImage = string.Empty,
                PrimaryAfterImage = string.Empty,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            telemetryService?.TrackEvent("Admin.CreateProject", new Dictionary<string, string>
            {
                { "Title", project.Title },
                { "Status", project.Status }
            });

            var createdProject = await cosmosDbService.CreateProjectAsync(project);

            var duration = DateTimeOffset.UtcNow - startTime;
            logger.LogInformation("Admin: Created project {ProjectId} with title '{Title}' in {Duration}ms",
                createdProject.Id, createdProject.Title, duration.TotalMilliseconds);

            telemetryService?.TrackMetric("Admin.Project.Create.Duration", duration.TotalMilliseconds);

            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(createdProject);

            return response;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Admin: Error creating project");
            telemetryService?.TrackException(ex, new Dictionary<string, string>
            {
                { "Function", "CreateProject" }
            });

            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteAsJsonAsync(new { message = "Failed to create project" });
            return errorResponse;
        }
    }

    /// <summary>
    /// PUT /api/manage/projects/{id}
    /// Updates an existing project
    /// </summary>
    [Function("UpdateProject")]
    public async Task<HttpResponseData> UpdateProject(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "manage/projects/{id}")] HttpRequestData req,
        string id)
    {
        var startTime = DateTimeOffset.UtcNow;
        logger.LogInformation("Admin: Updating project {ProjectId}", id);

        try
        {
            // TODO: Add authentication check here

            // Parse request body
            var body = await req.ReadAsStringAsync();
            if (string.IsNullOrEmpty(body))
            {
                var badRequestResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                await badRequestResponse.WriteAsJsonAsync(new { message = "Request body is required" });
                return badRequestResponse;
            }

            var formData = JsonSerializer.Deserialize<ProjectFormData>(body, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (formData == null)
            {
                var badRequestResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                await badRequestResponse.WriteAsJsonAsync(new { message = "Invalid request body" });
                return badRequestResponse;
            }

            // Only validate required fields when publishing, allow incomplete drafts
            var validationErrors = ValidateProjectFormData(formData, formData.Status == "published");
            if (validationErrors.Count > 0)
            {
                var validationResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                await validationResponse.WriteAsJsonAsync(new
                {
                    message = "Validation failed",
                    errors = validationErrors
                });
                return validationResponse;
            }

            // Get existing project
            var existingProject = await cosmosDbService.GetProjectByIdAsync(id);
            if (existingProject == null)
            {
                var notFoundResponse = req.CreateResponse(HttpStatusCode.NotFound);
                await notFoundResponse.WriteAsJsonAsync(new { message = $"Project with ID '{id}' not found" });
                return notFoundResponse;
            }

            // Check for unique slug if title changed
            var newSlug = GenerateSlug(formData.Title);
            if (newSlug != existingProject.Slug)
            {
                var slugExists = await cosmosDbService.SlugExistsAsync(newSlug, id);
                if (slugExists)
                {
                    var conflictResponse = req.CreateResponse(HttpStatusCode.Conflict);
                    await conflictResponse.WriteAsJsonAsync(new
                    {
                        message = $"A project with the title '{formData.Title}' already exists. Please use a different title."
                    });
                    return conflictResponse;
                }
            }

            // Update project properties
            existingProject.Title = formData.Title;
            existingProject.Slug = newSlug;
            existingProject.Location = formData.Location;
            existingProject.ShortDescription = formData.ShortDescription;
            existingProject.FullDescription = formData.FullDescription;
            existingProject.ScopeOfWork = formData.ScopeOfWork;
            existingProject.Challenges = formData.Challenges;
            existingProject.Outcomes = formData.Outcomes;
            existingProject.PurchaseDate = formData.PurchaseDate;
            existingProject.CompletionDate = formData.CompletionDate;
            existingProject.Budget = formData.Budget;
            existingProject.FinalCost = formData.FinalCost;
            existingProject.SquareFootage = formData.SquareFootage;
            existingProject.Status = formData.Status;
            // Note: Images are not updated here - they're managed separately via image upload endpoint

            telemetryService?.TrackEvent("Admin.UpdateProject", new Dictionary<string, string>
            {
                { "ProjectId", id },
                { "Title", existingProject.Title },
                { "Status", existingProject.Status }
            });

            var updatedProject = await cosmosDbService.UpdateProjectAsync(existingProject);

            var duration = DateTimeOffset.UtcNow - startTime;
            logger.LogInformation("Admin: Updated project {ProjectId} in {Duration}ms",
                id, duration.TotalMilliseconds);

            telemetryService?.TrackMetric("Admin.Project.Update.Duration", duration.TotalMilliseconds);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(updatedProject);

            return response;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Admin: Error updating project {ProjectId}", id);
            telemetryService?.TrackException(ex, new Dictionary<string, string>
            {
                { "Function", "UpdateProject" },
                { "ProjectId", id }
            });

            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteAsJsonAsync(new { message = "Failed to update project" });
            return errorResponse;
        }
    }

    /// <summary>
    /// DELETE /api/manage/projects/{id}
    /// Deletes a project
    /// </summary>
    [Function("DeleteProject")]
    public async Task<HttpResponseData> DeleteProject(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "manage/projects/{id}")] HttpRequestData req,
        string id)
    {
        var startTime = DateTimeOffset.UtcNow;
        logger.LogInformation("Admin: Deleting project {ProjectId}", id);

        try
        {
            // TODO: Add authentication check here

            telemetryService?.TrackEvent("Admin.DeleteProject", new Dictionary<string, string>
            {
                { "ProjectId", id }
            });

            await cosmosDbService.DeleteProjectAsync(id);

            var duration = DateTimeOffset.UtcNow - startTime;
            logger.LogInformation("Admin: Deleted project {ProjectId} in {Duration}ms",
                id, duration.TotalMilliseconds);

            telemetryService?.TrackMetric("Admin.Project.Delete.Duration", duration.TotalMilliseconds);

            // Return 204 No Content for successful deletion
            var response = req.CreateResponse(HttpStatusCode.NoContent);
            return response;
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            logger.LogWarning("Admin: Project {ProjectId} not found for deletion", id);
            var notFoundResponse = req.CreateResponse(HttpStatusCode.NotFound);
            await notFoundResponse.WriteAsJsonAsync(new { message = $"Project with ID '{id}' not found" });
            return notFoundResponse;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Admin: Error deleting project {ProjectId}", id);
            telemetryService?.TrackException(ex, new Dictionary<string, string>
            {
                { "Function", "DeleteProject" },
                { "ProjectId", id }
            });

            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteAsJsonAsync(new { message = "Failed to delete project" });
            return errorResponse;
        }
    }

    // Helper methods

    private static List<string> ValidateProjectFormData(ProjectFormData formData, bool isPublishing)
    {
        var errors = new List<string>();

        // Title is always required (for both draft and publish)
        if (string.IsNullOrWhiteSpace(formData.Title))
            errors.Add("Title is required");

        // Additional validation when publishing
        if (isPublishing)
        {
            if (string.IsNullOrWhiteSpace(formData.Location))
                errors.Add("Location is required when publishing");

            if (string.IsNullOrWhiteSpace(formData.ShortDescription))
                errors.Add("Short description is required when publishing");
        }

        // Always validate that numbers are non-negative
        if (formData.Budget < 0)
            errors.Add("Budget must be a positive number");

        if (formData.FinalCost < 0)
            errors.Add("Final cost must be a positive number");

        if (formData.SquareFootage < 0)
            errors.Add("Square footage must be a positive number");

        // Always validate status
        if (!new[] { "draft", "published" }.Contains(formData.Status.ToLower()))
            errors.Add("Status must be either 'draft' or 'published'");

        return errors;
    }

    private static string GenerateSlug(string title)
    {
        if (string.IsNullOrWhiteSpace(title))
            return $"draft-{Guid.NewGuid().ToString().Substring(0, 8)}"; // Generate a unique slug for drafts without titles

        // Convert to lowercase
        var slug = title.ToLowerInvariant();

        // Remove special characters and replace spaces with hyphens
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, @"-+", "-");

        // Trim hyphens from start and end
        slug = slug.Trim('-');

        return slug;
    }
}
