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
        
        string imagesPath = Path.Combine(_env.WebRootPath, "Images");
        if (!Directory.Exists(imagesPath))
        {
            imagesPath = Path.Combine(_env.WebRootPath, "images");
        }
        
        if (Directory.Exists(imagesPath))
        {
            Images = Directory.GetFiles(imagesPath)
                              .Select(Path.GetFileName)
                              .Where(f => f != null && (f.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) || 
                                           f.EndsWith(".png", StringComparison.OrdinalIgnoreCase)))
                              .Select(f => f!)
                              .ToList();
        }
    }
}
