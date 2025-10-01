/**
 * User Profile Management
 * Handles user profile data display and editing
 */

class UserProfileManager {
  constructor() {
    this.auth = null;
    this.currentUser = null;
    this.init();
  }

  init() {
    // Wait for auth to be available
    if (window.timBurtonAuth) {
      this.auth = window.timBurtonAuth;
      this.setupEventListeners();
    } else {
      // Wait for auth to be initialized
      document.addEventListener('timBurtonAuth', () => {
        this.auth = window.timBurtonAuth;
        this.setupEventListeners();
      });
    }
  }

  setupEventListeners() {
    // Listen for auth events to update profile
    document.addEventListener('timBurtonAuth', (event) => {
      if (event.detail.type === 'signIn' || event.detail.type === 'sessionRestored') {
        this.currentUser = event.detail.user;
        this.updateProfileDisplay();
      } else if (event.detail.type === 'signOut') {
        this.currentUser = null;
        this.hideProfileDisplay();
      }
    });
  }

  /**
   * Update profile display with current user data
   */
  updateProfileDisplay() {
    if (!this.currentUser) return;

    // Update profile picture
    const profileImg = document.querySelector('[data-profile-image]');
    if (profileImg && this.currentUser.photoURL) {
      profileImg.src = this.currentUser.photoURL;
      profileImg.alt = `${this.currentUser.firstName || this.currentUser.displayName}'s profile picture`;
    }

    // Update name display
    const firstNameDisplay = document.querySelector('[data-profile-first-name]');
    if (firstNameDisplay) {
      firstNameDisplay.textContent = this.currentUser.firstName || this.currentUser.displayName || 'User';
    }

    const lastNameDisplay = document.querySelector('[data-profile-last-name]');
    if (lastNameDisplay) {
      lastNameDisplay.textContent = this.currentUser.lastName || '';
    }

    const fullNameDisplay = document.querySelector('[data-profile-full-name]');
    if (fullNameDisplay) {
      const fullName = this.getFullName();
      fullNameDisplay.textContent = fullName;
    }

    // Update email display
    const emailDisplay = document.querySelector('[data-profile-email]');
    if (emailDisplay) {
      emailDisplay.textContent = this.currentUser.email || '';
    }

    // Show profile elements
    this.showProfileElements();
  }

  /**
   * Hide profile display when user is not signed in
   */
  hideProfileDisplay() {
    const profileElements = document.querySelectorAll('[data-profile-image], [data-profile-first-name], [data-profile-last-name], [data-profile-full-name], [data-profile-email]');
    profileElements.forEach(element => {
      element.style.display = 'none';
    });
  }

  /**
   * Show profile elements when user is signed in
   */
  showProfileElements() {
    const profileElements = document.querySelectorAll('[data-profile-image], [data-profile-first-name], [data-profile-last-name], [data-profile-full-name], [data-profile-email]');
    profileElements.forEach(element => {
      element.style.display = '';
    });
  }

  /**
   * Get full name from user data
   */
  getFullName() {
    if (!this.currentUser) return '';
    
    const firstName = this.currentUser.firstName || this.currentUser.displayName || 'User';
    const lastName = this.currentUser.lastName || '';
    
    return lastName ? `${firstName} ${lastName}` : firstName;
  }

  /**
   * Update user profile data
   */
  async updateProfile(updates) {
    if (!this.auth || !this.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      // Update in Firestore via backend
      const response = await fetch(`${this.auth.apiBaseUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.auth.customToken}`
        },
        body: JSON.stringify(updates)
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local user data
        this.currentUser = { ...this.currentUser, ...updates };
        
        // Update display
        this.updateProfileDisplay();
        
        // Dispatch profile update event
        this.dispatchProfileEvent('profileUpdated', { user: this.currentUser });
        
        return { success: true };
      } else {
        throw new Error(result.error || 'Profile update failed');
      }
    } catch (error) {
      console.error('❌ Profile update error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Dispatch profile events
   */
  dispatchProfileEvent(type, data) {
    const event = new CustomEvent('timBurtonProfile', {
      detail: { type, ...data }
    });
    document.dispatchEvent(event);
  }

  /**
   * Get current user profile data
   */
  getProfile() {
    return this.currentUser;
  }
}

// Initialize user profile manager
window.userProfileManager = new UserProfileManager();

// Export for use in other modules
window.UserProfileManager = UserProfileManager;
