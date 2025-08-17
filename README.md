# MSP - Music Player Web App

A modern, mobile-responsive music player web application with YouTube integration, progressive web app (PWA) capabilities, and background audio playback support.

## 🚀 Quick Start

1. Clone the repository:

   ```bash
   git clone https://github.com/soul-abhi/MSP.git
   cd MSP
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up your environment:

   ```bash
   cp .env.example .env
   # Edit .env and add your YouTube API key
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## ⚙️ Environment Setup

### YouTube API Configuration

**⚠️ IMPORTANT SECURITY NOTE**: Never commit API keys to your repository!

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **YouTube Data API v3**
4. Create credentials (API Key)
5. Restrict the key to YouTube Data API v3 only
6. Copy your API key to `.env` file:
   ```env
   VITE_YOUTUBE_API_KEY=your-actual-api-key-here
   ```

The app will work with demo data if no API key is provided.

## ✨ Features

- **🎵 YouTube Integration**: Search and play music from YouTube
- **📱 Mobile Responsive**: Works perfectly on all devices
- **🔄 Background Playback**: Music continues when tab is inactive
- **📲 PWA Support**: Install as native app on mobile/desktop
- **🎛️ Full Controls**: Play, pause, seek, volume control
- **🎨 Modern UI**: Clean design with smooth animations
- **🔒 Secure**: Environment-based API key management

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Project Structure

```
src/
├── main.ts      # Main application logic
└── style.css    # Styling and responsive design

public/
├── manifest.json # PWA manifest
├── sw.js        # Service worker
└── icons/       # App icons
```

## 📱 PWA Installation

### On Mobile

1. Open the app in Chrome/Safari
2. Look for "Install App" prompt
3. Follow installation steps
4. App appears on home screen

### On Desktop

1. Open in Chrome/Edge
2. Click install icon in address bar
3. App installs as desktop application

## 🔒 Security Features

- ✅ Environment variables for sensitive data
- ✅ API keys never committed to repository
- ✅ HTTPS required for PWA features
- ✅ Proper CORS handling
- ✅ Input sanitization

## 🔧 Troubleshooting

### 🔍 Common Reasons Songs Don't Play

#### YouTube IFrame Player API not initialized properly
- The player script (`https://www.youtube.com/iframe_api`) must load before you try to create a player
- If you call `new YT.Player()` too early, playback won't work

#### Autoplay restrictions
- Chrome, Safari, and mobile browsers block autoplay with sound unless the user interacts (tap/click)
- If you start playback on load without a user gesture → it fails silently

#### API Key / Quota issues
- If your YouTube Data API key is invalid, expired, or quota exceeded, search results may load but videos won't play
- Sometimes, videos you fetch are not embeddable (e.g., some official songs block embedding)

#### Service Worker / PWA caching bugs
- If your `sw.js` tries to cache YouTube streams, playback may break
- YouTube streams must always be fetched live, never cached

#### Mobile background / Media Session issues
- Without the Media Session API, playback can stop or behave strangely in the background

### ✅ Fixes Step by Step

#### 1. Ensure You Load the YouTube Player Script

In your `index.html` (or dynamically in `main.ts`):
```html
<script src="https://www.youtube.com/iframe_api"></script>
```

Then in your `main.ts`:
```typescript
// Ensure script has loaded before creating player
(window as any).onYouTubeIframeAPIReady = () => {
  const player = new YT.Player("player", {
    height: "0", // hide actual iframe if you want
    width: "0",
    videoId: "dQw4w9WgXcQ", // test video
    playerVars: { autoplay: 0, controls: 0 },
    events: {
      onReady: (event) => {
        console.log("Player ready!");
        // Don't autoplay here! Wait for user click
      },
      onError: (err) => {
        console.error("YouTube error:", err);
      },
    },
  });
};
```

#### 2. Require User Gesture Before Play

Browsers block autoplay. So in your Play button handler:
```typescript
document.getElementById("playBtn")?.addEventListener("click", () => {
  player.playVideo();
});
```

Don't call `playVideo()` on load—only after a click.

#### 3. Handle Non-Embeddable Songs

Sometimes search results include videos that can't be embedded.
Check the API response → only allow videos with:
```json
"status": {
  "embeddable": true
}
```

Filter out others, or playback will fail.

#### 4. Fix Service Worker (if enabled)

In `sw.js`, ignore YouTube URLs:
```javascript
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("youtube.com") || event.request.url.includes("ytimg.com")) {
    return; // don't try to cache these
  }
  // your normal cache logic...
});
```

#### 5. Debug with Logs

In `main.ts`, wrap play call:
```typescript
try {
  await player.playVideo();
} catch (err) {
  console.error("Playback failed:", err);
}
```

Open browser console → check if it's autoplay error, API issue, or embed block.

### 🚀 Quick Test

1. Replace your search API call with a fixed test video ID (`dQw4w9WgXcQ`) → see if it plays
2. If test video works but search results fail → it's your API response / filtering
3. If even test video fails → it's IFrame init / autoplay problem

## 🚀 Deployment

The app can be deployed to any static hosting service:

- **Vercel**: Connect GitHub repo for automatic deployments
- **Netlify**: Drag & drop the `dist/` folder
- **GitHub Pages**: Use the built files from `dist/`

Remember to set environment variables in your hosting platform!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Made with ❤️ for music lovers**
