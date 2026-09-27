using Microsoft.AspNetCore.Mvc;
using Piu.Models;
using Piu.Services;

namespace Piu.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TelemetryController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly ILogger<TelemetryController> _logger;

    public TelemetryController(IEmailService emailService, ILogger<TelemetryController> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    [HttpPost("track")]
    public IActionResult Track()
    {
        return Ok(new { success = true, note = "Individual event email suppressed. Session summary email will fire on exit." });
    }

    /// <summary>
    /// Receives full session telemetry payload on site exit / completion and sends ONE summary email.
    /// Manually parses Request.Body to handle text/plain or application/json from sendBeacon and fetch keepalive.
    /// </summary>
    [HttpPost("track-session")]
    public async Task<IActionResult> TrackSession()
    {
        try
        {
            SessionSummaryData? data = null;

            using (var reader = new StreamReader(Request.Body))
            {
                string bodyText = await reader.ReadToEndAsync();
                if (!string.IsNullOrWhiteSpace(bodyText))
                {
                    var options = new System.Text.Json.JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    data = System.Text.Json.JsonSerializer.Deserialize<SessionSummaryData>(bodyText, options);
                }
            }

            if (data == null || string.IsNullOrWhiteSpace(data.SessionId))
            {
                _logger.LogWarning("[Telemetry] TrackSession received null or empty payload.");
                return Ok(new { success = false, message = "Empty payload received" });
            }

            data.ClientIp = GetClientIp(HttpContext);
            if (string.IsNullOrWhiteSpace(data.UserAgent))
            {
                data.UserAgent = Request.Headers.UserAgent.ToString();
            }
            data.ServerTimestampUtc = DateTime.UtcNow;

            _logger.LogInformation("[Telemetry] Received session summary for SessionId={SessionId}, Pages={PagesCount}, Events={EventsCount}",
                data.SessionId, data.PagesVisited?.Count ?? 0, data.TimelineEvents?.Count ?? 0);

            _ = Task.Run(async () =>
            {
                try
                {
                    await _emailService.SendSessionSummaryEmailAsync(data);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Background error sending session summary email.");
                }
            });

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing session summary request.");
            return Ok(new { success = false, error = ex.Message });
        }
    }

    private static string GetClientIp(HttpContext context)
    {
        string? forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwardedFor))
        {
            string ip = forwardedFor.Split(',')[0].Trim();
            if (!string.IsNullOrWhiteSpace(ip)) return ip;
        }

        string? cfIp = context.Request.Headers["CF-Connecting-IP"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(cfIp)) return cfIp;

        string? realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(realIp)) return realIp;

        return context.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
    }
}
