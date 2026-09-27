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

    /// <summary>
    /// Individual event logging endpoint. Per user preference, individual event emails are DISABLED.
    /// Only one full summary email is dispatched when visitor leaves the website via /track-session.
    /// </summary>
    [HttpPost("track")]
    public IActionResult Track([FromBody] TelemetryData data)
    {
        // Single event email intentionally disabled - summary email is sent on site exit
        return Ok(new { success = true, note = "Individual event email suppressed. Session summary email will fire on exit." });
    }

    /// <summary>
    /// Dispatches EXACTLY ONE email per visitor session containing all pages visited, actions, duration, and device details when user exits.
    /// </summary>
    [HttpPost("track-session")]
    public IActionResult TrackSession([FromBody] SessionSummaryData data)
    {
        try
        {
            data.ClientIp = GetClientIp(HttpContext);
            if (string.IsNullOrWhiteSpace(data.UserAgent))
            {
                data.UserAgent = Request.Headers.UserAgent.ToString();
            }
            data.ServerTimestampUtc = DateTime.UtcNow;

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
