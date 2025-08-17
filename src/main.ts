import './style.css';

// Types
interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
}

// YouTube Player Types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Configuration
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

// YouTube Player
let youtubePlayer: any = null;
let isYouTubePlayerReady = false;

// Initialize YouTube Player API
(window as any).onYouTubeIframeAPIReady = () => {
  console.log('🎵 YouTube IFrame API Ready');
  youtubePlayer = new window.YT.Player('youtube-player', {
    height: '0',
    width: '0',
    videoId: '', // Will be set when playing
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      enablejsapi: 1,
      modestbranding: 1,
      playsinline: 1,
      rel: 0,
      showinfo: 0
    },
    events: {
      onReady: () => {
        console.log('✅ YouTube Player ready!');
        isYouTubePlayerReady = true;
      },
      onStateChange: (event: any) => {
        console.log('🎵 Player state changed:', event.data);
        if (event.data === window.YT.PlayerState.PLAYING) {
          isPlaying = true;
          playPauseIcon.textContent = '⏸️';
        } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
          isPlaying = false;
          playPauseIcon.textContent = '▶️';
        }
      },
      onError: (error: any) => {
        console.error('❌ YouTube Player error:', error);
        showNotification('❌ Playback error. This video might not be playable.');
      }
    }
  });
};

// DOM Elements
const searchInput = document.getElementById('searchInput') as HTMLInputElement;
const searchBtn = document.getElementById('searchBtn') as HTMLButtonElement;
const loading = document.getElementById('loading') as HTMLDivElement;
const searchResults = document.getElementById('searchResults') as HTMLDivElement;
const currentTrack = document.getElementById('currentTrack') as HTMLDivElement;
const trackThumbnail = document.getElementById('trackThumbnail') as HTMLImageElement;
const trackTitle = document.getElementById('trackTitle') as HTMLSpanElement;
const trackChannel = document.getElementById('trackChannel') as HTMLSpanElement;
const playerSection = document.getElementById('playerSection') as HTMLDivElement;
const playPauseBtn = document.getElementById('playPauseBtn') as HTMLButtonElement;
const playPauseIcon = document.getElementById('playPauseIcon') as HTMLSpanElement;
const installBtn = document.getElementById('installBtn') as HTMLButtonElement;

// Audio Player
const audioPlayer = new Audio();
let isPlaying = false;

// Notification System
function showNotification(message: string) {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 transform translate-x-full transition-transform duration-300';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.remove('translate-x-full'), 100);
  setTimeout(() => notification.classList.add('translate-x-full'), 3000);
  setTimeout(() => notification.remove(), 3500);
}

