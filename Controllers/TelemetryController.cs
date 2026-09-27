using System.Collections.Concurrent;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Piu.Models;
using Piu.Services;

namespace Piu.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TelemetryController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly EmailOptions _options;
    private readonly ILogger<TelemetryController> _logger;
    private static readonly ConcurrentDictionary<string, DateTime> _sentSessions = new();

    public TelemetryController(IEmailService emailService, IOptions<EmailOptions> options, ILogger<TelemetryController> logger)
    {
        _emailService = emailService;
        _options = options.Value;
        _logger = logger;
    }

    [HttpGet("test-email")]
    public async Task<IActionResult> TestEmail()
    {
        var configSummary = new
        {
            Provider = _options.Provider,
            HasApiKey = !string.IsNullOrWhiteSpace(_options.ApiKey),
            ApiKeyPrefix = !string.IsNullOrWhiteSpace(_options.ApiKey) ? (_options.ApiKey.Length > 8 ? _options.ApiKey.Substring(0, 8) + "..." : "short") : "none",
            SenderEmail = _options.SenderEmail,
            SenderPasswordConfigured = !string.IsNullOrWhiteSpace(_options.SenderPassword),
            ToEmail = _options.ToEmail,
            SmtpHost = _options.SmtpHost,
            SmtpPort = _options.SmtpPort
        };

        try
        {
            string subject = "🧪 Diagnostic Test Email - Piu App";
            string body = $@"
                <div style='font-family:sans-serif; padding:20px; background:#0f172a; color:#fff; border-radius:10px;'>
                    <h2 style='color:#38bdf8;'>🎉 Live Render Email Test Successful!</h2>
                    <p>Your web application live email delivery system is working 100% on Render via {_options.Provider}.</p>
                    <p><strong>Recipient:</strong> {_options.ToEmail}</p>
                    <p><strong>Provider:</strong> {_options.Provider}</p>
                </div>";

            await _emailService.SendEmailAsync(subject, body);

            return Ok(new
            {
                success = true,
                message = $"Test email sent successfully to {_options.ToEmail}",
                config = configSummary
            });
        }
        catch (Exception ex)
        {
            return Ok(new
            {
                success = false,
                error = ex.Message,
                innerError = ex.InnerException?.Message,
                config = configSummary
            });
        }
    }

    [HttpPost("track")]
    public IActionResult Track()
    {
        return Ok(new { success = true, note = "Individual event email suppressed. Session summary email will fire on exit." });
    }

    /// <summary>
    /// Receives full session telemetry payload on site exit / completion and sends ONE summary email.
    /// Awaits SendSessionSummaryEmailAsync directly so Render container execution never truncates the task.
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

            // Server-side session deduplication (prevent rapid duplicate sends within 30s)
            string sessionKey = data.SessionId;
            if (_sentSessions.TryGetValue(sessionKey, out DateTime lastSent))
            {
                if ((DateTime.UtcNow - lastSent).TotalSeconds < 30 && !data.FinalStatus.Contains("Drone"))
                {
                    _logger.LogInformation("[Telemetry] Suppressing rapid duplicate exit email for SessionId={SessionId} (Sent {Secs}s ago)", data.SessionId, (int)(DateTime.UtcNow - lastSent).TotalSeconds);
                    return Ok(new { success = true, note = "Deduplicated on server" });
                }
            }
            _sentSessions[sessionKey] = DateTime.UtcNow;

            _logger.LogInformation("[Telemetry] Sending live session summary email for SessionId={SessionId}, Pages={PagesCount}, Events={EventsCount}",
                data.SessionId, data.PagesVisited?.Count ?? 0, data.TimelineEvents?.Count ?? 0);

            // Await email dispatch directly so Render container execution never truncates the HTTP request
            await _emailService.SendSessionSummaryEmailAsync(data);

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
