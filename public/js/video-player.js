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
    this.currentVideoTitle = null;
    this.currentVideoUrl = null;
    
    // Chromecast state
    this.castSession = null;
    this.castPlayer = null;
    this.castingIndicator = null;
    
    // Callback for when player closes
    this.onClose = null;
    
    // Create player modal
    this.createPlayerModal();
    
    // Bind event handlers
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
    
    // Initialize Chromecast
    this.initializeChromecast();
    
    console.log('✅ TimBurtonVideoPlayer initialized');
  }

  /**
   * Initialize Google Cast SDK for Chromecast support
   */
  initializeChromecast() {
    window['__onGCastApiAvailable'] = (isAvailable) => {
      if (isAvailable && window.cast && window.chrome && window.chrome.cast) {
        try {
          const castContext = cast.framework.CastContext.getInstance();
          
          castContext.setOptions({
            receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
            autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
          });
          
          // Listen for cast session state changes
          castContext.addEventListener(
            cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
            (event) => this.handleCastSessionStateChange(event)
          );
          
          // Listen for cast state changes (device availability)
          castContext.addEventListener(
            cast.framework.CastContextEventType.CAST_STATE_CHANGED,
            (event) => {
              console.log('Cast state changed:', event.castState);
            }
          );
          
          console.log('✅ Chromecast initialized');
        } catch (error) {
          console.warn('⚠️ Chromecast initialization failed:', error.message);
        }
      }
    };
  }

  /**
   * Handle cast session state changes
   */
  handleCastSessionStateChange(event) {
    console.log('Cast session state changed:', event.sessionState);
    
    switch (event.sessionState) {
      case cast.framework.SessionState.SESSION_STARTED:
      case cast.framework.SessionState.SESSION_RESUMED:
        // User connected to a cast device
        const session = event.session;
        if (session) {
          this.onCastSessionStarted(session);
        }
        break;
        
      case cast.framework.SessionState.SESSION_ENDED:
        // User disconnected from cast device
        this.onCastSessionEnded();
        break;
    }
  }

  /**
   * Handle when casting starts
   */
  onCastSessionStarted(session) {
    console.log('✅ Cast session started');
    console.log('📺 Cast device:', session.getCastDevice().friendlyName);
    this.castSession = session;
    
    // If we have a video loaded, cast it
    if (this.currentVideoUrl && this.videoElement) {
      const currentTime = this.videoElement.currentTime || 0;
      const isPaused = this.videoElement.paused;
      
      console.log('📹 Transferring video to cast device:', {
        url: this.currentVideoUrl.substring(0, 50) + '...',
        currentTime,
        isPaused,
        title: this.currentVideoTitle
      });
      
      // Pause local video
      this.videoElement.pause();
      
      // Load video on cast device
      this.loadMediaOnCast(this.currentVideoUrl, currentTime, !isPaused);
      
      // Hide local video element
      this.videoElement.style.display = 'none';
      
      // Show casting indicator
      this.showCastingIndicator();
    } else {
      console.warn('⚠️ No video loaded to cast:', {
        hasUrl: !!this.currentVideoUrl,
        hasElement: !!this.videoElement
      });
    }
  }

  /**
   * Handle when casting ends
   */
  onCastSessionEnded() {
    console.log('✅ Cast session ended');
    
    // Get the playback position from the cast session before it's cleared
    let castCurrentTime = 0;
    if (this.castSession) {
      try {
        const castSession = cast.framework.CastContext.getInstance().getCurrentSession();
        if (castSession) {
          const mediaSession = castSession.getMediaSession();
          if (mediaSession) {
            castCurrentTime = mediaSession.getEstimatedTime();
          }
        }
      } catch (error) {
        console.warn('Could not get cast playback position:', error);
      }
    }
    
    this.castSession = null;
    
    // Resume local playback
    if (this.videoElement && this.currentVideoUrl) {
      // Show video element again
      this.videoElement.style.display = 'block';
      
      // Resume from where cast left off
      if (castCurrentTime > 0) {
        this.videoElement.currentTime = castCurrentTime;
      }
      
      // Resume playback
      this.videoElement.play().catch(err => {
        console.log('Autoplay prevented after casting:', err);
      });
      
      // Hide casting indicator
      this.hideCastingIndicator();
    }
  }

  /**
   * Load media on the cast device
   */
  loadMediaOnCast(hlsUrl, startTime = 0, autoplay = true) {
    if (!this.castSession) {
      console.warn('⚠️ No cast session available');
      return;
    }

    console.log('🎬 Loading media on cast device...', {
      urlPreview: hlsUrl.substring(0, 80) + '...',
      startTime,
      autoplay,
      contentType: 'application/vnd.apple.mpegurl'
    });

    try {
      // Create media info
      // Use application/vnd.apple.mpegurl for better Chromecast compatibility
      const mediaInfo = new chrome.cast.media.MediaInfo(hlsUrl, 'application/vnd.apple.mpegurl');
      
      // Set metadata
      mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
      mediaInfo.metadata.title = this.currentVideoTitle || 'Tim Burton Docuseries';
      
      // Create load request
      const request = new chrome.cast.media.LoadRequest(mediaInfo);
      request.currentTime = startTime;
      request.autoplay = autoplay;

      console.log('📤 Sending media to cast device...');

      // Load media on cast device
      this.castSession.loadMedia(request).then(
        () => {
          console.log('✅ Media loaded successfully on cast device');
          this.hideLoading();
        },
        (errorCode) => {
          console.error('❌ Cast load failed with error code:', errorCode);
          console.error('📋 Error details:', {
            errorCode,
            type: typeof errorCode,
            message: errorCode.description || errorCode.message || 'Unknown error'
          });
          
          this.showError('Failed to cast video. Resuming local playback...');
          
          // Fall back to local playback
          setTimeout(() => {
            this.videoElement.style.display = 'block';
            this.videoElement.play().catch(err => console.log('Autoplay prevented:', err));
            this.hideCastingIndicator();
          }, 2000);
        }
      );
    } catch (error) {
      console.error('❌ Exception loading media on cast:', error);
      console.error('📋 Exception details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      this.showError('Failed to cast video');
    }
  }

  /**
   * Show casting indicator
   */
  showCastingIndicator() {
    if (this.castingIndicator) {
      this.castingIndicator.style.display = 'flex';
      return;
    }
    
    // Create casting indicator if it doesn't exist
    const indicator = document.createElement('div');
    indicator.id = 'tb-casting-indicator';
    indicator.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
      text-align: center;
      z-index: 100;
    `;
    
    indicator.innerHTML = `
      <div style="font-size: 64px; margin-bottom: 24px;">📺</div>
      <div style="font-size: 24px; font-weight: 500; margin-bottom: 8px;">
        Casting to TV
      </div>
      <div style="font-size: 16px; opacity: 0.8;">
        ${this.currentVideoTitle || 'Tim Burton Docuseries'}
      </div>
    `;
    
    this.modal.querySelector('div').appendChild(indicator);
    this.castingIndicator = indicator;
  }

  /**
   * Hide casting indicator
   */
  hideCastingIndicator() {
    if (this.castingIndicator) {
      this.castingIndicator.style.display = 'none';
    }
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

    // Detect iOS for native fullscreen behavior
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const playsInlineAttr = isIOS ? '' : 'playsinline';

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

        <!-- Chromecast Button -->
        <google-cast-launcher id="tb-castbutton" style="
          position: absolute;
          top: 20px;
          right: 80px;
          width: 48px;
          height: 48px;
          z-index: 10000;
        "></google-cast-launcher>

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
            ${playsInlineAttr}
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
    this.videoElement.addEventListener('timeupdate', () => this.updateProgress());
  }

  /**
   * Open player and load video
   */
  async play(videoId, playbackId, contentType = 'episode', title = 'Tim Burton Docuseries') {
    if (!this.auth || !this.auth.isSignedIn()) {
      this.showError('Please sign in to watch videos');
      return;
    }

    this.currentVideoId = videoId;
    this.currentPlaybackId = playbackId;
    this.currentContentType = contentType;
    this.currentVideoTitle = title;

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
   * Load video using HLS.js or native player
   */
  async loadVideo(hlsUrl) {
    // Store URL for Chromecast
    this.currentVideoUrl = hlsUrl;

    // Check if already casting to a device
    if (window.cast && window.cast.framework) {
      try {
        const castSession = cast.framework.CastContext.getInstance().getCurrentSession();
        if (castSession) {
          // Already casting - load the new video on cast device
          this.castSession = castSession;
          this.loadMediaOnCast(hlsUrl, 0, true);
          this.videoElement.style.display = 'none';
          this.showCastingIndicator();
          return;
        }
      } catch (error) {
        console.warn('⚠️ Cast session check failed:', error.message);
        // Continue with normal playback
      }
    }

    // Ensure video element is visible for local playback
    this.videoElement.style.display = 'block';

    // Check if HLS.js is needed (Safari/iOS has native HLS support)
    if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari, iOS)
      this.videoElement.src = hlsUrl;
      
      // Autoplay on iOS/Safari
      this.videoElement.play().then(() => {
        this.hideLoading();
      }).catch(err => {
        console.log('Autoplay prevented:', err);
        this.hideLoading();
      });
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
  async close() {
    // Save progress one last time and wait for it to complete
    await this.saveProgress();

    // Stop progress tracking
    this.stopProgressTracking();

    // Stop casting if active
    if (this.castSession) {
      try {
        const castContext = cast.framework.CastContext.getInstance();
        castContext.endCurrentSession(true);
      } catch (error) {
        console.warn('Could not end cast session:', error);
      }
    }

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

    // Call onClose callback if provided (to refresh progress bars)
    // Progress is guaranteed to be saved at this point
    if (typeof this.onClose === 'function') {
      this.onClose();
    }

    // Reset state
    this.currentVideoId = null;
    this.currentPlaybackId = null;
    this.currentContentType = null;
    this.castSession = null;
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

