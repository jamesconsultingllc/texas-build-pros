using LegacyBuilders.Api.Services;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Text.Json;

namespace LegacyBuilders.Api.Functions;

public class ImageFunction
{
    private readonly ILogger<ImageFunction> _logger;
    private readonly IBlobStorageService _blobStorageService;
    private readonly ITelemetryService? _telemetryService;

    public ImageFunction(
        ILogger<ImageFunction> logger,
        IBlobStorageService blobStorageService,
        ITelemetryService? telemetryService = null)
    {
        _logger = logger;
        _blobStorageService = blobStorageService;
        _telemetryService = telemetryService;
    }

    [Function("GenerateSasToken")]
    public async Task<HttpResponseData> GenerateSasToken(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "manage/images/sas-token")] HttpRequestData req)
    {
        _logger.LogInformation("Processing SAS token generation request");

        try
        {
            // Parse request body
            var requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            var request = JsonSerializer.Deserialize<SasTokenRequest>(requestBody, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (request == null || string.IsNullOrWhiteSpace(request.FileName))
            {
                var errorResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                await errorResponse.WriteAsJsonAsync(new { error = "fileName is required" });
                return errorResponse;
            }

            // Validate content type
            if (string.IsNullOrWhiteSpace(request.ContentType) || !request.ContentType.StartsWith("image/"))
            {
                var errorResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                await errorResponse.WriteAsJsonAsync(new { error = "contentType must be an image type" });
                return errorResponse;
            }

            // Generate SAS token
            var (sasUrl, blobUrl) = await _blobStorageService.GenerateSasTokenAsync(
                request.FileName,
                request.ContentType
            );

            _logger.LogInformation("SAS token generated successfully for file: {FileName}", request.FileName);
            _telemetryService?.TrackEvent("SasTokenRequested", new Dictionary<string, string>
            {
                { "FileName", request.FileName },
                { "ContentType", request.ContentType }
            });

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new SasTokenResponse
            {
                SasUrl = sasUrl,
                BlobUrl = blobUrl
            });

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate SAS token");
            _telemetryService?.TrackException(ex);

            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteAsJsonAsync(new { error = "Failed to generate SAS token" });
            return errorResponse;
        }
    }

    private record SasTokenRequest
    {
        public string FileName { get; init; } = string.Empty;
        public string ContentType { get; init; } = string.Empty;
    }

    private record SasTokenResponse
    {
        public string SasUrl { get; init; } = string.Empty;
        public string BlobUrl { get; init; } = string.Empty;
    }
}
