using System.Text.Json;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Piu.Services;

namespace Piu.Pages;

public class IndexModel : PageModel
{
    private readonly BirthdayContentService _contentService;

    public IndexModel(BirthdayContentService contentService)
    {
        _contentService = contentService;
    }

    public string ClientConfigJson { get; private set; } = "{}";

    public void OnGet()
    {
        var config = _contentService.Config;
        var images = _contentService.GetImageManifest();
        var audio = _contentService.GetAudioManifest();
        var birthdayIso = _contentService.GetFormattedBirthdayIso();

        var clientPayload = new
        {
            config = new
            {
                name = config.Name,
                nickname = config.Nickname,
                birthdayDateIso = birthdayIso,
                theme = config.Theme,
                welcome = config.Welcome,
                countdown = config.Countdown,
                cake = config.Cake,
                birthdayVoice = config.BirthdayVoice,
                gifts = config.Gifts,
                letter = config.Letter,
                finalMessage = config.FinalMessage,
                music = config.Music,
                surprises = config.Surprises
            },
            images = new
            {
                hero = images.Hero,
                cake = images.Cake,
                gifts = images.Gifts,
                gallery = images.Gallery,
                memories = images.Memories,
                letters = images.Letters,
                flowers = images.Flowers,
                chocolates = images.Chocolates,
                final = images.Final
            },
            audio = new
            {
                birthdayVoice = audio.BirthdayVoice,
                effects = audio.Effects,
                music = audio.Music
            }
        };

        ClientConfigJson = JsonSerializer.Serialize(clientPayload, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
    }
}
