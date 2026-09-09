using System.Collections.Concurrent;

namespace Piu.Services;

public class ImageService
{
    private static readonly HashSet<string> SupportedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif"
    };

    private readonly IWebHostEnvironment _env;
    private readonly ILogger<ImageService> _logger;

    public ImageService(IWebHostEnvironment env, ILogger<ImageService> logger)
    {
        _env = env;
        _logger = logger;
    }

    /// <summary>
    /// Dynamically scans wwwroot/images/{category} for supported image files.
    /// Returns relative web paths, e.g. "/images/gallery/photo1.jpg".
    /// If the folder does not exist or is empty, returns an empty read-only list without error.
    /// </summary>
    public IReadOnlyList<string> GetImages(string category)
    {
        if (string.IsNullOrWhiteSpace(category))
        {
            return Array.Empty<string>();
        }

        try
        {
            // Resolve physical folder path
            var webRoot = _env.WebRootPath;
            if (string.IsNullOrEmpty(webRoot))
            {
                webRoot = Path.Combine(AppContext.BaseDirectory, "wwwroot");
            }

            var categoryDir = Path.Combine(webRoot, "images", category.Trim().ToLowerInvariant());

            if (!Directory.Exists(categoryDir))
            {
                _logger.LogInformation("Image directory does not exist yet: {CategoryDir}. Gracefully returning empty list.", categoryDir);
                return Array.Empty<string>();
            }

            var dirInfo = new DirectoryInfo(categoryDir);
            var imageFiles = dirInfo.EnumerateFiles("*", SearchOption.TopDirectoryOnly)
                .Where(f => SupportedExtensions.Contains(f.Extension))
                .OrderBy(f => f.Name, StringComparer.OrdinalIgnoreCase)
                .Select(f => $"/images/{category.Trim().ToLowerInvariant()}/{f.Name}")
                .ToList();

            return imageFiles.AsReadOnly();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scanning images for category: {Category}", category);
            return Array.Empty<string>();
        }
    }

    /// <summary>
    /// Gets the first image available in the given category, or null if none exist.
    /// </summary>
    public string? GetFirstImage(string category)
    {
        var images = GetImages(category);
        return images.Count > 0 ? images[0] : null;
    }
}
