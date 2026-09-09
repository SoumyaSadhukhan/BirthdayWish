# 🌹 Piu — Cinematic Birthday Surprise & Interactive Love Story

A romantic, cinematic interactive love story and birthday celebration website built with **ASP.NET Core Razor Pages**, **C#**, **GSAP**, and modern vanilla **CSS/JavaScript**.

This website is completely **configuration-driven** and **dynamically scanned**:
- **Personal content must NEVER be hard-coded into the UI.** All names, titles, letters, countdowns, and love messages are configured in `appsettings.json`.
- **Images are discovered dynamically from disk.** You do NOT need to hardcode filenames or update code when replacing or adding photos.

---

## 🚀 1. How to Run the Project

### Prerequisites
- [.NET SDK 9.0](https://dotnet.microsoft.com/download) (or higher)

### Run Locally
Open a terminal in the project root:
```bash
cd c:\My_Project\Piu
dotnet run
```
Open your browser and navigate to the local URL (e.g., `http://localhost:5000` or `https://localhost:5001`).

---

## ⚙️ 2. Where to Change Personal Information

All personal content is stored in **`appsettings.json`**. Open this file in any text editor to customize:

```json
{
  "Birthday": {
    "Name": "Piu",
    "Nickname": "My Love",
    "BirthdayDate": "2026-10-15T00:00:00+05:30",
    
    "Hero": {
      "Title": "Happy Birthday, Piu ❤️",
      "Subtitle": "To the most beautiful part of my life"
    },

    "Introduction": {
      "Title": "A little something for you",
      "Text": "I made this little world just for you..."
    },

    "Countdown": {
      "BeforeTitle": "Something beautiful is coming...",
      "BirthdayTitle": "Today is your day ❤️"
    },

    "Gallery": {
      "Title": "Our Memories",
      "Subtitle": "Every picture has a story."
    },

    "ThingsILove": [
      "Your smile that brightens any room",
      "Your laugh, the sweetest melody",
      "Your cute little habits",
      "The way you make ordinary days feel extraordinary",
      "The way you are simply, beautifully you"
    ],

    "Letter": {
      "Title": "A Letter For You",
      "Text": "Dear Piu,\n\nWrite your personal letter here...\n\nUse double newlines for paragraphs."
    },

    "FinalMessage": {
      "Title": "Happy Birthday, My Love",
      "Message": "May every dream of yours come true.",
      "Signature": "Forever yours ❤️"
    },

    "Animation": {
      "EnableParticles": true,
      "EnableParallax": true,
      "EnableSmoothScroll": true,
      "EnableCursorEffects": true,
      "EnableImageTilt": true
    },

    "Music": {
      "Enabled": false,
      "File": "/audio/background.mp3"
    }
  }
}
```

---

## 🎂 3. How to Change Birthday Date & Countdown Behavior

Change `Birthday.BirthdayDate` in `appsettings.json`:
```json
"BirthdayDate": "2026-10-15T00:00:00+05:30"
```
- Supports full **ISO 8601** format with time zone offset (`+05:30`).
- **Before the date:** The website displays the real-time Days, Hours, Minutes, and Seconds countdown.
- **When countdown reaches 00:00:00:** The screen automatically flashes into a celebration burst with floating hearts, confetti, and celebratory typography without requiring a page refresh!
- **After the date:** The website automatically enters celebration mode upon arrival.

---

## 📸 4. Automatic Image Discovery System

The website scans image directories dynamically inside `wwwroot/images/`.

### Supported Extensions:
- `.jpg`
- `.jpeg`
- `.png`
- `.webp`
- `.gif`

### Important Rule:
**The website does NOT care about image filenames.**
You can name your photos anything:
- `IMG_20261015.jpg`
- `our_first_trip.webp`
- `piu_smile.png`
- `holiday_memories.jpeg`

Whenever you add, delete, or replace images inside these folders, the website automatically adapts with **zero code changes**.

### Image Folders:

| Folder | Purpose |
| :--- | :--- |
| `wwwroot/images/hero/` | Main opening hero background image. First photo found will be used. |
| `wwwroot/images/gallery/` | Horizontal scroll memory gallery with fullscreen lightbox view. All images found are displayed. |
| `wwwroot/images/memories/` | Nostalgic Polaroid-style photo stack with tilt and parallax. |
| `wwwroot/images/letters/` | Photos interspersed between paragraphs of your love letter. |
| `wwwroot/images/final/` | Grand finale background photograph. |

---

## 🎵 5. How to Enable Background Music

1. Copy your `.mp3` file into `wwwroot/audio/` (e.g. `wwwroot/audio/our_song.mp3`).
2. In `appsettings.json`, set:
   ```json
   "Music": {
     "Enabled": true,
     "File": "/audio/our_song.mp3"
   }
   ```
3. A floating, glowing music pill with animated equalizer bars will appear in the bottom-right corner. It complies with modern browser autoplay rules (starts on user tap/click).

---

## 📱 6. Mobile & Accessibility Features
- **Mobile Responsive**: Custom layout tuned for 375px, 390px, 414px, 768px, 1024px, and desktop 1440px+.
- **Swipe Lightbox**: Swipe left or right on mobile to browse fullscreen photos.
- **Keyboard Navigation**: ESC to close lightbox, Left/Right arrow keys to switch photos.
- **Reduced Motion**: Full support for `prefers-reduced-motion: reduce`.
