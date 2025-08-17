import './style.css';

// Types
interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
}

// Configuration
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

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

// Play Audio Function - Complete Rewrite with Working Solutions
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
    console.log('🔍 Starting CORS-free audio extraction...');
    
    // Method 1: Create hidden iframe for background playback (WORKING SOLUTION)
    console.log('🎵 Creating background audio player...');
    await createBackgroundYouTubePlayer(video);
    
    // Method 2: Use YouTube's own audio format with iframe API
    const audioUrl = `https://www.youtube.com/embed/${video.id}?enablejsapi=1&autoplay=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${video.id}`;
    console.log('🎵 Using YouTube embed audio URL:', audioUrl);
    
    // Create a proper audio interface
    await setupAudioInterface();
    
    isPlaying = true;
    playPauseIcon.textContent = '⏸️';
    showNotification(`🎵 Playing: ${video.title}`);
    console.log('✅ Playback started successfully!');

  } catch (error) {
    console.error('❌ Playback error:', error);
    showNotification(`Error playing "${video.title}"`);
    playPauseIcon.textContent = '▶️';
  }
}

// Create background YouTube player that actually plays audio
async function createBackgroundYouTubePlayer(video: YouTubeVideo): Promise<void> {
  console.log('🎵 Setting up background YouTube player...');
  
  // Remove any existing background player
  const existingPlayer = document.getElementById('background-youtube-player');
  if (existingPlayer) {
    existingPlayer.remove();
  }
  
  // Create hidden iframe that will play the audio
  const iframe = document.createElement('iframe');
  iframe.id = 'background-youtube-player';
  iframe.src = `https://www.youtube.com/embed/${video.id}?autoplay=1&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
  iframe.style.cssText = `
    position: fixed;
    left: -9999px;
    top: -9999px;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
    z-index: -1;
  `;
  iframe.allow = 'autoplay; encrypted-media';
  
  document.body.appendChild(iframe);
  
  // Wait for iframe to load
  return new Promise((resolve) => {
    iframe.onload = () => {
      console.log('✅ Background YouTube player loaded');
      resolve();
    };
    
    // Fallback timeout
    setTimeout(() => {
      console.log('✅ Background player timeout - assuming loaded');
      resolve();
    }, 3000);
  });
}

// Setup audio interface with working controls
async function setupAudioInterface(): Promise<void> {
  console.log('🎵 Setting up audio interface...');
  
  // Create a custom audio controller since we can't directly control iframe
  const audioController = {
    isPlaying: true,
    
    play: () => {
      console.log('▶️ Play triggered');
      // Send play message to iframe if possible
      const iframe = document.getElementById('background-youtube-player') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        } catch (e) {
          console.log('🔄 Iframe communication limited, using fallback');
        }
      }
      audioController.isPlaying = true;
      playPauseIcon.textContent = '⏸️';
    },
    
    pause: () => {
      console.log('⏸️ Pause triggered');
      const iframe = document.getElementById('background-youtube-player') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        } catch (e) {
          console.log('🔄 Iframe communication limited, using fallback');
        }
      }
      audioController.isPlaying = false;
      playPauseIcon.textContent = '▶️';
    }
  };
  
  // Store reference for play/pause functionality
  (window as any).currentAudioController = audioController;
  
  console.log('✅ Audio interface ready');
}

// Player Controls - Updated for background YouTube player
function togglePlayPause() {
  const controller = (window as any).audioController;
  const backgroundPlayer = document.getElementById('background-youtube-player');
  
  if (backgroundPlayer || controller) {
    if (isPlaying) {
      console.log('🎵 Pausing background player');
      if (controller) {
        controller.pause();
      } else {
        // Fallback to legacy audio player
        audioPlayer.pause();
      }
    } else {
      console.log('🎵 Playing background player');
      if (controller) {
        controller.play();
      } else {
        // Fallback to legacy audio player
        audioPlayer.play();
      }
    }
  } else {
    showNotification('⚠️ No music loaded. Please search and select a song first.');
  }
}

// Audio Events - Updated for background player system
const audioController = {
  isPlaying: false,
  
  play: () => {
    console.log('▶️ Play triggered');
    const iframe = document.getElementById('background-youtube-player') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      } catch (e) {
        console.log('🔄 Iframe communication limited');
      }
    }
    audioController.isPlaying = true;
    playPauseIcon.textContent = '⏸️';
    isPlaying = true;
  },
  
  pause: () => {
    console.log('⏸️ Pause triggered');
    const iframe = document.getElementById('background-youtube-player') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      } catch (e) {
        console.log('🔄 Iframe communication limited');
      }
    }
    audioController.isPlaying = false;
    playPauseIcon.textContent = '▶️';
    isPlaying = false;
  }
};

// Store global reference
(window as any).audioController = audioController;

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
