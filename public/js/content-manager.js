/**
 * Tim Burton Docuseries - Content Manager
 * Manages video content catalog and playback IDs
 */

class TimBurtonContentManager {
  constructor(videoPlayer) {
    this.videoPlayer = videoPlayer;
    
    // Content catalog with Mux playback IDs
    this.catalog = {
      episodes: [
        {
          id: 'episode-1',
          title: 'Suburban Hell',
          episodeNumber: 1,
          playbackId: 'NKED3IcnhrOw8vm4Xb36pxvecZTUKN02Bqa6CoAF8d9s',
          duration: 6600, // 1h 50m in seconds
          contentType: 'episode',
          description: 'The misfit kid who drew his way out of suburban hell.'
        },
        {
          id: 'episode-2',
          title: 'Misunderstood Monsters',
          episodeNumber: 2,
          playbackId: 'HXWhSS3qlPGKioqou4qjkOyVJfKYGgc02UK02VYzLdxSw',
          duration: 6600, // 1h 50m in seconds
          contentType: 'episode',
          description: 'Outsiders, monsters, and the beauty of being different.'
        },
        {
          id: 'episode-3',
          title: 'Rebel by Design',
          episodeNumber: 3,
          playbackId: 'NbkUI7kcwjFjmxE3PKFTxoIG014DWZEttFFVgftc5T5k',
          duration: 6600, // 1h 50m in seconds
          contentType: 'episode',
          description: 'A restless creator who refuses to repeat himself.'
        },
        {
          id: 'episode-4',
          title: 'Coming Home',
          episodeNumber: 4,
          playbackId: 'REPLACE_WITH_PLAYBACK_ID_4', // TODO: Add actual playback ID
          duration: 6600, // 1h 50m in seconds
          contentType: 'episode',
          description: 'Returning to his roots to tell the stories closest to his heart.'
        }
      ],
      extras: [
        {
          id: 'bonus-1',
          title: 'Behind the Scenes',
          playbackId: '01HoChpoQSVBwf02N2wB2u9GWdGNUK1WdrKXE01ou5tQjQ',
          duration: null,
          contentType: 'extra',
          description: 'Exclusive behind-the-scenes content from the docuseries.'
        }
      ]
    };
    
    this.apiBaseUrl = 'https://us-central1-tim-burton-docuseries.cloudfunctions.net/api';

    this.initializeThumbnailHandlers();
    
    console.log('✅ TimBurtonContentManager initialized');
  }

  /**
   * Initialize click handlers for video thumbnails
   */
  initializeThumbnailHandlers() {
    // Find all video thumbnail elements with data-video-id attribute
    const thumbnails = document.querySelectorAll('[data-video-id]');
    
    thumbnails.forEach(thumbnail => {
      thumbnail.addEventListener('click', (e) => {
        e.preventDefault();
        const videoId = thumbnail.getAttribute('data-video-id');
        this.playVideo(videoId);
      });

      // Add visual feedback
      thumbnail.style.cursor = 'pointer';
    });

    console.log(`📹 Initialized ${thumbnails.length} video thumbnails`);
  }

  /**
   * Play a video by ID
   */
  playVideo(videoId) {
    const video = this.getVideoById(videoId);

    if (!video) {
      console.error(`Video not found: ${videoId}`);
      alert('Video not found');
      return;
    }

    if (video.playbackId.startsWith('REPLACE_WITH_')) {
      console.error('Playback ID not configured for:', videoId);
      alert('Video not yet configured. Please contact support.');
      return;
    }

    // Open video player with title for Chromecast
    const title = video.episodeNumber 
      ? `Episode ${video.episodeNumber}: ${video.title}` 
      : video.title;
    this.videoPlayer.play(video.id, video.playbackId, video.contentType, title);
  }

  /**
   * Get video by ID
   */
  getVideoById(videoId) {
    // Search in episodes
    let video = this.catalog.episodes.find(ep => ep.id === videoId);
    if (video) return video;

    // Search in extras
    video = this.catalog.extras.find(extra => extra.id === videoId);
    return video;
  }

  /**
   * Get all episodes
   */
  getEpisodes() {
    return this.catalog.episodes;
  }

  /**
   * Get all extras
   */
  getExtras() {
    return this.catalog.extras;
  }

  /**
   * Update playback ID for a video (for easy configuration)
   */
  updatePlaybackId(videoId, playbackId) {
    const video = this.getVideoById(videoId);
    if (video) {
      video.playbackId = playbackId;
      console.log(`✅ Updated ${videoId} with playback ID: ${playbackId}`);
    } else {
      console.error(`Video not found: ${videoId}`);
    }
  }

