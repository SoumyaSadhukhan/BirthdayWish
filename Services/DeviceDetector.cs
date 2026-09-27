using System.Text.RegularExpressions;

namespace Piu.Services;

public class DeviceInfoResult
{
    public string DeviceType { get; set; } = "💻 Laptop / Desktop";
    public string DeviceCategory { get; set; } = "Desktop";
    public string DeviceName { get; set; } = "Unknown Device";
    public string OperatingSystem { get; set; } = "Unknown OS";
    public string Browser { get; set; } = "Unknown Browser";
    public string FormFactorBadge { get; set; } = "💻 LAPTOP / DESKTOP";
}

public static class DeviceDetector
{
    public static DeviceInfoResult ParseUserAgent(string userAgent, string screenResolution = "")
    {
        var result = new DeviceInfoResult();
        if (string.IsNullOrWhiteSpace(userAgent))
        {
            return result;
        }

        string ua = userAgent;

        // 1. Detect Operating System & Device Model
        if (ua.Contains("iPhone"))
        {
            result.DeviceCategory = "Mobile";
            result.DeviceType = "📱 Mobile Phone";
            result.FormFactorBadge = "📱 MOBILE PHONE";
            string match = Regex.Match(ua, @"OS (\d+[\_.]\d+)").Value.Replace('_', '.');
            result.OperatingSystem = string.IsNullOrEmpty(match) ? "iOS" : $"Apple iOS ({match.Replace("OS ", "")})";
            result.DeviceName = "Apple iPhone";
        }
        else if (ua.Contains("iPad"))
        {
            result.DeviceCategory = "Tablet";
            result.DeviceType = "📱 Tablet";
            result.FormFactorBadge = "📱 TABLET";
            string match = Regex.Match(ua, @"OS (\d+[\_.]\d+)").Value.Replace('_', '.');
            result.OperatingSystem = string.IsNullOrEmpty(match) ? "iPadOS" : $"Apple iPadOS ({match.Replace("OS ", "")})";
            result.DeviceName = "Apple iPad";
        }
        else if (ua.Contains("Android"))
        {
            bool isTablet = !ua.Contains("Mobile");
            result.DeviceCategory = isTablet ? "Tablet" : "Mobile";
            result.DeviceType = isTablet ? "📱 Tablet" : "📱 Mobile Phone";
            result.FormFactorBadge = isTablet ? "📱 TABLET" : "📱 MOBILE PHONE";

            string verMatch = Regex.Match(ua, @"Android\s+([0-9\.]+)").Groups[1].Value;
            result.OperatingSystem = string.IsNullOrEmpty(verMatch) ? "Android OS" : $"Android {verMatch}";

            // Try to extract Android model name e.g. SM-G998B, Pixel 7, etc.
            string modelMatch = Regex.Match(ua, @";\s*([^;]+?)\s+Build/").Groups[1].Value;
            result.DeviceName = string.IsNullOrEmpty(modelMatch) ? (isTablet ? "Android Tablet" : "Android Smartphone") : modelMatch;
        }
        else if (ua.Contains("Windows NT 10.0"))
        {
            result.DeviceCategory = "Desktop";
            result.DeviceType = "💻 Laptop / Desktop";
            result.FormFactorBadge = "💻 LAPTOP / DESKTOP";
            result.OperatingSystem = "Windows 10 / 11";
            result.DeviceName = "Windows PC / Laptop";
        }
        else if (ua.Contains("Windows NT 6.3"))
        {
            result.DeviceCategory = "Desktop";
            result.DeviceType = "💻 Laptop / Desktop";
            result.FormFactorBadge = "💻 LAPTOP / DESKTOP";
            result.OperatingSystem = "Windows 8.1";
            result.DeviceName = "Windows PC / Laptop";
        }
        else if (ua.Contains("Windows NT 6.1"))
        {
            result.DeviceCategory = "Desktop";
            result.DeviceType = "💻 Laptop / Desktop";
            result.FormFactorBadge = "💻 LAPTOP / DESKTOP";
            result.OperatingSystem = "Windows 7";
            result.DeviceName = "Windows PC";
        }
        else if (ua.Contains("Macintosh") || ua.Contains("Mac OS X"))
        {
            result.DeviceCategory = "Desktop";
            result.DeviceType = "💻 Laptop / Desktop";
            result.FormFactorBadge = "💻 MAC / MACBOOK";
            string verMatch = Regex.Match(ua, @"Mac OS X\s+([0-9_\.]+)").Groups[1].Value.Replace('_', '.');
            result.OperatingSystem = string.IsNullOrEmpty(verMatch) ? "macOS" : $"macOS ({verMatch})";
            result.DeviceName = "Apple Mac / MacBook";
        }
        else if (ua.Contains("CrOS"))
        {
            result.DeviceCategory = "Desktop";
            result.DeviceType = "💻 Laptop / Chromebook";
            result.FormFactorBadge = "💻 CHROMEBOOK";
            result.OperatingSystem = "ChromeOS";
            result.DeviceName = "Chromebook";
        }
        else if (ua.Contains("Linux"))
        {
            result.DeviceCategory = "Desktop";
            result.DeviceType = "💻 Laptop / Desktop";
            result.FormFactorBadge = "💻 LINUX DESKTOP";
            result.OperatingSystem = "Linux OS";
            result.DeviceName = "Linux Computer";
        }

        // 2. Detect Browser
        if (ua.Contains("Edg/"))
        {
            string ver = Regex.Match(ua, @"Edg/([0-9\.]+)").Groups[1].Value;
            result.Browser = $"Microsoft Edge {GetMajorVersion(ver)}";
        }
        else if (ua.Contains("OPR/") || ua.Contains("Opera"))
        {
            string ver = Regex.Match(ua, @"(?:OPR|Opera)/([0-9\.]+)").Groups[1].Value;
            result.Browser = $"Opera {GetMajorVersion(ver)}";
        }
        else if (ua.Contains("Chrome/"))
        {
            string ver = Regex.Match(ua, @"Chrome/([0-9\.]+)").Groups[1].Value;
            result.Browser = $"Google Chrome {GetMajorVersion(ver)}";
        }
        else if (ua.Contains("Safari/") && !ua.Contains("Chrome"))
        {
            string ver = Regex.Match(ua, @"Version/([0-9\.]+)").Groups[1].Value;
            result.Browser = $"Apple Safari {GetMajorVersion(ver)}";
        }
        else if (ua.Contains("Firefox/"))
        {
            string ver = Regex.Match(ua, @"Firefox/([0-9\.]+)").Groups[1].Value;
            result.Browser = $"Mozilla Firefox {GetMajorVersion(ver)}";
        }

        return result;
    }

    private static string GetMajorVersion(string version)
    {
        if (string.IsNullOrEmpty(version)) return "";
        int dotIdx = version.IndexOf('.');
        return dotIdx > 0 ? version.Substring(0, dotIdx) : version;
    }
}
