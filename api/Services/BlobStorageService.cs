using Azure.Storage;
using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using Microsoft.Extensions.Logging;

namespace LegacyBuilders.Api.Services;

public interface IBlobStorageService
{
    /// <summary>
    /// Generates a SAS token URL for uploading a blob
    /// </summary>
    /// <param name="fileName">Original file name</param>
    /// <param name="contentType">MIME type of the file</param>
    /// <returns>Tuple of (sasUrl, blobUrl)</returns>
    Task<(string sasUrl, string blobUrl)> GenerateSasTokenAsync(string fileName, string contentType);

    /// <summary>
    /// Deletes a single blob from storage
    /// </summary>
    /// <param name="blobUrl">Full URL of the blob to delete</param>
    Task DeleteBlobAsync(string blobUrl);

    /// <summary>
    /// Deletes multiple blobs from storage
    /// </summary>
    /// <param name="blobUrls">Collection of full blob URLs to delete</param>
    Task DeleteBlobsAsync(IEnumerable<string> blobUrls);

    /// <summary>
    /// Extracts blob name from full URL
    /// </summary>
    /// <param name="blobUrl">Full blob URL</param>
    /// <returns>Blob name</returns>
    string ExtractBlobName(string blobUrl);
}

public class BlobStorageService : IBlobStorageService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly string _containerName;
    private readonly ILogger<BlobStorageService> _logger;
    private readonly ITelemetryService? _telemetryService;

    public BlobStorageService(
        ILogger<BlobStorageService> logger,
        ITelemetryService? telemetryService = null)
    {
        _logger = logger;
        _telemetryService = telemetryService;

        var storageConnectionString = Environment.GetEnvironmentVariable("StorageAccountConnectionString")
            ?? throw new InvalidOperationException("StorageAccountConnectionString environment variable is not set");

        _containerName = "project-images";

        // Create BlobServiceClient using connection string
        _blobServiceClient = new BlobServiceClient(storageConnectionString);

        _logger.LogInformation("BlobStorageService initialized");
    }

    public async Task<(string sasUrl, string blobUrl)> GenerateSasTokenAsync(string fileName, string contentType)
    {
        try
        {
            // Generate unique blob name: timestamp-guid-originalFileName
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var uniqueId = Guid.NewGuid().ToString("N")[..8]; // First 8 chars of GUID
            var sanitizedFileName = SanitizeFileName(fileName);
            var blobName = $"{timestamp}-{uniqueId}-{sanitizedFileName}";

            _logger.LogInformation("Generating SAS token for blob: {BlobName}", blobName);

            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);

            // Ensure container exists
            await containerClient.CreateIfNotExistsAsync();

            var blobClient = containerClient.GetBlobClient(blobName);

            // Generate SAS token valid for 15 minutes with write-only permission
            var sasBuilder = new BlobSasBuilder
            {
                BlobContainerName = _containerName,
                BlobName = blobName,
                Resource = "b", // b = blob
                StartsOn = DateTimeOffset.UtcNow.AddMinutes(-5), // Allow for clock skew
                ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(15)
            };

            // Set permissions: Write only (no read)
            sasBuilder.SetPermissions(BlobSasPermissions.Write | BlobSasPermissions.Create);

            // Set content type if provided
            if (!string.IsNullOrEmpty(contentType))
            {
                sasBuilder.ContentType = contentType;
            }

            var sasToken = blobClient.GenerateSasUri(sasBuilder);
            var blobUrl = blobClient.Uri.ToString();

            _logger.LogInformation("SAS token generated successfully for: {BlobName}", blobName);
            _telemetryService?.TrackEvent("SasTokenGenerated", new Dictionary<string, string>
            {
                { "BlobName", blobName },
                { "ContentType", contentType ?? "unknown" }
            });

            return (sasToken.ToString(), blobUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate SAS token for file: {FileName}", fileName);
            _telemetryService?.TrackException(ex);
            throw;
        }
    }

    public async Task DeleteBlobAsync(string blobUrl)
    {
        try
        {
            var blobName = ExtractBlobName(blobUrl);

            if (string.IsNullOrEmpty(blobName))
            {
                _logger.LogWarning("Could not extract blob name from URL: {BlobUrl}", blobUrl);
                return;
            }

            _logger.LogInformation("Deleting blob: {BlobName}", blobName);

            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            var blobClient = containerClient.GetBlobClient(blobName);

            var response = await blobClient.DeleteIfExistsAsync();

            if (response.Value)
            {
                _logger.LogInformation("Blob deleted successfully: {BlobName}", blobName);
                _telemetryService?.TrackEvent("BlobDeleted", new Dictionary<string, string>
                {
                    { "BlobName", blobName }
                });
            }
            else
            {
                _logger.LogWarning("Blob not found or already deleted: {BlobName}", blobName);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete blob: {BlobUrl}", blobUrl);
            _telemetryService?.TrackException(ex);
            throw;
        }
    }

    public async Task DeleteBlobsAsync(IEnumerable<string> blobUrls)
    {
        var deleteTasks = blobUrls.Select(url => DeleteBlobAsync(url));
        await Task.WhenAll(deleteTasks);
    }

    public string ExtractBlobName(string blobUrl)
    {
        try
        {
            // Extract blob name from URL
            // https://storageaccount.blob.core.windows.net/container/blobname
            var uri = new Uri(blobUrl);
            var segments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);

            // First segment is container name, rest is blob name
            if (segments.Length >= 2)
            {
                return string.Join("/", segments.Skip(1));
            }

            return string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to extract blob name from URL: {BlobUrl}", blobUrl);
            return string.Empty;
        }
    }

    private static string SanitizeFileName(string fileName)
    {
        // Remove any path information
        fileName = Path.GetFileName(fileName);

        // Replace spaces with hyphens
        fileName = fileName.Replace(" ", "-");

        // Remove any characters that aren't alphanumeric, hyphens, dots, or underscores
        fileName = string.Concat(fileName.Where(c => char.IsLetterOrDigit(c) || c == '-' || c == '.' || c == '_'));

        // Limit length to 100 characters
        if (fileName.Length > 100)
        {
            var extension = Path.GetExtension(fileName);
            var nameWithoutExtension = Path.GetFileNameWithoutExtension(fileName);
            fileName = nameWithoutExtension[..(100 - extension.Length)] + extension;
        }

        return fileName.ToLowerInvariant();
    }
}