  /**
   * Batch update all playback IDs (for initial setup)
   */
  updateAllPlaybackIds(playbackIds) {
    /*
     * Example usage:
     * contentManager.updateAllPlaybackIds({
     *   'episode-1': 'abc123...',
     *   'episode-2': 'def456...',
     *   'episode-3': 'ghi789...',
     *   'bonus-1': 'jkl012...'
     * });
     */
    Object.keys(playbackIds).forEach(videoId => {
      this.updatePlaybackId(videoId, playbackIds[videoId]);
    });
  }

  /**
   * Fetch continue watching data from backend
   */
  async fetchContinueWatching(userId) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/content/continue-watching?userId=${userId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch continue watching data: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return data;
      } else {
        throw new Error(data.error || 'Failed to get continue watching data');
      }

    } catch (error) {
      console.error('❌ Error fetching continue watching:', error);
      return null;
    }
  }

  /**
   * Populate hero section with continue watching episode
   */
  populateHeroSection(continueWatching) {
    if (!continueWatching) return;

    const episode = this.getVideoById(continueWatching.videoId);
    if (!episode) return;

    // Update title
    const titleEl = document.querySelector('[data-hero-title]');
    if (titleEl) {
      titleEl.textContent = `Episode ${continueWatching.episodeNumber}: ${continueWatching.title}`;
    }

    // Update description (if different per episode)
    const descEl = document.querySelector('[data-hero-description]');
    if (descEl && episode.description) {
      descEl.textContent = episode.description;
    }

    // Update progress bar
    const progressBarEl = document.querySelector('[data-hero-progress-bar] > div');
    if (progressBarEl) {
      progressBarEl.style.width = `${continueWatching.progress}%`;
    }

    // Update time remaining
    if (episode.duration) {
      const remainingSeconds = episode.duration - (continueWatching.currentTime || 0);
      const hours = Math.floor(remainingSeconds / 3600);
      const mins = Math.floor((remainingSeconds % 3600) / 60);

      const hoursEl = document.querySelector('[data-hero-time-hours]');
      const minsEl = document.querySelector('[data-hero-time-mins]');
      
      if (hoursEl) hoursEl.textContent = hours.toString();
      if (minsEl) minsEl.textContent = mins.toString();
    }

    // Update play button
    const playButtonEl = document.querySelector('[data-hero-play-button]');
    if (playButtonEl) {
      // Set video ID for click handler
      playButtonEl.setAttribute('data-video-id', continueWatching.videoId);

      // Update button text
      const buttonTextEl = playButtonEl.querySelector('[data-hero-button-text]');
      if (buttonTextEl) {
        buttonTextEl.textContent = continueWatching.isNextEpisode ? 'play' : 'Continue Watching';
      }
    }

    console.log(`✅ Hero section updated: ${continueWatching.videoId} (${continueWatching.progress}%)`);
  }

  /**
   * Update all progress bars in episode list
   */
  updateProgressBars(allProgress) {
    if (!allProgress) return;

    allProgress.forEach(item => {
      // Find progress bar by data-video-id
      const progressBarParent = document.querySelector(`[data-progress-bar][data-video-id="${item.videoId}"]`);
      
      if (progressBarParent) {
        // Get the child div (direct child)
        const progressBarChild = progressBarParent.querySelector('div');
        
        if (progressBarChild) {
          progressBarChild.style.width = `${item.progress}%`;
        }
      }
    });

    console.log(`✅ Updated ${allProgress.length} progress bars`);
  }

  /**
   * Hide skeleton loading state
   * Note: Skeleton should be added directly in Webflow (class "tb-loading-skeleton")
   * so it shows immediately on page load for authenticated users.
   * JavaScript only removes it once data loads.
   */
  hideHeroSkeleton() {
    // Find the element with skeleton class
    const heroSection = document.querySelector('.tb-loading-skeleton');
    
    if (heroSection) {
      heroSection.classList.remove('tb-loading-skeleton');
      console.log('✅ Skeleton loader removed');
    }
  }

  /**
   * Initialize continue watching (call on page load)
   * Assumes skeleton is already visible from Webflow (for instant feedback)
   */
  async initializeContinueWatching(userId) {
    try {
      // Fetch data (skeleton already showing from Webflow)
      const data = await this.fetchContinueWatching(userId);

      if (data && data.success) {
        this.populateHeroSection(data.continueWatching);
        this.updateProgressBars(data.allProgress);
      }

      // Hide skeleton once data is loaded
      this.hideHeroSkeleton();

    } catch (error) {
      console.error('❌ Error initializing continue watching:', error);
      // Hide skeleton even on error
      this.hideHeroSkeleton();
    }
  }
}

// Make available globally
window.TimBurtonContentManager = TimBurtonContentManager;

