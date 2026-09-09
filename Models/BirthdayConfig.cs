namespace Piu.Models;

public class BirthdayConfig
{
    public const string SectionName = "Birthday";

    public string Name { get; set; } = "Piu";
    public string Nickname { get; set; } = "Piu";
    public DateTimeOffset BirthdayDate { get; set; } = DateTimeOffset.Now;

    public ThemeConfig Theme { get; set; } = new();
    public WelcomeConfig Welcome { get; set; } = new();
    public CountdownConfig Countdown { get; set; } = new();
    public CakeConfig Cake { get; set; } = new();
    public BirthdayVoiceConfig BirthdayVoice { get; set; } = new();
    public GiftsConfig Gifts { get; set; } = new();
    public LetterConfig Letter { get; set; } = new();
    public FinalMessageConfig FinalMessage { get; set; } = new();
    public MusicConfig Music { get; set; } = new();
    public SurpriseConfig Surprises { get; set; } = new();
}

public class ThemeConfig
{
    public string Title { get; set; } = "Happy Birthday";
    public string Subtitle { get; set; } = "Today is completely yours";
}

public class WelcomeConfig
{
    public string Title { get; set; } = "Welcome to your birthday party ❤️";
    public string Message { get; set; } = "Tonight, this little world belongs to you.";
}

public class CountdownConfig
{
    public bool Enabled { get; set; } = true;
    public string Title { get; set; } = "Something special is coming...";
}

public class CakeConfig
{
    public bool Enabled { get; set; } = true;
    public string Title { get; set; } = "Make a wish 🎂";
    public string CutButtonText { get; set; } = "Cut the Cake";
}

public class BirthdayVoiceConfig
{
    public bool Enabled { get; set; } = true;
}

public class GiftsConfig
{
    public bool Enabled { get; set; } = true;
    public string Title { get; set; } = "I have one more surprise for you 🎁";
}

public class LetterConfig
{
    public bool Enabled { get; set; } = true;
    public string Title { get; set; } = "A little letter for you";
    public string Text { get; set; } = "";
}

public class FinalMessageConfig
{
    public bool Enabled { get; set; } = true;
    public string Title { get; set; } = "Happy Birthday ❤️";
    public string Message { get; set; } = "";
}

public class MusicConfig
{
    public bool Enabled { get; set; } = true;
    public double Volume { get; set; } = 0.35;
}

public class SurpriseConfig
{
    public bool Flowers { get; set; } = true;
    public bool Gallery { get; set; } = true;
    public bool Chocolates { get; set; } = true;
    public bool Sweets { get; set; } = true;
    public bool Teddy { get; set; } = true;
    public bool Balloons { get; set; } = true;
}
