using System.Text;
using System.Text.Json;
using LegacyBuilders.Api.Models;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Middleware;
using Microsoft.Extensions.Logging;

namespace LegacyBuilders.Api.Middleware;

/// <summary>
/// Middleware that extracts and validates the Azure Static Web Apps client principal.
/// </summary>
/// <remarks>
/// <para>
/// Azure SWA injects the x-ms-client-principal header for authenticated requests.
/// This middleware decodes the Base64-encoded JSON payload and stores the
/// ClientPrincipal in FunctionContext.Items for downstream middleware and functions.
/// </para>
/// <para>
/// Security Note: In production, Azure SWA sanitizes this header - it cannot be spoofed
/// by clients. The SWA reverse proxy strips any client-provided x-ms-client-principal
/// header and only injects a valid one for authenticated users.
/// </para>
/// </remarks>
public class AuthenticationMiddleware : IFunctionsWorkerMiddleware
{
    private const string ClientPrincipalHeader = "x-ms-client-principal";
    private const string ClientPrincipalContextKey = "ClientPrincipal";

    private readonly ILogger<AuthenticationMiddleware> _logger;

    /// <summary>
    /// Initializes a new instance of the AuthenticationMiddleware.
    /// </summary>
    /// <param name="logger">Logger for diagnostic output.</param>
    public AuthenticationMiddleware(ILogger<AuthenticationMiddleware> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Processes the request, extracting the client principal if present.
    /// </summary>
    /// <param name="context">The function execution context.</param>
    /// <param name="next">The next middleware in the pipeline.</param>
    public async Task Invoke(FunctionContext context, FunctionExecutionDelegate next)
    {
        var requestData = await context.GetHttpRequestDataAsync();

        if (requestData != null)
        {
            var clientPrincipal = ParseClientPrincipal(requestData);

            if (clientPrincipal != null)
            {
                context.Items[ClientPrincipalContextKey] = clientPrincipal;

                _logger.LogDebug(
                    "Authenticated user: {UserId} ({UserDetails}) with roles: {Roles}",
                    clientPrincipal.UserId,
                    clientPrincipal.UserDetails,
                    string.Join(", ", clientPrincipal.UserRoles));
            }
        }

        await next(context);
    }

    /// <summary>
    /// Parses the x-ms-client-principal header into a ClientPrincipal object.
    /// </summary>
    /// <param name="requestData">The HTTP request data.</param>
    /// <returns>The parsed ClientPrincipal, or null if not present or invalid.</returns>
    private ClientPrincipal? ParseClientPrincipal(Microsoft.Azure.Functions.Worker.Http.HttpRequestData requestData)
    {
        if (!requestData.Headers.TryGetValues(ClientPrincipalHeader, out var headerValues))
        {
            return null;
        }

        var headerValue = headerValues.FirstOrDefault();
        if (string.IsNullOrEmpty(headerValue))
        {
            return null;
        }

        try
        {
            var decoded = Convert.FromBase64String(headerValue);
            var json = Encoding.UTF8.GetString(decoded);

            var principal = JsonSerializer.Deserialize<ClientPrincipal>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return principal;
        }
        catch (FormatException ex)
        {
            _logger.LogWarning(ex, "Invalid Base64 in x-ms-client-principal header");
            return null;
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Invalid JSON in x-ms-client-principal header");
            return null;
        }
    }
}

/// <summary>
/// Extension methods for accessing the ClientPrincipal from FunctionContext.
/// </summary>
public static class AuthenticationContextExtensions
{
    private const string ClientPrincipalContextKey = "ClientPrincipal";

    /// <summary>
    /// Gets the ClientPrincipal from the function context.
    /// </summary>
    /// <param name="context">The function execution context.</param>
    /// <returns>The ClientPrincipal if authenticated, otherwise null.</returns>
    public static ClientPrincipal? GetClientPrincipal(this FunctionContext context)
    {
        if (context.Items.TryGetValue(ClientPrincipalContextKey, out var principal))
        {
            return principal as ClientPrincipal;
        }

        return null;
    }

    /// <summary>
    /// Checks if the current request is authenticated.
    /// </summary>
    /// <param name="context">The function execution context.</param>
    /// <returns>True if a valid ClientPrincipal exists.</returns>
    public static bool IsAuthenticated(this FunctionContext context)
    {
        var principal = context.GetClientPrincipal();
        return principal?.IsAuthenticated ?? false;
    }

    /// <summary>
    /// Checks if the current user has admin role.
    /// </summary>
    /// <param name="context">The function execution context.</param>
    /// <returns>True if user has admin role.</returns>
    public static bool IsAdmin(this FunctionContext context)
    {
        var principal = context.GetClientPrincipal();
        return principal?.IsAdmin ?? false;
    }
}
