namespace LegacyBuilders.Api.Models;

/// <summary>
/// Structured error response for API errors.
/// </summary>
/// <remarks>
/// Error codes are used for client-side localization instead of hardcoded messages.
/// The client can map the Code to a localized message in the user's language.
/// </remarks>
public class ApiError
{
    /// <summary>
    /// Error code for client-side localization.
    /// </summary>
    /// <example>AUTH_REQUIRED</example>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Default English message (fallback if client doesn't have localization).
    /// </summary>
    /// <example>Authentication required</example>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Optional additional details about the error.
    /// </summary>
    /// <example>{ "resourceId": "123" }</example>
    public object? Details { get; set; }
}

/// <summary>
/// Standard error codes for the API.
/// </summary>
/// <remarks>
/// These codes are used consistently across all API endpoints for client-side localization.
/// </remarks>
public static class ErrorCodes
{
    /// <summary>Authentication is required to access this resource.</summary>
    public const string AuthRequired = "AUTH_REQUIRED";

    /// <summary>User is authenticated but lacks required permissions.</summary>
    public const string AuthForbidden = "AUTH_FORBIDDEN";

    /// <summary>The requested resource was not found.</summary>
    public const string ResourceNotFound = "RESOURCE_NOT_FOUND";

    /// <summary>Input validation failed.</summary>
    public const string ValidationFailed = "VALIDATION_FAILED";

    /// <summary>Too many requests - rate limit exceeded.</summary>
    public const string RateLimited = "RATE_LIMITED";

    /// <summary>An internal server error occurred.</summary>
    public const string ServerError = "SERVER_ERROR";

    /// <summary>A resource with the same identifier already exists.</summary>
    public const string Conflict = "CONFLICT";
}
