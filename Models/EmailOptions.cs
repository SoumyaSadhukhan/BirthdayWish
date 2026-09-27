namespace Piu.Models;

public class EmailOptions
{
    public string SmtpHost { get; set; } = "smtp.gmail.com";
    public int SmtpPort { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string SenderEmail { get; set; } = "";
    public string SenderPassword { get; set; } = "";
    public string SenderName { get; set; } = "Piu Birthday App Tracker";
    public string ToEmail { get; set; } = "sadhukhansoumya7319@gmail.com";
}
