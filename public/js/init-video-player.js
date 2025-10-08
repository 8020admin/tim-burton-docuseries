/**
 * Tim Burton Docuseries - Video Player Initialization
 * Automatically initializes the video player and content manager
 */

(function() {
  'use strict';

  /**
   * Initialize the video player system
   */
  function initializeVideoSystem() {
    // Check if all dependencies are loaded
    if (typeof window.timBurtonAuth === 'undefined') {
      console.log('⏳ Waiting for timBurtonAuth...');
      setTimeout(initializeVideoSystem, 100);
      return;
    }

    if (typeof window.TimBurtonVideoPlayer === 'undefined') {
      console.log('⏳ Waiting for TimBurtonVideoPlayer...');
      setTimeout(initializeVideoSystem, 100);
      return;
    }

    if (typeof window.TimBurtonContentManager === 'undefined') {
      console.log('⏳ Waiting for TimBurtonContentManager...');
      setTimeout(initializeVideoSystem, 100);
      return;
    }

    // All dependencies loaded, initialize
    console.log('🎬 Initializing video player system...');

    try {
      // Create video player instance
      window.videoPlayer = new TimBurtonVideoPlayer(
        window.timBurtonAuth,
        'https://us-central1-tim-burton-docuseries.cloudfunctions.net/api'
      );

      // Create content manager instance
      window.contentManager = new TimBurtonContentManager(window.videoPlayer);

      console.log('✅ Video player system ready!');
    } catch (error) {
      console.error('❌ Error initializing video player system:', error);
    }
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVideoSystem);
  } else {
    // DOM already loaded
    initializeVideoSystem();
  }

})();
