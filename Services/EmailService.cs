using System.Net;
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

    public EmailService(IOptions<EmailOptions> options, ILogger<EmailService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendSessionSummaryEmailAsync(SessionSummaryData data)
    {
        var device = DeviceDetector.ParseUserAgent(data.UserAgent, data.ScreenResolution);

        string subject = $"📊 [Visitor Summary] {device.DeviceType} - Spent {FormatDuration(data.TotalDurationSeconds)}";

        // Convert Server Time to IST (UTC+5:30) for display
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

        TimeZoneInfo istZone = TimeZoneInfo.CreateCustomTimeZone("IST", TimeSpan.FromHours(5.5), "India Standard Time", "India Standard Time");
        DateTime istTime = TimeZoneInfo.ConvertTimeFromUtc(data.ServerTimestampUtc, istZone);
        string formattedTimeIst = istTime.ToString("dd MMM yyyy, hh:mm:ss tt");

        string htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0f172a;
            color: #e2e8f0;
            margin: 0;
            padding: 20px;
        }}
        .container {{
            max-width: 650px;
            margin: 0 auto;
            background: #1e293b;
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            border: 1px solid #334155;
        }}
        .header {{
            background: linear-gradient(135deg, #ec4899, #8b5cf6);
            color: white;
            padding: 20px 25px;
            border-radius: 12px;
            margin-bottom: 25px;
            text-align: center;
        }}
        .header h2 {{
            margin: 0;
            font-size: 22px;
            letter-spacing: 0.5px;
        }}
        .action-badge {{
            display: inline-block;
            background: #f43f5e;
            color: white;
            padding: 6px 14px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 20px;
        }}
        .table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }}
        .table tr {{
            border-bottom: 1px solid #334155;
        }}
        .table td {{
            padding: 12px 10px;
            font-size: 14px;
            vertical-align: top;
        }}
        .table td.label {{
            font-weight: 600;
            color: #94a3b8;
            width: 32%;
        }}
        .table td.val {{
            color: #f8fafc;
            word-break: break-all;
        }}
        .highlight {{
            color: #38bdf8;
            font-weight: bold;
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
            <h2>🎉 Single Event Alert 🎉</h2>
            <p>Piu Birthday Wish Web Application Telemetry</p>
        </div>

        <div style=""text-align: center;"">
            <span class=""action-badge"">⚡ {WebUtility.HtmlEncode(data.Action)}</span>
        </div>

        <table class=""table"">
            <tr>
                <td class=""label"">💻 Device Type</td>
                <td class=""val highlight"">{WebUtility.HtmlEncode(device.DeviceType)} ({WebUtility.HtmlEncode(device.DeviceName)})</td>
            </tr>
            <tr>
                <td class=""label"">📄 Page Visited</td>
                <td class=""val highlight"">{WebUtility.HtmlEncode(data.PageUrl)} {(string.IsNullOrEmpty(data.PageTitle) ? "" : $"({WebUtility.HtmlEncode(data.PageTitle)})")}</td>
            </tr>
            <tr>
                <td class=""label"">🌐 Visitor IP Address</td>
                <td class=""val highlight"">{WebUtility.HtmlEncode(data.ClientIp)}</td>
            </tr>
            <tr>
                <td class=""label"">🕒 Time (IST)</td>
                <td class=""val"">{formattedTimeIst} IST</td>
            </tr>
            <tr>
                <td class=""label"">📱 Device & OS</td>
                <td class=""val"">{WebUtility.HtmlEncode(device.OperatingSystem)} | {WebUtility.HtmlEncode(device.Browser)}</td>
            </tr>
            <tr>
                <td class=""label"">🖥️ Screen Resolution</td>
                <td class=""val"">{WebUtility.HtmlEncode(data.ScreenResolution)} (Viewport: {WebUtility.HtmlEncode(data.ViewportSize)})</td>
            </tr>
            <tr>
                <td class=""label"">🔑 Session ID</td>
                <td class=""val""><code>{WebUtility.HtmlEncode(data.SessionId)}</code></td>
            </tr>
            {(string.IsNullOrEmpty(data.Details) ? "" : $@"
            <tr>
                <td class=""label"">💡 Extra Details</td>
                <td class=""val"" style=""color:#fde047;"">{WebUtility.HtmlEncode(data.Details)}</td>
            </tr>
            ")}
        </table>

        <div class=""footer"">
            Sent automatically by <strong>Piu Birthday Wish Application</strong> Telemetry Service.<br>
            Recipient: {WebUtility.HtmlEncode(_options.ToEmail)}
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(subject, htmlBody);
    }

    public async Task SendEmailAsync(string subject, string bodyHtml)
    {
        string senderEmail = (_options.SenderEmail ?? "").Trim();
        string senderPassword = (_options.SenderPassword ?? "").Replace(" ", "").Trim();
        string toEmail = (_options.ToEmail ?? "").Trim();

        if (string.IsNullOrWhiteSpace(senderEmail) || string.IsNullOrWhiteSpace(senderPassword))
        {
            _logger.LogWarning("[Telemetry] Email credentials (SenderEmail / SenderPassword) not configured in appsettings.json or Environment Variables. Telemetry email skipped.");
            return;
        }

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

        // Try Port 465 (SSL) first, then Port 587 (STARTTLS)
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
                // Crucial for Linux Docker containers on Render: bypass CA chain revocation failure
                client.ServerCertificateValidationCallback = (s, c, h, e) => true;
                client.Timeout = 12000; // 12s connection timeout for cloud hosting

                SecureSocketOptions socketOption = (port == 465)
                    ? SecureSocketOptions.SslOnConnect
                    : SecureSocketOptions.StartTls;

                _logger.LogInformation("[Telemetry] Connecting to SMTP {Host}:{Port} ({SocketOption}) on Render...", _options.SmtpHost, port, socketOption);

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
                _logger.LogWarning(ex, "[Telemetry] SMTP send failed on Port {Port}. Trying fallback port...", port);
            }
        }

        if (!sentSuccessfully && lastException != null)
        {
            _logger.LogError(lastException, "[Telemetry] Failed to send telemetry email to {ToEmail} on all ports on Render.", toEmail);
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

    private static string GetPageName(string url)
    {
        if (string.IsNullOrEmpty(url)) return "Index";
        try
        {
            var uri = new Uri(url, UriKind.RelativeOrAbsolute);
            string path = uri.IsAbsoluteUri ? uri.AbsolutePath : url;
            if (path == "/" || string.IsNullOrWhiteSpace(path)) return "Index / Countdown";
            return path.TrimStart('/');
        }
        catch
        {
            return url;
        }
    }
}
