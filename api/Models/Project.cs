using Newtonsoft.Json;

namespace LegacyBuilders.Api.Models;

public class Project
{
    [JsonProperty("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonProperty("title")]
    public string Title { get; set; } = string.Empty;

    [JsonProperty("slug")]
    public string Slug { get; set; } = string.Empty;

    [JsonProperty("location")]
    public string Location { get; set; } = string.Empty;

    [JsonProperty("shortDescription")]
    public string ShortDescription { get; set; } = string.Empty;

    [JsonProperty("fullDescription")]
    public string FullDescription { get; set; } = string.Empty;

    [JsonProperty("scopeOfWork")]
    public string ScopeOfWork { get; set; } = string.Empty;

    [JsonProperty("challenges")]
    public string Challenges { get; set; } = string.Empty;

    [JsonProperty("outcomes")]
    public string Outcomes { get; set; } = string.Empty;

    [JsonProperty("purchaseDate")]
    public string PurchaseDate { get; set; } = string.Empty;

    [JsonProperty("completionDate")]
    public string CompletionDate { get; set; } = string.Empty;

    [JsonProperty("budget")]
    public decimal Budget { get; set; }

    [JsonProperty("finalCost")]
    public decimal FinalCost { get; set; }

    [JsonProperty("squareFootage")]
    public int SquareFootage { get; set; }

    [JsonProperty("status")]
    public string Status { get; set; } = "draft"; // "draft" | "published" | "archived"

    [JsonProperty("beforeImages")]
    public List<ProjectImage> BeforeImages { get; set; } = new();

    [JsonProperty("afterImages")]
    public List<ProjectImage> AfterImages { get; set; } = new();

    [JsonProperty("primaryBeforeImage")]
    public string PrimaryBeforeImage { get; set; } = string.Empty;

    [JsonProperty("primaryAfterImage")]
    public string PrimaryAfterImage { get; set; } = string.Empty;

    [JsonProperty("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonProperty("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class ProjectImage
{
    [JsonProperty("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonProperty("url")]
    public string Url { get; set; } = string.Empty;

    [JsonProperty("thumbnail")]
    public string Thumbnail { get; set; } = string.Empty;

    [JsonProperty("alt")]
    public string Alt { get; set; } = string.Empty;

    [JsonProperty("order")]
    public int Order { get; set; }
}
