/**
 * Content Access Control Module for Tim Burton Docuseries
 * Handles show/hide and secure content serving based on authentication and purchase status
 */

class ContentAccessControl {
  constructor() {
    this.auth = null;
    this.init();
  }

  /**
   * Initialize content access control
   */
  init() {
    // Wait for auth system to be available
    if (window.timBurtonAuth) {
      this.auth = window.timBurtonAuth;
      this.setupContentAccess();
    } else {
      // Wait for auth system to load
      document.addEventListener('DOMContentLoaded', () => {
        this.auth = window.timBurtonAuth;
        this.setupContentAccess();
      });
    }
  }

  /**
   * Setup content access control
   */
  setupContentAccess() {
    // Listen for authentication events
    document.addEventListener('timBurtonAuth', (event) => {
      this.updateContentVisibility();
    });

    // Initial content visibility update
    this.updateContentVisibility();
  }

  /**
   * Update content visibility based on authentication and purchase status
   */
  updateContentVisibility() {
    if (!this.auth) return;

    const buttonState = this.auth.getButtonState();
    
    // Update elements with data-auth-required attribute
    this.updateAuthRequiredElements(buttonState);
    
    // Update elements with data-purchase-required attribute
    this.updatePurchaseRequiredElements(buttonState);
    
    // Update elements with data-boxset-required attribute
    this.updateBoxSetRequiredElements(buttonState);
    
    // Update elements for non-authenticated users
    this.showForNonAuthenticated();
    
    // Update elements for authenticated but not paid users
    this.showForNotPaid();
    
    // Update upgrade prompt for regular purchasers
    this.showUpgradePrompt();
  }

  /**
   * Update elements that require authentication
   */
  updateAuthRequiredElements(buttonState) {
    const elements = document.querySelectorAll('[data-auth-required="true"]');
    
    elements.forEach(element => {
      if (buttonState === 'not-signed-in') {
        element.style.display = 'none';
      } else {
        element.style.display = '';
      }
    });
  }

  /**
   * Update elements that require purchase
   */
  updatePurchaseRequiredElements(buttonState) {
    const elements = document.querySelectorAll('[data-purchase-required="true"]');
    
    elements.forEach(element => {
      if (buttonState === 'signed-in-paid') {
        element.style.display = '';
      } else {
        element.style.display = 'none';
      }
    });
  }

  /**
   * Update elements that require box set purchase
   */
  updateBoxSetRequiredElements(buttonState) {
    const elements = document.querySelectorAll('[data-boxset-required="true"]');
    
    elements.forEach(element => {
      if (buttonState === 'signed-in-paid' && this.auth.hasBoxSetAccess()) {
        element.style.display = '';
      } else {
        element.style.display = 'none';
      }
    });
  }

  /**
   * Show content for non-authenticated users
   */
  showForNonAuthenticated() {
    const elements = document.querySelectorAll('[data-show-not-signed-in="true"]');
    
    elements.forEach(element => {
      if (!this.auth || !this.auth.isSignedIn()) {
        element.style.display = '';
      } else {
        element.style.display = 'none';
      }
    });
  }

  /**
   * Show content for authenticated but not paid users
   */
  showForNotPaid() {
    const elements = document.querySelectorAll('[data-show-not-paid="true"]');
    
    elements.forEach(element => {
      if (this.auth && this.auth.isSignedIn() && !this.auth.hasPurchase()) {
        element.style.display = '';
      } else {
        element.style.display = 'none';
      }
    });
  }

  /**
   * Load secure content for episodes
   */
  async loadEpisodes() {
    if (!this.auth || !this.auth.isSignedIn()) {
      throw new Error('User must be signed in to access episodes');
    }

    const accessCheck = await this.auth.checkContentAccess('episodes');
    if (!accessCheck.hasAccess) {
      throw new Error('User must have purchased content to access episodes');
    }

    // This will be implemented when we have the actual episode data
    console.log('Loading episodes for authenticated user');
    return { success: true, episodes: [] };
  }

  /**
   * Load secure content for bonus content
   */
  async loadBonusContent() {
    if (!this.auth || !this.auth.isSignedIn()) {
      throw new Error('User must be signed in to access bonus content');
    }

    const accessCheck = await this.auth.checkContentAccess('bonus');
    if (!accessCheck.hasAccess) {
      if (accessCheck.reason === 'regular-purchase-only') {
        return { 
          success: false, 
          error: 'upgrade-required',
          message: 'Upgrade to Box Set to access bonus content'
        };
      } else {
        throw new Error('User must have purchased content to access bonus content');
      }
    }

    // This will be implemented when we have the actual bonus content data
    console.log('Loading bonus content for box set purchaser');
    return { success: true, bonusContent: [] };
  }

  /**
   * Get secure video URL for a specific episode
   */
  async getEpisodeVideoUrl(episodeId) {
    return await this.auth.getSecureContentUrl(episodeId, 'episodes');
  }

  /**
   * Get secure video URL for bonus content
   */
  async getBonusContentVideoUrl(contentId) {
    return await this.auth.getSecureContentUrl(contentId, 'bonus');
  }

  /**
   * Check if user can access specific content
   */
  async canAccessContent(contentType) {
    if (!this.auth || !this.auth.isSignedIn()) {
      return { canAccess: false, reason: 'not-signed-in' };
    }

    return await this.auth.checkContentAccess(contentType);
  }

  /**
   * Show upgrade prompt for regular purchasers
   */
  showUpgradePrompt() {
    const elements = document.querySelectorAll('[data-upgrade-prompt="true"]');
    
    elements.forEach(element => {
      if (this.auth && this.auth.isSignedIn() && this.auth.hasPurchase() && !this.auth.hasBoxSetAccess()) {
        element.style.display = '';
      } else {
        element.style.display = 'none';
      }
    });
  }
}

// Initialize content access control
document.addEventListener('DOMContentLoaded', () => {
  window.contentAccessControl = new ContentAccessControl();
});

// Export for use in other scripts
window.ContentAccessControl = ContentAccessControl;
