/**
 * Tim Burton Docuseries - Content Manager
 * Manages video content catalog and playback IDs
 */

class TimBurtonContentManager {
  constructor(videoPlayer) {
    this.videoPlayer = videoPlayer;
    
    // Content catalog with Mux playback IDs
    // UPDATE THESE with your actual Mux playback IDs
    this.catalog = {
      episodes: [
        {
          id: 'episode-1',
          title: 'Suburban Hell',
          playbackId: 'REPLACE_WITH_PLAYBACK_ID_1', // Get from Mux Dashboard
          duration: null, // Will be populated when video loads
          contentType: 'episode'
        },
        {
          id: 'episode-2',
          title: 'Misunderstood Monsters',
          playbackId: 'REPLACE_WITH_PLAYBACK_ID_2', // Get from Mux Dashboard
          duration: null,
          contentType: 'episode'
        },
        {
          id: 'episode-3',
          title: 'Rebel by Design',
          playbackId: 'REPLACE_WITH_PLAYBACK_ID_3', // Get from Mux Dashboard
          duration: null,
          contentType: 'episode'
        }
      ],
      extras: [
        {
          id: 'bonus-1',
          title: 'Behind the Scenes',
          playbackId: 'REPLACE_WITH_PLAYBACK_ID_4', // Get from Mux Dashboard
          duration: null,
          contentType: 'extra'
        }
      ]
    };

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

    // Open video player
    this.videoPlayer.play(video.id, video.playbackId, video.contentType);
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
}

// Make available globally
window.TimBurtonContentManager = TimBurtonContentManager;

