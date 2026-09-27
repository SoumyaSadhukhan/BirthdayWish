using System.Net;
using System.Text;
using System.Text.Json;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Options;
using Piu.Models;

namespace Piu.Services;

public class EmailService : IEmailService
{
    private readonly EmailOptions _options;
    private readonly ILogger<EmailService> _logger;
    private readonly HttpClient _httpClient;

    public EmailService(IOptions<EmailOptions> options, ILogger<EmailService> logger)
    {
        _options = options.Value;
        _logger = logger;
        _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
    }

    public async Task SendSessionSummaryEmailAsync(SessionSummaryData data)
    {
        var device = DeviceDetector.ParseUserAgent(data.UserAgent, data.ScreenResolution);

        string subject = $"📊 [Visitor Summary] {device.DeviceType} - Spent {FormatDuration(data.TotalDurationSeconds)}";

        TimeZoneInfo istZone = TimeZoneInfo.CreateCustomTimeZone("IST", TimeSpan.FromHours(5.5), "India Standard Time", "India Standard Time");
        DateTime istTime = TimeZoneInfo.ConvertTimeFromUtc(data.ServerTimestampUtc, istZone);
        string formattedTimeIst = istTime.ToString("dd MMM yyyy, hh:mm:ss tt");

        string pagesListHtml = string.Join(" ➔ ", data.PagesVisited.Select(p => $"<span style='background:#0284c7; color:#fff; padding:4px 10px; border-radius:6px; font-weight:600; font-size:13px; display:inline-block; margin:2px;'>{WebUtility.HtmlEncode(p)}</span>"));
        if (string.IsNullOrEmpty(pagesListHtml)) pagesListHtml = "<span style='color:#94a3b8;'>Home / Index</span>";

        string timelineItemsHtml = "";
        if (data.TimelineEvents != null && data.TimelineEvents.Count > 0)
        {
            var items = data.TimelineEvents.Select(e => $@"
                <li style='margin-bottom: 8px; padding-left: 5px; color: #f8fafc;'>
                    <span style='color: #f43f5e; font-weight: bold;'>•</span> {WebUtility.HtmlEncode(e)}
                </li>");
            timelineItemsHtml = string.Join("", items);
        }
        else
        {
            timelineItemsHtml = "<li style='color:#94a3b8;'>Visited page and exited.</li>";
        }

        string htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0b0f19;
            color: #e2e8f0;
            margin: 0;
            padding: 20px;
        }}
        .container {{
            max-width: 680px;
            margin: 0 auto;
            background: #1e293b;
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.6);
            border: 1px solid #334155;
        }}
        .header {{
            background: linear-gradient(135deg, #06b6d4, #8b5cf6);
            color: white;
            padding: 22px 25px;
            border-radius: 12px;
            margin-bottom: 25px;
            text-align: center;
        }}
        .header h2 {{
            margin: 0;
            font-size: 24px;
            letter-spacing: 0.5px;
        }}
        .header p {{
            margin: 6px 0 0 0;
            font-size: 14px;
            opacity: 0.95;
        }}
        .badge-box {{
            text-align: center;
            margin-bottom: 25px;
        }}
        .badge {{
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            margin: 0 5px;
        }}
        .badge-device {{
            background: #ec4899;
            color: #ffffff;
        }}
        .badge-time {{
            background: #10b981;
            color: #ffffff;
        }}
        .card {{
            background: #0f172a;
            border-radius: 12px;
            padding: 18px 22px;
            margin-bottom: 20px;
            border: 1px solid #334155;
        }}
        .card-title {{
            font-size: 15px;
            font-weight: 700;
            color: #38bdf8;
            margin-top: 0;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }}
        .table {{
            width: 100%;
            border-collapse: collapse;
        }}
        .table tr {{
            border-bottom: 1px solid #1e293b;
        }}
        .table td {{
            padding: 10px 6px;
            font-size: 14px;
            vertical-align: top;
        }}
        .table td.label {{
            font-weight: 600;
            color: #94a3b8;
            width: 34%;
        }}
        .table td.val {{
            color: #f8fafc;
            word-break: break-all;
        }}
        .highlight {{
            color: #f472b6;
            font-weight: bold;
        }}
        .timeline-list {{
            list-style: none;
            padding-left: 0;
            margin: 0;
            font-size: 14px;
            line-height: 1.7;
        }}
        .footer {{
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px dashed #475569;
            text-align: center;
            font-size: 12px;
            color: #64748b;
        }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h2>📱 Full Visitor Session Report 💻</h2>
            <p>Piu Birthday Wish Web App - User Activity Overview</p>
        </div>

        <div class=""badge-box"">
            <span class=""badge badge-device"">{WebUtility.HtmlEncode(device.FormFactorBadge)}</span>
            <span class=""badge badge-time"">⏱️ Time Spent: {FormatDuration(data.TotalDurationSeconds)}</span>
        </div>

        <!-- DEVICE DETAILS CARD -->
        <div class=""card"">
            <div class=""card-title"">📱 Device & System Details</div>
            <table class=""table"">
                <tr>
                    <td class=""label"">💻 Device Category</td>
                    <td class=""val highlight"">{WebUtility.HtmlEncode(device.DeviceType)}</td>
                </tr>
                <tr>
                    <td class=""label"">🏷️ Device Model / OS</td>
                    <td class=""val""><strong>{WebUtility.HtmlEncode(device.DeviceName)}</strong> ({WebUtility.HtmlEncode(device.OperatingSystem)})</td>
                </tr>
                <tr>
                    <td class=""label"">🌐 Web Browser</td>
                    <td class=""val"">{WebUtility.HtmlEncode(device.Browser)}</td>
                </tr>
                <tr>
                    <td class=""label"">🖥️ Screen Resolution</td>
                    <td class=""val"">{WebUtility.HtmlEncode(data.ScreenResolution)} (Viewport: {WebUtility.HtmlEncode(data.ViewportSize)})</td>
                </tr>
            </table>
        </div>

        <!-- SESSION JOURNEY CARD -->
        <div class=""card"">
            <div class=""card-title"">🗺️ User Journey & Pages Visited</div>
            <div style=""font-size: 14px; margin-bottom: 12px; line-height: 2;"">
                {pagesListHtml}
            </div>
            <table class=""table"">
                <tr>
                    <td class=""label"">🕒 Time (IST)</td>
                    <td class=""val"">{formattedTimeIst} IST</td>
                </tr>
                <tr>
                    <td class=""label"">🌐 Visitor IP</td>
                    <td class=""val"" style=""color:#38bdf8;"">{WebUtility.HtmlEncode(data.ClientIp)}</td>
                </tr>
                <tr>
                    <td class=""label"">📍 Client Timezone</td>
                    <td class=""val"">{WebUtility.HtmlEncode(data.Timezone)} (Local: {WebUtility.HtmlEncode(data.ClientTime)})</td>
                </tr>
                <tr>
                    <td class=""label"">🗣️ Language</td>
                    <td class=""val"">{WebUtility.HtmlEncode(data.Language)}</td>
                </tr>
                <tr>
                    <td class=""label"">🔑 Session ID</td>
                    <td class=""val""><code>{WebUtility.HtmlEncode(data.SessionId)}</code></td>
                </tr>
            </table>
        </div>

        <!-- STEP-BY-STEP ACTIVITY TIMELINE CARD -->
        <div class=""card"">
            <div class=""card-title"">📜 Step-by-Step Action Timeline</div>
            <ul class=""timeline-list"">
                {timelineItemsHtml}
            </ul>
        </div>

        <div class=""footer"">
            Sent automatically when visitor completed / exited session.<br>
            Recipient: {WebUtility.HtmlEncode(_options.ToEmail)}
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(subject, htmlBody);
    }

    public async Task SendTelemetryEmailAsync(TelemetryData data)
    {
        var device = DeviceDetector.ParseUserAgent(data.UserAgent, data.ScreenResolution);
        string subject = $"🔔 [Piu App Alert] {data.Action} - {device.DeviceType}";
        await SendEmailAsync(subject, $"Action: {data.Action}, Page: {data.PageUrl}");
    }

    public async Task SendEmailAsync(string subject, string bodyHtml)
    {
        string senderEmail = (_options.SenderEmail ?? "").Trim();
        string senderPassword = (_options.SenderPassword ?? "").Replace(" ", "").Trim();
        string toEmail = (_options.ToEmail ?? "").Trim();
        string apiKey = (_options.ApiKey ?? "").Trim();
        string provider = (_options.Provider ?? "").Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(senderEmail))
        {
            _logger.LogWarning("[Telemetry] SenderEmail not configured. Skipping email dispatch.");
            return;
        }

        // 1. If Brevo / Resend / SendGrid API key is provided, send via HTTPS API (Works 100% on Render over Port 443!)
        if (!string.IsNullOrWhiteSpace(apiKey) || provider == "brevo" || provider == "resend" || provider == "sendgrid")
        {
            bool apiSuccess = await SendViaHttpsApiAsync(provider, apiKey, senderEmail, toEmail, subject, bodyHtml);
            if (apiSuccess) return;
        }

        // 2. Fallback to Direct SMTP (for local dev)
        await SendViaSmtpAsync(senderEmail, senderPassword, toEmail, subject, bodyHtml);
    }

    private async Task<bool> SendViaHttpsApiAsync(string provider, string apiKey, string senderEmail, string toEmail, string subject, string bodyHtml)
    {
        try
        {
            var recipientList = toEmail.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
                                      .Select(e => e.Trim()).Where(e => !string.IsNullOrEmpty(e)).ToList();
            if (recipientList.Count == 0) recipientList.Add(senderEmail);

            if (provider == "brevo" || (!string.IsNullOrEmpty(apiKey) && apiKey.StartsWith("xkeysib-")))
            {
                // Brevo (Sendinblue) HTTPS API
                var requestObj = new
                {
                    sender = new { name = _options.SenderName, email = senderEmail },
                    to = recipientList.Select(e => new { email = e }).ToArray(),
                    subject = subject,
                    htmlContent = bodyHtml
                };

                using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
                req.Headers.Add("api-key", apiKey);
                req.Content = new StringContent(JsonSerializer.Serialize(requestObj), Encoding.UTF8, "application/json");

                var resp = await _httpClient.SendAsync(req);
                if (resp.IsSuccessStatusCode)
                {
                    _logger.LogInformation("[Telemetry] Email successfully sent via Brevo HTTPS API to {ToEmail}", toEmail);
                    return true;
                }
                string errStr = await resp.Content.ReadAsStringAsync();
                _logger.LogWarning("[Telemetry] Brevo HTTPS API returned status {StatusCode}: {Error}", resp.StatusCode, errStr);
            }
            else if (provider == "resend" || (!string.IsNullOrEmpty(apiKey) && apiKey.StartsWith("re_")))
            {
                // Resend HTTPS API
                var requestObj = new
                {
                    from = $"{_options.SenderName} <onboarding@resend.dev>",
                    to = recipientList.ToArray(),
                    subject = subject,
                    html = bodyHtml
                };

                using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
                req.Headers.Add("Authorization", $"Bearer {apiKey}");
                req.Content = new StringContent(JsonSerializer.Serialize(requestObj), Encoding.UTF8, "application/json");

                var resp = await _httpClient.SendAsync(req);
                if (resp.IsSuccessStatusCode)
                {
                    _logger.LogInformation("[Telemetry] Email successfully sent via Resend HTTPS API to {ToEmail}", toEmail);
                    return true;
                }
                string errStr = await resp.Content.ReadAsStringAsync();
                _logger.LogWarning("[Telemetry] Resend HTTPS API returned status {StatusCode}: {Error}", resp.StatusCode, errStr);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[Telemetry] Failed to send email via HTTPS API. Falling back to SMTP...");
        }

        return false;
    }

    private async Task SendViaSmtpAsync(string senderEmail, string senderPassword, string toEmail, string subject, string bodyHtml)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_options.SenderName, senderEmail));

            var recipientAddresses = toEmail.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var addr in recipientAddresses)
            {
                if (!string.IsNullOrWhiteSpace(addr))
                {
                    message.To.Add(new MailboxAddress("", addr.Trim()));
                }
            }

            if (message.To.Count == 0)
            {
                message.To.Add(new MailboxAddress("", senderEmail));
            }

            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = bodyHtml
            };
            message.Body = bodyBuilder.ToMessageBody();

            int primaryPort = _options.SmtpPort > 0 ? _options.SmtpPort : 465;
            int secondaryPort = (primaryPort == 465) ? 587 : 465;
            int[] portsToTry = new[] { primaryPort, secondaryPort };

            bool sentSuccessfully = false;
            Exception? lastException = null;

            foreach (int port in portsToTry)
            {
                try
                {
                    using var client = new SmtpClient();
                    client.ServerCertificateValidationCallback = (s, c, h, e) => true;
                    client.Timeout = 12000;

                    SecureSocketOptions socketOption = (port == 465)
                        ? SecureSocketOptions.SslOnConnect
                        : SecureSocketOptions.StartTls;

                    _logger.LogInformation("[Telemetry] Connecting to SMTP {Host}:{Port} ({SocketOption})...", _options.SmtpHost, port, socketOption);

                    await client.ConnectAsync(_options.SmtpHost, port, socketOption);
                    await client.AuthenticateAsync(senderEmail, senderPassword);
                    await client.SendAsync(message);
                    await client.DisconnectAsync(true);

                    _logger.LogInformation("[Telemetry] Session summary email successfully sent to {ToEmail} via Port {Port}", toEmail, port);
                    sentSuccessfully = true;
                    break;
                }
                catch (Exception ex)
                {
                    lastException = ex;
                    _logger.LogWarning(ex, "[Telemetry] SMTP send failed on Port {Port}.", port);
                }
            }

            if (!sentSuccessfully && lastException != null)
            {
                _logger.LogError(lastException, "[Telemetry] Failed to send telemetry email to {ToEmail} on all SMTP ports.", toEmail);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Telemetry] Unexpected SMTP exception.");
        }
    }

    private static string FormatDuration(int totalSeconds)
    {
        if (totalSeconds <= 0) return "< 1 sec";
        TimeSpan ts = TimeSpan.FromSeconds(totalSeconds);
        if (ts.TotalMinutes < 1) return $"{ts.Seconds} sec";
        if (ts.TotalHours < 1) return $"{ts.Minutes}m {ts.Seconds}s";
        return $"{(int)ts.TotalHours}h {ts.Minutes}m {ts.Seconds}s";
    }
}
