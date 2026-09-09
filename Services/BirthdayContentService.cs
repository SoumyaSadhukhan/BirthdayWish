using System.Globalization;
using Microsoft.Extensions.Options;
using Piu.Models;

namespace Piu.Services;

public class ImageManifest
{
    public IReadOnlyList<string> Hero { get; set; } = new List<string>();
    public IReadOnlyList<string> Cake { get; set; } = new List<string>();
    public IReadOnlyList<string> Gifts { get; set; } = new List<string>();
    public IReadOnlyList<string> Gallery { get; set; } = new List<string>();
    public IReadOnlyList<string> Memories { get; set; } = new List<string>();
    public IReadOnlyList<string> Letters { get; set; } = new List<string>();
    public IReadOnlyList<string> Flowers { get; set; } = new List<string>();
    public IReadOnlyList<string> Chocolates { get; set; } = new List<string>();
    public IReadOnlyList<string> Final { get; set; } = new List<string>();
}

public class BirthdayContentService
{
    private readonly IOptions<BirthdayConfig> _configOptions;
    private readonly ImageService _imageService;
    private readonly AudioService _audioService;
    private readonly ILogger<BirthdayContentService> _logger;

    public BirthdayContentService(
        IOptions<BirthdayConfig> configOptions,
        ImageService imageService,
        AudioService audioService,
        ILogger<BirthdayContentService> logger)
    {
        _configOptions = configOptions;
        _imageService = imageService;
        _audioService = audioService;
        _logger = logger;
    }

    public BirthdayConfig Config => _configOptions.Value;

    public ImageManifest GetImageManifest()
    {
        return new ImageManifest
        {
            Hero = _imageService.GetImages("hero"),
            Cake = _imageService.GetImages("cake"),
            Gifts = _imageService.GetImages("gifts"),
            Gallery = _imageService.GetImages("gallery"),
            Memories = _imageService.GetImages("memories"),
            Letters = _imageService.GetImages("letters"),
            Flowers = _imageService.GetImages("flowers"),
            Chocolates = _imageService.GetImages("chocolates"),
            Final = _imageService.GetImages("final")
        };
    }

    public AudioManifest GetAudioManifest()
    {
        return _audioService.GetAudioManifest();
    }

    /// <summary>
    /// Parses BirthdayDate safely into standard ISO 8601 string for client JS.
    /// If unparseable, falls back gracefully.
    /// </summary>
    public string GetFormattedBirthdayIso()
    {
        var raw = Config.BirthdayDate;
        if (raw == default)
        {
            return DateTimeOffset.UtcNow.ToString("o");
        }
        return raw.ToString("o");
    }
}
