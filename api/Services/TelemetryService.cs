using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.DataContracts;
using Microsoft.Extensions.Logging;

namespace LegacyBuilders.Api.Services;

/// <summary>
/// Interface for Application Insights telemetry operations.
/// </summary>
public interface ITelemetryService
{
    /// <summary>
    /// Tracks a custom event with optional properties and metrics.
    /// </summary>
    /// <param name="eventName">Name of the event to track.</param>
    /// <param name="properties">Optional dictionary of string properties.</param>
    /// <param name="metrics">Optional dictionary of numeric metrics.</param>
    void TrackEvent(string eventName, Dictionary<string, string>? properties = null, Dictionary<string, double>? metrics = null);

    /// <summary>
    /// Tracks a custom metric value.
    /// </summary>
    /// <param name="metricName">Name of the metric.</param>
    /// <param name="value">Value of the metric.</param>
    /// <param name="properties">Optional dictionary of string properties.</param>
    void TrackMetric(string metricName, double value, Dictionary<string, string>? properties = null);

    /// <summary>
    /// Tracks an external dependency call (e.g., Cosmos DB, external API).
    /// </summary>
    /// <param name="dependencyName">Name of the dependency.</param>
    /// <param name="commandName">Command or operation name.</param>
    /// <param name="startTime">Start time of the operation.</param>
    /// <param name="duration">Duration of the operation.</param>
    /// <param name="success">Whether the operation succeeded.</param>
    void TrackDependency(string dependencyName, string commandName, DateTimeOffset startTime, TimeSpan duration, bool success);

    /// <summary>
    /// Tracks an exception with optional properties.
    /// </summary>
    /// <param name="exception">The exception to track.</param>
    /// <param name="properties">Optional dictionary of string properties.</param>
    void TrackException(Exception exception, Dictionary<string, string>? properties = null);

    /// <summary>
    /// Tracks an authorization failure for security auditing.
    /// </summary>
    /// <param name="userId">The user ID (or "anonymous" if not authenticated).</param>
    /// <param name="route">The route that was accessed.</param>
    /// <param name="method">The HTTP method used.</param>
    /// <param name="reason">The reason for the failure (e.g., "NotAuthenticated", "InsufficientRole").</param>
    /// <param name="additionalProperties">Optional additional properties.</param>
    void TrackAuthorizationFailure(string userId, string route, string method, string reason, Dictionary<string, string>? additionalProperties = null);
}

/// <summary>
/// Application Insights telemetry service implementation.
/// </summary>
public class TelemetryService : ITelemetryService
{
    private readonly TelemetryClient _telemetryClient;
    private readonly ILogger<TelemetryService> _logger;

    /// <summary>
    /// Initializes a new instance of the TelemetryService.
    /// </summary>
    /// <param name="telemetryClient">Application Insights telemetry client.</param>
    /// <param name="logger">Logger for diagnostic output.</param>
    public TelemetryService(TelemetryClient telemetryClient, ILogger<TelemetryService> logger)
    {
        _telemetryClient = telemetryClient;
        _logger = logger;
    }

    /// <inheritdoc />
    public void TrackEvent(string eventName, Dictionary<string, string>? properties = null, Dictionary<string, double>? metrics = null)
    {
        try
        {
            _telemetryClient.TrackEvent(eventName, properties, metrics);
            _logger.LogInformation("Tracked event: {EventName}", eventName);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to track event: {EventName}", eventName);
        }
    }

    /// <inheritdoc />
    public void TrackMetric(string metricName, double value, Dictionary<string, string>? properties = null)
    {
        try
        {
            var metric = new MetricTelemetry(metricName, value);
            if (properties != null)
            {
                foreach (var prop in properties)
                {
                    metric.Properties[prop.Key] = prop.Value;
                }
            }
            _telemetryClient.TrackMetric(metric);
            _logger.LogInformation("Tracked metric: {MetricName} = {Value}", metricName, value);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to track metric: {MetricName}", metricName);
        }
    }

    /// <inheritdoc />
    public void TrackDependency(string dependencyName, string commandName, DateTimeOffset startTime, TimeSpan duration, bool success)
    {
        try
        {
            var dependency = new DependencyTelemetry
            {
                Name = dependencyName,
                Data = commandName,
                Timestamp = startTime,
                Duration = duration,
                Success = success
            };
            _telemetryClient.TrackDependency(dependency);
            _logger.LogInformation("Tracked dependency: {DependencyName}, Duration: {Duration}ms, Success: {Success}",
                dependencyName, duration.TotalMilliseconds, success);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to track dependency: {DependencyName}", dependencyName);
        }
    }

    /// <inheritdoc />
    public void TrackException(Exception exception, Dictionary<string, string>? properties = null)
    {
        try
        {
            var exceptionTelemetry = new ExceptionTelemetry(exception);
            if (properties != null)
            {
                foreach (var prop in properties)
                {
                    exceptionTelemetry.Properties[prop.Key] = prop.Value;
                }
            }
            _telemetryClient.TrackException(exceptionTelemetry);
            _logger.LogError(exception, "Tracked exception: {ExceptionType}", exception.GetType().Name);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to track exception");
        }
    }

    /// <inheritdoc />
    public void TrackAuthorizationFailure(string userId, string route, string method, string reason, Dictionary<string, string>? additionalProperties = null)
    {
        var properties = new Dictionary<string, string>
        {
            { "UserId", userId },
            { "Route", route },
            { "Method", method },
            { "Reason", reason },
            { "Timestamp", DateTimeOffset.UtcNow.ToString("O") }
        };

        if (additionalProperties != null)
        {
            foreach (var prop in additionalProperties)
            {
                properties[prop.Key] = prop.Value;
            }
        }

        TrackEvent("AuthorizationFailure", properties);

        _logger.LogWarning(
            "Authorization failure: User {UserId} attempted {Method} {Route} - Reason: {Reason}",
            userId, method, route, reason);
    }
}