// YouTube Search
async function searchYouTube(query: string): Promise<YouTubeVideo[]> {
  console.log('🔍 Searching YouTube for:', query);
  
  if (!YOUTUBE_API_KEY) {
    console.error('❌ YouTube API key not configured');
    showNotification('YouTube API key not configured');
    return [];
  }

  console.log('🔑 Using API key:', YOUTUBE_API_KEY.substring(0, 10) + '...');

  try {
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}&maxResults=12`;
    console.log('📡 Making API request...');
    
    const response = await fetch(apiUrl);
    console.log('📊 API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ API Response received:', data);
    console.log('📋 Found videos:', data.items?.length || 0);

    if (!data.items || data.items.length === 0) {
      showNotification('No videos found for your search');
      return [];
    }

    const videos = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url
    }));
    
    console.log('🎵 Processed videos:', videos);
    return videos;
    
  } catch (error) {
    console.error('❌ Search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    showNotification(`Search failed: ${errorMessage}`);
    return [];
  }
}

// Play Audio Function - Using YouTube Player API
async function playAudio(video: YouTubeVideo) {
  console.log('🎵 Starting playback for:', video.title, 'ID:', video.id);
  showNotification(`Loading: ${video.title}`);
  playPauseIcon.textContent = '⏳';

  // Update UI
  trackThumbnail.src = video.thumbnail;
  trackTitle.textContent = video.title;
  trackChannel.textContent = video.channel;
  currentTrack.classList.remove('hidden');
  playerSection.classList.remove('hidden');

  try {
    // Wait for YouTube player to be ready
    if (!isYouTubePlayerReady || !youtubePlayer) {
      console.log('⏳ Waiting for YouTube player to initialize...');
      showNotification('⏳ Initializing player...');
      
      // Wait up to 5 seconds for player to be ready
      let waitTime = 0;
      while (!isYouTubePlayerReady && waitTime < 5000) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitTime += 100;
      }
      
      if (!isYouTubePlayerReady) {
        throw new Error('YouTube player failed to initialize');
      }
    }

    console.log('🎵 Loading video into YouTube player...');
    
    // Load the video into the YouTube player
    youtubePlayer.loadVideoById({
      videoId: video.id,
      startSeconds: 0
    });

    // Wait a moment for video to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('▶️ Starting playback...');
    
    // Play the video (requires user interaction)
    youtubePlayer.playVideo();
    
    isPlaying = true;
    playPauseIcon.textContent = '⏸️';
    showNotification(`🎵 Playing: ${video.title}`);
    console.log('✅ Playback started successfully!');

  } catch (error) {
    console.error('❌ Playback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    showNotification(`❌ Error playing "${video.title}": ${errorMessage}`);
    playPauseIcon.textContent = '▶️';
  }
}

// Player Controls - Updated for YouTube Player API
function togglePlayPause() {
  if (youtubePlayer && isYouTubePlayerReady) {
    try {
      if (isPlaying) {
        console.log('⏸️ Pausing YouTube player');
        youtubePlayer.pauseVideo();
      } else {
        console.log('▶️ Playing YouTube player');
        youtubePlayer.playVideo();
      }
    } catch (error) {
      console.error('❌ Error controlling YouTube player:', error);
      showNotification('❌ Player control error');
    }
  } else {
    showNotification('⚠️ No music loaded. Please search and select a song first.');
  }
}

// Legacy audio player events (kept for compatibility)
audioPlayer.onplay = () => {
  isPlaying = true;
  playPauseIcon.textContent = '⏸️';
};

audioPlayer.onpause = () => {
  isPlaying = false;
  playPauseIcon.textContent = '▶️';
};

audioPlayer.onended = () => {
  isPlaying = false;
  playPauseIcon.textContent = '▶️';
  showNotification('Song ended');
};

// Search Handler
async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) return;

  loading.classList.remove('hidden');
  searchResults.innerHTML = '';

  const videos = await searchYouTube(query);
  loading.classList.add('hidden');

  if (videos.length === 0) {
    searchResults.innerHTML = '<p class="text-center text-gray-500 py-8">No results found</p>';
    return;
  }

  // Display results
  videos.forEach(video => {
    const resultCard = document.createElement('div');
    resultCard.className = 'bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1';
    resultCard.innerHTML = `
      <div class="flex gap-4">
        <img src="${video.thumbnail}" alt="${video.title}" class="w-24 h-18 rounded-lg object-cover">
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-gray-900 mb-1 line-clamp-2">${video.title}</h3>
          <p class="text-gray-600 text-sm">${video.channel}</p>
          <button class="mt-2 bg-green-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-green-700">
            ▶️ Play
          </button>
        </div>
      </div>
    `;
    
    resultCard.addEventListener('click', () => playAudio(video));
    searchResults.appendChild(resultCard);
  });
}

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleSearch());
playPauseBtn.addEventListener('click', togglePlayPause);

// PWA Install
let deferredPrompt: any;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.remove('hidden');
});

installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.classList.add('hidden');
  }
});

// Initialize
console.log('🎵 Music Player Ready');
showNotification('🎵 Welcome! Search for music to get started.');
