namespace Piu.Models;

public class SessionSummaryData
{
    public string SessionId { get; set; } = "";
    public string ClientIp { get; set; } = "";
    public string UserAgent { get; set; } = "";
    public string ScreenResolution { get; set; } = "";
    public string ViewportSize { get; set; } = "";
    public string Language { get; set; } = "";
    public string Timezone { get; set; } = "";
    public string ClientTime { get; set; } = "";
    public string Referrer { get; set; } = "";
    
    public DateTime StartTime { get; set; } = DateTime.UtcNow;
    public DateTime EndTime { get; set; } = DateTime.UtcNow;
    public int TotalDurationSeconds { get; set; } = 0;
    
    public List<string> PagesVisited { get; set; } = new List<string>();
    public List<string> TimelineEvents { get; set; } = new List<string>();
    public string FinalStatus { get; set; } = "Visitor Left Site";
    public DateTime ServerTimestampUtc { get; set; } = DateTime.UtcNow;
}
