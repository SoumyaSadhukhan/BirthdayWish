namespace Piu.Models;

public class TelemetryData
{
    public string PageUrl { get; set; } = "";
    public string PageTitle { get; set; } = "";
    public string Action { get; set; } = "Page View";
    public string SessionId { get; set; } = "";
    public string ClientIp { get; set; } = "";
    public string UserAgent { get; set; } = "";
    public string ScreenResolution { get; set; } = "";
    public string ViewportSize { get; set; } = "";
    public string Language { get; set; } = "";
    public string Timezone { get; set; } = "";
    public string ClientTime { get; set; } = "";
    public string Referrer { get; set; } = "";
    public string Details { get; set; } = "";
    public DateTime ServerTimestampUtc { get; set; } = DateTime.UtcNow;
}
