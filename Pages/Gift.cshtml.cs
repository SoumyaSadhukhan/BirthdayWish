using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Piu.Pages;

public class GiftModel : PageModel
{
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;
    
    public GiftModel(IConfiguration config, IWebHostEnvironment env)
    {
        _config = config;
        _env = env;
    }

    public string LetterText { get; set; } = "";
    public List<string> Images { get; set; } = new List<string>();

    public void OnGet()
    {
        LetterText = _config["BirthdayConfig:LetterText"]?.Replace("\n", "<br>") ?? "Happy Birthday!";
        
        string cardPath = Path.Combine(_env.WebRootPath, "Images", "card");
        if (!Directory.Exists(cardPath))
        {
            cardPath = Path.Combine(_env.WebRootPath, "images", "card");
        }
        if (!Directory.Exists(cardPath))
        {
            cardPath = Path.Combine(_env.WebRootPath, "Images");
        }
        
        if (Directory.Exists(cardPath))
        {
            var validExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
            Images = Directory.GetFiles(cardPath)
                              .Select(Path.GetFileName)
                              .Where(f => !string.IsNullOrEmpty(f) && validExtensions.Contains(Path.GetExtension(f)))
                              .Select(f => f!)
                              .OrderBy(f => System.Text.RegularExpressions.Regex.Replace(f, @"\d+", m => m.Value.PadLeft(10, '0')))
                              .ToList();
        }
    }
}
