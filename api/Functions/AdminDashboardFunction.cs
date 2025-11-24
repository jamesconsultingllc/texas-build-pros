using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using System.Net;
using LegacyBuilders.Api.Services;
using LegacyBuilders.Api.Models;

namespace LegacyBuilders.Api.Functions;

public class AdminDashboardFunction(ICosmosDbService cosmosDbService, ILogger<AdminDashboardFunction> logger)
{
    [Function("AdminDashboard")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "dashboard")] HttpRequestData req)
    {
        logger.LogInformation("Dashboard stats requested");

        try
        {
            // Get project stats
            var (total, published, draft) = await cosmosDbService.GetProjectStatsAsync();

            // Get 5 most recent projects
            var recentProjects = await cosmosDbService.GetRecentProjectsAsync(5);

            var response = new DashboardStatsResponse
            {
                Stats = new StatsData
                {
                    Total = total,
                    Published = published,
                    Draft = draft
                },
                RecentProjects = recentProjects
            };

            var httpResponse = req.CreateResponse(HttpStatusCode.OK);
            await httpResponse.WriteAsJsonAsync(response);

            logger.LogInformation("Dashboard stats returned: {Total} total, {Published} published, {Draft} draft",
                total, published, draft);

            return httpResponse;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error fetching dashboard stats");

            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteAsJsonAsync(new { message = "Failed to fetch dashboard data" });

            return errorResponse;
        }
    }
}
