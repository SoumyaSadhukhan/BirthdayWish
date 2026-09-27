using Piu.Models;

namespace Piu.Services;

public interface IEmailService
{
    Task SendTelemetryEmailAsync(TelemetryData data);
    Task SendSessionSummaryEmailAsync(SessionSummaryData data);
    Task SendEmailAsync(string subject, string bodyHtml);
}
