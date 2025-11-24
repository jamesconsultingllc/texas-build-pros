namespace LegacyBuilders.Api.Models;

public class ProjectFormData
{
    public string Title { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string FullDescription { get; set; } = string.Empty;
    public string ScopeOfWork { get; set; } = string.Empty;
    public string Challenges { get; set; } = string.Empty;
    public string Outcomes { get; set; } = string.Empty;
    public string PurchaseDate { get; set; } = string.Empty;
    public string CompletionDate { get; set; } = string.Empty;
    public decimal Budget { get; set; }
    public decimal FinalCost { get; set; }
    public int SquareFootage { get; set; }
    public string Status { get; set; } = "draft";
}

public class DashboardStatsResponse
{
    public StatsData Stats { get; set; } = new();
    public List<Project> RecentProjects { get; set; } = new();
}

public class StatsData
{
    public int Total { get; set; }
    public int Published { get; set; }
    public int Draft { get; set; }
}
