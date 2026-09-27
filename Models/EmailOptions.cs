namespace Piu.Models;

public class EmailOptions
{
    public string SmtpHost { get; set; } = "smtp.gmail.com";
    public int SmtpPort { get; set; } = 465;
    public bool EnableSsl { get; set; } = true;
    public string SenderEmail { get; set; } = "sadhukhansoumya7319@gmail.com";
    public string SenderPassword { get; set; } = "";
    public string SenderName { get; set; } = "Piu Birthday App Tracker";
    public string ToEmail { get; set; } = "sadhukhansoumya706@gmail.com";

    // HTTPS Email API configuration for Render / Cloud hosting (Bypasses SMTP port blocking)
    public string Provider { get; set; } = "Smtp"; // "Smtp", "Brevo", "Resend", "SendGrid"
    public string ApiKey { get; set; } = "";
}
