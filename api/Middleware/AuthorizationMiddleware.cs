using System.Net;
using LegacyBuilders.Api.Models;
using LegacyBuilders.Api.Services;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Azure.Functions.Worker.Middleware;
using Microsoft.Extensions.Logging;

namespace LegacyBuilders.Api.Middleware;

/// <summary>
/// Middleware that enforces role-based authorization for protected routes.
/// </summary>
/// <remarks>
/// <para>
/// Routes matching /api/manage/* or /api/dashboard require the "admin" role.
/// Public routes like /api/projects/* are allowed without authentication.
/// </para>
/// <para>
/// Returns structured error responses:
/// - 401 with AUTH_REQUIRED if user is not authenticated
/// - 403 with AUTH_FORBIDDEN if user lacks required role
/// </para>
/// </remarks>
public class AuthorizationMiddleware : IFunctionsWorkerMiddleware
{
    private readonly ILogger<AuthorizationMiddleware> _logger;
    private readonly ITelemetryService? _telemetryService;

    /// <summary>
    /// Route prefixes that require admin role.
    /// </summary>
    private static readonly string[] AdminRoutePrefixes =
    {
        "/api/manage",
        "/api/dashboard"
    };

    /// <summary>
    /// Initializes a new instance of the AuthorizationMiddleware.
    /// </summary>
    /// <param name="logger">Logger for diagnostic output.</param>
    /// <param name="telemetryService">Optional telemetry service for tracking auth failures.</param>
    public AuthorizationMiddleware(
        ILogger<AuthorizationMiddleware> logger,
        ITelemetryService? telemetryService = null)
    {
        _logger = logger;
        _telemetryService = telemetryService;
    }

    /// <summary>
    /// Processes the request, enforcing authorization for protected routes.
    /// </summary>
    /// <param name="context">The function execution context.</param>
    /// <param name="next">The next middleware in the pipeline.</param>
    public async Task Invoke(FunctionContext context, FunctionExecutionDelegate next)
    {
        var requestData = await context.GetHttpRequestDataAsync();

        if (requestData != null && RequiresAdminRole(requestData.Url.AbsolutePath))
        {
            var principal = context.GetClientPrincipal();

            // Check if authenticated
            if (principal == null || !principal.IsAuthenticated)
            {
                _logger.LogWarning(
                    "Authorization failed: Unauthenticated request to {Method} {Route}",
                    requestData.Method,
                    requestData.Url.AbsolutePath);

                _telemetryService?.TrackEvent("AuthorizationFailure", new Dictionary<string, string>
                {
                    { "Reason", "NotAuthenticated" },
                    { "Route", requestData.Url.AbsolutePath },
                    { "Method", requestData.Method }
                });

                await WriteErrorResponse(context, requestData, HttpStatusCode.Unauthorized,
                    ErrorCodes.AuthRequired, "Authentication required");
                return;
            }

            // Check if has admin role
            if (!principal.IsAdmin)
            {
                _logger.LogWarning(
                    "Authorization failed: User {UserId} attempted {Method} {Route} without admin role. Roles: {Roles}",
                    principal.UserId,
                    requestData.Method,
                    requestData.Url.AbsolutePath,
                    string.Join(", ", principal.UserRoles));

                _telemetryService?.TrackEvent("AuthorizationFailure", new Dictionary<string, string>
                {
                    { "Reason", "InsufficientRole" },
                    { "UserId", principal.UserId },
                    { "Route", requestData.Url.AbsolutePath },
                    { "Method", requestData.Method },
                    { "UserRoles", string.Join(",", principal.UserRoles) }
                });

                await WriteErrorResponse(context, requestData, HttpStatusCode.Forbidden,
                    ErrorCodes.AuthForbidden, "Insufficient permissions");
                return;
            }

            _logger.LogDebug(
                "Authorization succeeded: User {UserId} accessing {Method} {Route}",
                principal.UserId,
                requestData.Method,
                requestData.Url.AbsolutePath);
        }

        await next(context);
    }

    /// <summary>
    /// Checks if the route requires admin role.
    /// </summary>
    /// <param name="path">The request path.</param>
    /// <returns>True if the route requires admin role.</returns>
    private static bool RequiresAdminRole(string path)
    {
        return AdminRoutePrefixes.Any(prefix =>
            path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// Writes a structured error response.
    /// </summary>
    private static async Task WriteErrorResponse(
        FunctionContext context,
        HttpRequestData requestData,
        HttpStatusCode statusCode,
        string errorCode,
        string message)
    {
        var response = requestData.CreateResponse(statusCode);
        await response.WriteAsJsonAsync(new ApiError
        {
            Code = errorCode,
            Message = message
        });

        // Set the response in the context to short-circuit the pipeline
        context.GetInvocationResult().Value = response;
    }
}
