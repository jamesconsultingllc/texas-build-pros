using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.DataContracts;
using Microsoft.Extensions.Logging;

namespace LegacyBuilders.Api.Services;

public interface ITelemetryService
{
    void TrackEvent(string eventName, Dictionary<string, string>? properties = null, Dictionary<string, double>? metrics = null);
    void TrackMetric(string metricName, double value, Dictionary<string, string>? properties = null);
    void TrackDependency(string dependencyName, string commandName, DateTimeOffset startTime, TimeSpan duration, bool success);
    void TrackException(Exception exception, Dictionary<string, string>? properties = null);
}

public class TelemetryService : ITelemetryService
{
    private readonly TelemetryClient _telemetryClient;
    private readonly ILogger<TelemetryService> _logger;

    public TelemetryService(TelemetryClient telemetryClient, ILogger<TelemetryService> logger)
    {
        _telemetryClient = telemetryClient;
        _logger = logger;
    }

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
}
