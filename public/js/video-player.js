/**
 * Tim Burton Docuseries - Video Player
 * Modal video player with HLS streaming, fullscreen support, and watch progress tracking
 */

class TimBurtonVideoPlayer {
  constructor(auth, apiBaseUrl) {
    this.auth = auth;
    this.apiBaseUrl = apiBaseUrl || 'https://us-central1-tim-burton-docuseries.cloudfunctions.net/api';
    
    // Player state
    this.currentVideoId = null;
    this.currentPlaybackId = null;
    this.currentContentType = null;
    this.hls = null;
    this.videoElement = null;
    this.progressSaveInterval = null;
    
    // Create player modal
    this.createPlayerModal();
    
    // Bind event handlers
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
    
    console.log('✅ TimBurtonVideoPlayer initialized');
  }

  /**
   * Create the modal video player overlay
   */
  createPlayerModal() {
    const modal = document.createElement('div');
    modal.id = 'tb-video-player-modal';
    modal.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #000;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    modal.innerHTML = `
      <div style="position: relative; width: 100%; height: 100%;">
        <!-- Close Button -->
        <button id="tb-player-close" style="
          position: absolute;
          top: 20px;
          right: 20px;
          width: 48px;
          height: 48px;
          background: rgba(0, 0, 0, 0.8);
          border: none;
          border-radius: 50%;
          color: #fff;
          font-size: 24px;
          cursor: pointer;
          z-index: 10000;
          transition: background 0.2s;
        " aria-label="Close player">×</button>

        <!-- Video Container -->
        <div style="
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <video 
            id="tb-video-element"
            controls
            playsinline
            style="
              width: 100%;
              height: 100%;
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            "
          ></video>
        </div>

        <!-- Loading Indicator -->
        <div id="tb-player-loading" style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #fff;
          font-size: 18px;
          font-family: system-ui, -apple-system, sans-serif;
          display: none;
        ">
          <div style="text-align: center;">
            <div style="
              border: 4px solid rgba(255, 255, 255, 0.3);
              border-top: 4px solid #fff;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 16px;
            "></div>
            <div>Loading video...</div>
          </div>
        </div>

        <!-- Error Message -->
        <div id="tb-player-error" style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #fff;
          font-size: 16px;
          font-family: system-ui, -apple-system, sans-serif;
          text-align: center;
          display: none;
          padding: 24px;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 8px;
          max-width: 400px;
        ">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <div id="tb-player-error-message"></div>
        </div>
      </div>

      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        #tb-player-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        #tb-video-element::-webkit-media-controls-panel {
          background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.8));
        }
      </style>
    `;

    document.body.appendChild(modal);

    // Store references
    this.modal = modal;
    this.videoElement = document.getElementById('tb-video-element');
    this.loadingIndicator = document.getElementById('tb-player-loading');
    this.errorContainer = document.getElementById('tb-player-error');
    this.errorMessage = document.getElementById('tb-player-error-message');
    
    // Attach event listeners
    document.getElementById('tb-player-close').addEventListener('click', () => this.close());
    this.videoElement.addEventListener('timeupdate', this.updateProgress);
  }

  /**
   * Open player and load video
   */
  async play(videoId, playbackId, contentType = 'episode') {
    if (!this.auth || !this.auth.isSignedIn()) {
      this.showError('Please sign in to watch videos');
      return;
    }

    this.currentVideoId = videoId;
    this.currentPlaybackId = playbackId;
    this.currentContentType = contentType;

    // Open modal
    this.modal.style.display = 'block';
    setTimeout(() => {
      this.modal.style.opacity = '1';
    }, 10);

    // Show loading state
    this.showLoading();

    // Add keyboard listener
    document.addEventListener('keydown', this.handleKeyPress);

    try {
      // Get signed playback URL from backend
      const userId = this.auth.getCurrentUser().uid;
      const response = await fetch(`${this.apiBaseUrl}/content/playback-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.auth.getIdToken()}`
        },
        body: JSON.stringify({
          userId: userId,
          playbackId: playbackId,
          contentType: contentType
        })
      });

      const data = await response.json();

      if (!data.success || !data.url) {
        throw new Error(data.error || 'Failed to get video URL');
      }

      // Load video with HLS.js
      await this.loadVideo(data.url);

      // Load saved progress
      await this.loadProgress();

      // Start progress tracking
      this.startProgressTracking();

    } catch (error) {
      console.error('Error loading video:', error);
      this.showError(error.message || 'Failed to load video');
    }
  }

  /**
   * Load video using HLS.js
   */
  async loadVideo(hlsUrl) {
    // Check if HLS.js is needed (Safari has native HLS support)
    if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      this.videoElement.src = hlsUrl;
      this.hideLoading();
    } else if (window.Hls && Hls.isSupported()) {
      // Use HLS.js for other browsers
      if (this.hls) {
        this.hls.destroy();
      }

      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90
      });

      this.hls.loadSource(hlsUrl);
      this.hls.attachMedia(this.videoElement);

      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        this.hideLoading();
        this.videoElement.play().catch(err => {
          console.log('Autoplay prevented:', err);
        });
      });

      this.hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              this.showError('Network error. Please check your connection.');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              this.showError('Media error. Please try again.');
              this.hls.recoverMediaError();
              break;
            default:
              this.showError('An error occurred loading the video.');
              break;
          }
        }
      });
    } else {
      this.showError('Your browser does not support video playback. Please use a modern browser.');
    }
  }

  /**
   * Load saved watch progress
   */
  async loadProgress() {
    try {
      const userId = this.auth.getCurrentUser().uid;
      const response = await fetch(
        `${this.apiBaseUrl}/content/progress/${this.currentVideoId}?userId=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${await this.auth.getIdToken()}`
          }
        }
      );

      const data = await response.json();

      if (data.success && data.progress && data.progress.currentTime) {
        const currentTime = data.progress.currentTime;
        const duration = this.videoElement.duration;

        // Only resume if not near the end (< 95%)
        if (currentTime < duration * 0.95) {
          this.videoElement.currentTime = currentTime;
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
      // Non-critical error, continue playing
    }
  }

  /**
   * Update watch progress (called on timeupdate event)
   */
  updateProgress() {
    // Debounce progress updates to every 5 seconds
    if (!this.lastProgressUpdate || Date.now() - this.lastProgressUpdate > 5000) {
      this.saveProgress();
      this.lastProgressUpdate = Date.now();
    }
  }

  /**
   * Save current watch progress to backend
   */
  async saveProgress() {
    if (!this.videoElement || !this.currentVideoId) return;

    const currentTime = this.videoElement.currentTime;
    const duration = this.videoElement.duration;

    if (!currentTime || !duration || isNaN(currentTime) || isNaN(duration)) return;

    try {
      const userId = this.auth.getCurrentUser().uid;
      await fetch(`${this.apiBaseUrl}/content/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.auth.getIdToken()}`
        },
        body: JSON.stringify({
          userId: userId,
          videoId: this.currentVideoId,
          currentTime: currentTime,
          duration: duration
        })
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      // Non-critical error, don't interrupt playback
    }
  }

  /**
   * Start periodic progress tracking
   */
  startProgressTracking() {
    if (this.progressSaveInterval) {
      clearInterval(this.progressSaveInterval);
    }

    // Save progress every 10 seconds
    this.progressSaveInterval = setInterval(() => {
      this.saveProgress();
    }, 10000);
  }

  /**
   * Stop progress tracking
   */
  stopProgressTracking() {
    if (this.progressSaveInterval) {
      clearInterval(this.progressSaveInterval);
      this.progressSaveInterval = null;
    }
  }

  /**
   * Close the player
   */
  close() {
    // Save progress one last time
    this.saveProgress();

    // Stop progress tracking
    this.stopProgressTracking();

    // Pause video
    if (this.videoElement) {
      this.videoElement.pause();
    }

    // Destroy HLS instance
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    // Hide modal with animation
    this.modal.style.opacity = '0';
    setTimeout(() => {
      this.modal.style.display = 'none';
    }, 300);

    // Remove keyboard listener
    document.removeEventListener('keydown', this.handleKeyPress);

    // Reset state
    this.currentVideoId = null;
    this.currentPlaybackId = null;
    this.currentContentType = null;
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyPress(event) {
    switch (event.key) {
      case 'Escape':
        this.close();
        break;
      case ' ':
        if (event.target === document.body) {
          event.preventDefault();
          if (this.videoElement.paused) {
            this.videoElement.play();
          } else {
            this.videoElement.pause();
          }
        }
        break;
      case 'f':
      case 'F':
        this.toggleFullscreen();
        break;
    }
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      if (this.videoElement.requestFullscreen) {
        this.videoElement.requestFullscreen();
      } else if (this.videoElement.webkitRequestFullscreen) {
        this.videoElement.webkitRequestFullscreen();
      } else if (this.videoElement.mozRequestFullScreen) {
        this.videoElement.mozRequestFullScreen();
      } else if (this.videoElement.msRequestFullscreen) {
        this.videoElement.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

  /**
   * Show loading indicator
   */
  showLoading() {
    this.loadingIndicator.style.display = 'block';
    this.errorContainer.style.display = 'none';
    this.videoElement.style.display = 'block';
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    this.loadingIndicator.style.display = 'none';
  }

  /**
   * Show error message
   */
  showError(message) {
    this.hideLoading();
    this.videoElement.style.display = 'none';
    this.errorContainer.style.display = 'block';
    this.errorMessage.textContent = message;
  }
}

// Make available globally
window.TimBurtonVideoPlayer = TimBurtonVideoPlayer;

