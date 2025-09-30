/**
 * Video Module
 * Handles Mux video streaming with signed URLs
 */

class VideoManager {
  constructor(app) {
    this.app = app;
    this.mux = null;
    this.currentPlayer = null;
    this.watchProgress = {};
    this.isInitialized = false;
  }

  /**
   * Initialize Mux
   */
  async initialize() {
    try {
      // Load Mux Player script
      if (!window.MuxPlayer) {
        await this.loadMuxScript();
      }

      this.isInitialized = true;
      console.log('🎥 Mux initialized');
      
    } catch (error) {
      console.error('❌ Mux initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load Mux Player script
   */
  async loadMuxScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@mux/mux-player';
      script.type = 'module';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Get signed URL for video
   */
  async getSignedUrl(videoId, userId) {
    try {
      const response = await fetch('/api/video/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.app.authManager.getUserToken()}`
        },
        body: JSON.stringify({
          videoId: videoId,
          userId: userId
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get signed URL');
      }

      return data.signedUrl;

    } catch (error) {
      console.error('❌ Failed to get signed URL:', error);
      throw error;
    }
  }

  /**
   * Create video player
   */
  async createPlayer(containerId, videoId, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Video system not initialized');
      }

      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container ${containerId} not found`);
      }

      // Get signed URL
      const signedUrl = await this.getSignedUrl(videoId, this.app.user.uid);

      // Create Mux Player element
      const player = document.createElement('mux-player');
      player.setAttribute('stream-type', 'on-demand');
      player.setAttribute('playback-id', videoId);
      player.setAttribute('metadata', JSON.stringify({
        video_id: videoId,
        video_title: options.title || 'Tim Burton Docuseries',
        viewer_user_id: this.app.user.uid
      }));

      // Set player options
      if (options.autoplay) {
        player.setAttribute('autoplay', 'muted');
      }
      if (options.controls) {
        player.setAttribute('controls', '');
      }
      if (options.muted) {
        player.setAttribute('muted', '');
      }

      // Add event listeners
      this.setupPlayerEventListeners(player, videoId);

      // Clear container and add player
      container.innerHTML = '';
      container.appendChild(player);

      this.currentPlayer = player;
      console.log('✅ Video player created');

      return player;

    } catch (error) {
      console.error('❌ Failed to create video player:', error);
      throw error;
    }
  }

  /**
   * Set up player event listeners
   */
  setupPlayerEventListeners(player, videoId) {
    // Play event
    player.addEventListener('play', () => {
      console.log('▶️ Video started playing');
      this.trackPlayEvent(videoId);
    });

    // Pause event
    player.addEventListener('pause', () => {
      console.log('⏸️ Video paused');
      this.trackPauseEvent(videoId);
    });

    // Time update event
    player.addEventListener('timeupdate', () => {
      this.trackProgress(videoId, player.currentTime, player.duration);
    });

    // Ended event
    player.addEventListener('ended', () => {
      console.log('🏁 Video ended');
      this.trackCompleteEvent(videoId);
    });

    // Error event
    player.addEventListener('error', (e) => {
      console.error('❌ Video player error:', e.detail);
      this.handleVideoError(e.detail);
    });
  }

  /**
   * Track video progress
   */
  trackProgress(videoId, currentTime, duration) {
    const progress = (currentTime / duration) * 100;
    this.watchProgress[videoId] = {
      currentTime: currentTime,
      duration: duration,
      progress: progress,
      lastUpdated: Date.now()
    };

    // Save progress to database every 10 seconds
    if (Math.floor(currentTime) % 10 === 0) {
      this.saveWatchProgress(videoId, currentTime, duration);
    }
  }

  /**
   * Save watch progress to database
   */
  async saveWatchProgress(videoId, currentTime, duration) {
    try {
      await fetch('/api/video/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.app.authManager.getUserToken()}`
        },
        body: JSON.stringify({
          videoId: videoId,
          userId: this.app.user.uid,
          currentTime: currentTime,
          duration: duration,
          progress: (currentTime / duration) * 100
        })
      });
    } catch (error) {
      console.error('❌ Failed to save watch progress:', error);
    }
  }

  /**
   * Get watch progress for video
   */
  async getWatchProgress(videoId) {
    try {
      const response = await fetch(`/api/video/progress/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${await this.app.authManager.getUserToken()}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get watch progress');
      }

      return data.progress;

    } catch (error) {
      console.error('❌ Failed to get watch progress:', error);
      return null;
    }
  }

  /**
   * Resume video from last position
   */
  async resumeVideo(videoId) {
    try {
      const progress = await this.getWatchProgress(videoId);
      
      if (progress && progress.currentTime > 0) {
        if (this.currentPlayer) {
          this.currentPlayer.currentTime = progress.currentTime;
          console.log(`⏯️ Resumed video from ${progress.currentTime}s`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to resume video:', error);
    }
  }

  /**
   * Track play event
   */
  trackPlayEvent(videoId) {
    // Implementation for analytics tracking
    console.log('📊 Track play event:', videoId);
  }

  /**
   * Track pause event
   */
  trackPauseEvent(videoId) {
    // Implementation for analytics tracking
    console.log('📊 Track pause event:', videoId);
  }

  /**
   * Track complete event
   */
  trackCompleteEvent(videoId) {
    // Implementation for analytics tracking
    console.log('📊 Track complete event:', videoId);
  }

  /**
   * Handle video error
   */
  handleVideoError(error) {
    console.error('❌ Video error:', error);
    // Show user-friendly error message
    this.app.showError('Video playback error. Please try again.');
  }

  /**
   * Destroy current player
   */
  destroyPlayer() {
    if (this.currentPlayer) {
      this.currentPlayer.remove();
      this.currentPlayer = null;
      console.log('🗑️ Video player destroyed');
    }
  }

  /**
   * Check if user has access to content
   */
  async checkContentAccess(contentType) {
    try {
      const response = await fetch('/api/content/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.app.authManager.getUserToken()}`
        },
        body: JSON.stringify({
          userId: this.app.user.uid,
          contentType: contentType
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Content access check failed');
      }

      return data.hasAccess;

    } catch (error) {
      console.error('❌ Content access check failed:', error);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoManager;
} else {
  window.VideoManager = VideoManager;
}
