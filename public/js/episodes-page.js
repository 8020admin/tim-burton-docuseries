/**
 * Episodes Page Manager for Tim Burton Docuseries
 * Handles authentication check and redirect for /episodes page
 * 
 * Pattern: Same as account-page.js
 * - Wait for auth to initialize
 * - Check if user is signed in
 * - If not signed in, redirect to homepage immediately
 */

class EpisodesPageManager {
  constructor() {
    this.init();
  }
  
  // ============================================================================
  // INITIALIZATION & AUTH CHECK
  // ============================================================================
  
  async init() {
    // Wait for auth to initialize
    if (!window.timBurtonAuth) {
      console.log('Waiting for auth to initialize...');
      await this.waitForAuth();
    }
    
    // Check if user is signed in
    if (!window.timBurtonAuth.isSignedIn()) {
      console.log('❌ User not signed in, redirecting to homepage...');
      this.redirectToHomepage();
      return;
    }
    
    // User is authenticated, allow access to episodes page
    console.log('✅ User authenticated, episodes page access granted');
  }
  
  /**
   * Wait for auth system to initialize
   */
  async waitForAuth() {
    return new Promise((resolve) => {
      const checkAuth = setInterval(() => {
        if (window.timBurtonAuth && window.timBurtonAuth.isInitialized) {
          clearInterval(checkAuth);
          resolve();
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkAuth);
        resolve();
      }, 5000);
    });
  }
  
  /**
   * Redirect to homepage if not authenticated
   */
  redirectToHomepage() {
    // Redirect immediately to homepage
    window.location.href = '/';
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize episodes page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.episodesPageManager = new EpisodesPageManager();
});

// Make available globally
window.EpisodesPageManager = EpisodesPageManager;

