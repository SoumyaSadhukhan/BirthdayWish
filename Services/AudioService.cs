namespace Piu.Services;

public class AudioService
{
    private readonly IWebHostEnvironment _env;
    private readonly string[] _supportedExtensions = { ".mp3", ".wav", ".ogg", ".m4a" };

    public AudioService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public AudioManifest GetAudioManifest()
    {
        return new AudioManifest
        {
            BirthdayVoice = GetAudioFiles("audio/birthday-voice"),
            Effects = GetAudioFiles("audio/effects"),
            Music = GetAudioFiles("audio/music")
        };
    }

    private List<string> GetAudioFiles(string relativeFolderPath)
    {
        var result = new List<string>();
        var fullPath = Path.Combine(_env.WebRootPath, relativeFolderPath.Replace('/', Path.DirectorySeparatorChar));

        if (!Directory.Exists(fullPath))
        {
            return result;
        }

        var files = Directory.GetFiles(fullPath);
        foreach (var file in files)
        {
            var ext = Path.GetExtension(file).ToLowerInvariant();
            if (_supportedExtensions.Contains(ext))
            {
                // Return web-accessible path
                var webPath = $"/{relativeFolderPath}/{Path.GetFileName(file)}";
                result.Add(webPath);
            }
        }

        return result.OrderBy(x => x).ToList();
    }
}

public class AudioManifest
{
    public List<string> BirthdayVoice { get; set; } = new();
    public List<string> Effects { get; set; } = new();
    public List<string> Music { get; set; } = new();
}
