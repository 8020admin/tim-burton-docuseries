/**
 * Account Page Manager for Tim Burton Docuseries
 * Handles authentication check, profile management, and purchase history
 */

class AccountPageManager {
  constructor() {
    this.apiBaseUrl = 'https://us-central1-tim-burton-docuseries.cloudfunctions.net/api';
    this.user = null;
    this.purchases = [];
    this.isUpdating = false;
    
    // Product details (matches backend STRIPE_PRODUCTS)
    this.products = {
      rental: {
        name: 'Tim Burton Docuseries - Rental',
        description: '4-day access to all 4 episodes',
        price: 14.99,
        duration: '4 days'
      },
      regular: {
        name: 'Tim Burton Docuseries - Regular Purchase',
        description: 'Permanent access to 4 episodes',
        price: 24.99,
        duration: 'Permanent'
      },
      boxset: {
        name: 'Tim Burton Docuseries - Box Set',
        description: '4 episodes + 40 hours of bonus content',
        price: 74.99,
        duration: 'Permanent'
      }
    };
    
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
    
    // User is authenticated, load account data
    this.user = window.timBurtonAuth.getCurrentUser();
    console.log('✅ User authenticated:', this.user.email);
    
    await this.loadAccountData();
    
    // Attach event handlers to update buttons
    this.attachEventHandlers();
    
    // Listen for sign out events
    this.listenForSignOut();
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
    // Show brief message before redirect (optional)
    const message = document.querySelector('[data-account-message]');
    if (message) {
      message.textContent = 'Please sign in to view your account.';
      message.style.display = 'block';
    }
    
    // Redirect after short delay
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  }
  
  /**
   * Listen for sign out events and redirect
   */
  listenForSignOut() {
    document.addEventListener('timBurtonAuth', (event) => {
      const { type } = event.detail;
      
      if (type === 'signOut') {
        console.log('✅ Sign out detected, redirecting to homepage...');
        this.redirectToHomepage();
      }
    });
  }
  
  // ============================================================================
  // LOAD ACCOUNT DATA
  // ============================================================================
  
  async loadAccountData() {
    try {
      // Load user profile (already in memory from auth)
      this.populateProfile();
      
      // Load purchase history
      await this.loadPurchaseHistory();
      
      // Hide loading state
      this.hideLoadingState();
      
      console.log('✅ Account data loaded');
      
    } catch (error) {
      console.error('❌ Error loading account data:', error);
      this.showError('Failed to load account data. Please refresh the page.');
    }
  }
  
  /**
   * Populate profile fields with user data
   */
  populateProfile() {
    // First Name - handle multiple elements (display + input)
    const firstNameEls = document.querySelectorAll('[data-profile-first-name]');
    firstNameEls.forEach(el => {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.value = this.user.firstName || '';
      } else {
        el.textContent = this.user.firstName || 'User';
      }
    });
    
    // Last Name - handle multiple elements (display + input)
    const lastNameEls = document.querySelectorAll('[data-profile-last-name]');
    lastNameEls.forEach(el => {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.value = this.user.lastName || '';
      } else {
        el.textContent = this.user.lastName || '';
      }
    });
    
    // Email (display only, separate field for editing)
    const emailDisplayEl = document.querySelector('[data-profile-email-display]');
    if (emailDisplayEl) {
      emailDisplayEl.textContent = this.user.email || '';
    }
    
    // Email (for editing)
    const emailInputEl = document.querySelector('[data-profile-email-input]');
    if (emailInputEl) {
      emailInputEl.value = this.user.email || '';
    }
    
    // Profile Image
    const photoEl = document.querySelector('[data-profile-image]');
    if (photoEl && this.user.photoURL) {
      photoEl.src = this.user.photoURL;
    }
    
    console.log('✅ Profile populated');
  }
  
  /**
   * Load purchase history from backend
   */
  async loadPurchaseHistory() {
    try {
      const idToken = await window.timBurtonAuth.getIdToken();
      
      const response = await fetch(`${this.apiBaseUrl}/payments/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load purchase history: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        this.purchases = result.purchases;
        this.displayPurchaseHistory();
        this.displayCurrentProduct();
        this.displayUpgradePrompt();
      } else {
        throw new Error(result.error || 'Failed to load purchase history');
      }
      
    } catch (error) {
      console.error('❌ Error loading purchase history:', error);
      this.showError('Failed to load purchase history.');
    }
  }
  
  /**
   * Display purchase history in the UI
   */
  displayPurchaseHistory() {
    const container = document.querySelector('[data-purchase-history]');
    if (!container) {
      console.warn('Purchase history container not found');
      return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    if (this.purchases.length === 0) {
      container.innerHTML = '<p>No purchases yet.</p>';
      return;
    }
    
    // Display each purchase
    this.purchases.forEach(purchase => {
      const purchaseEl = this.createPurchaseElement(purchase);
      container.appendChild(purchaseEl);
    });
    
    console.log(`✅ Displayed ${this.purchases.length} purchase(s)`);
  }
  
  /**
   * Create purchase element
   */
  createPurchaseElement(purchase) {
    const div = document.createElement('div');
    div.className = 'purchase-item';
    div.setAttribute('data-purchase-item', '');
    
    const product = this.products[purchase.productType];
    const amount = (purchase.amount / 100).toFixed(2);
    const date = purchase.createdAt ? new Date(purchase.createdAt._seconds * 1000).toLocaleDateString() : 'N/A';
    
    // Check if rental is expired
    let expirationHtml = '';
    if (purchase.productType === 'rental' && purchase.expiresAt) {
      const expiresAt = new Date(purchase.expiresAt._seconds * 1000);
      const now = new Date();
      if (now > expiresAt) {
        expirationHtml = '<div data-purchase-expiration><span class="expired">Expired</span></div>';
      } else {
        expirationHtml = `<div data-purchase-expiration><span class="active">Expires: ${expiresAt.toLocaleDateString()}</span></div>`;
      }
    }
    
    // Create product name (NO description in the generated HTML)
    const productName = product ? product.name : purchase.productType;
    
    div.innerHTML = `
      <div data-purchase-product-name>${productName}</div>
      <div data-purchase-date>${date}</div>
      <div data-purchase-amount>$${amount} USD</div>
      ${expirationHtml}
      <button data-download-receipt data-purchase-id="${purchase.id}">
        Download Receipt
      </button>
    `;
    
    // Add receipt download handler
    const receiptBtn = div.querySelector('[data-download-receipt]');
    receiptBtn.addEventListener('click', () => this.downloadReceipt(purchase.id));
    
    return div;
  }
  
  /**
   * Download receipt from Stripe
   */
  async downloadReceipt(purchaseId) {
    try {
      const idToken = await window.timBurtonAuth.getIdToken(true);
      const response = await fetch(`${this.apiBaseUrl}/payments/receipt/${purchaseId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get receipt URL');
      }
      
      const result = await response.json();
      
      if (result.success && result.receiptUrl) {
        // Open receipt in new window
        window.open(result.receiptUrl, '_blank');
      } else {
        throw new Error('Receipt URL not available');
      }
      
    } catch (error) {
      console.error('❌ Error downloading receipt:', error);
      this.showError('Failed to download receipt. Please contact support.');
    }
  }
  
  // ============================================================================
  // PRODUCT HIERARCHY & UPGRADE PROMPTS
  // ============================================================================
  
  /**
   * Determine the user's current product based on purchase hierarchy
   * Hierarchy: Box Set > Regular > Rental
   * Returns the highest tier product the user owns
   */
  getCurrentProduct() {
    if (!this.purchases || this.purchases.length === 0) {
      return null;
    }
    
    // Check for active rentals (not expired)
    const now = new Date();
    const activeRentals = this.purchases.filter(p => {
      if (p.productType !== 'rental') return false;
      if (!p.expiresAt) return false;
      const expiresAt = new Date(p.expiresAt._seconds * 1000);
      return now <= expiresAt;
    });
    
    // Check for permanent products (boxset > regular)
    const hasBoxSet = this.purchases.some(p => p.productType === 'boxset');
    const hasRegular = this.purchases.some(p => p.productType === 'regular');
    
    // Return highest tier
    if (hasBoxSet) {
      return {
        type: 'boxset',
        name: this.products.boxset.name,
        description: this.products.boxset.description,
        tier: 3
      };
    }
    
    if (hasRegular) {
      return {
        type: 'regular',
        name: this.products.regular.name,
        description: this.products.regular.description,
        tier: 2
      };
    }
    
    if (activeRentals.length > 0) {
      // Find the rental that expires latest
      const latestRental = activeRentals.reduce((latest, current) => {
        const latestExpires = new Date(latest.expiresAt._seconds * 1000);
        const currentExpires = new Date(current.expiresAt._seconds * 1000);
        return currentExpires > latestExpires ? current : latest;
      });
      
      const expiresAt = new Date(latestRental.expiresAt._seconds * 1000);
      
      return {
        type: 'rental',
        name: this.products.rental.name,
        description: this.products.rental.description,
        tier: 1,
        expiresAt: expiresAt,
        expiresAtFormatted: expiresAt.toLocaleDateString()
      };
    }
    
    return null;
  }
  
  /**
   * Display the current product in the UI
   */
  displayCurrentProduct() {
    const currentProduct = this.getCurrentProduct();
    
    // Update product name
    const nameEl = document.querySelector('[data-current-product-name]');
    if (nameEl) {
      if (currentProduct) {
        nameEl.textContent = currentProduct.name;
      } else {
        nameEl.textContent = 'No active product';
      }
    }
    
    // Update product description
    const descEl = document.querySelector('[data-current-product-description]');
    if (descEl) {
      if (currentProduct) {
        descEl.textContent = currentProduct.description;
      } else {
        descEl.textContent = 'Purchase a product to start watching';
      }
    }
    
    // Update product type
    const typeEl = document.querySelector('[data-current-product-type]');
    if (typeEl) {
      if (currentProduct) {
        typeEl.textContent = currentProduct.type;
      } else {
        typeEl.textContent = 'none';
      }
    }
    
    // Update expiration date (for rentals only)
    const expiresEl = document.querySelector('[data-current-product-expires]');
    if (expiresEl) {
      if (currentProduct && currentProduct.type === 'rental' && currentProduct.expiresAtFormatted) {
        expiresEl.textContent = `Expires: ${currentProduct.expiresAtFormatted}`;
        expiresEl.style.display = 'block';
      } else {
        expiresEl.style.display = 'none';
      }
    }
    
    // Update tier (for conditional visibility in Webflow)
    const tierEl = document.querySelector('[data-current-product-tier]');
    if (tierEl) {
      if (currentProduct) {
        tierEl.textContent = currentProduct.tier.toString();
      } else {
        tierEl.textContent = '0';
      }
    }
    
    console.log('✅ Current product displayed:', currentProduct);
  }
  
  /**
   * Determine which upgrade prompt to show (if any)
   */
  getUpgradePrompt() {
    const currentProduct = this.getCurrentProduct();
    
    if (!currentProduct) {
      // No product - could show "Get Started" prompt
      return null;
    }
    
    if (currentProduct.type === 'boxset') {
      // Already has highest tier
      return null;
    }
    
    if (currentProduct.type === 'regular') {
      // Prompt to upgrade to Box Set (discounted)
      return {
        from: 'regular',
        to: 'boxset',
        productName: 'Box Set',
        fullPrice: 74.99,
        upgradePrice: 49.99,
        savings: 25.00,
        description: 'Upgrade to get 40 hours of exclusive bonus content',
        ctaText: 'Upgrade to Box Set'
      };
    }
    
    if (currentProduct.type === 'rental') {
      // Prompt to upgrade to Regular (same price)
      return {
        from: 'rental',
        to: 'regular',
        productName: 'Regular Purchase',
        fullPrice: 24.99,
        upgradePrice: 24.99,
        savings: 0,
        description: 'Upgrade to permanent access for the same price you paid',
        ctaText: 'Upgrade to Permanent Access'
      };
    }
    
    return null;
  }
  
  /**
   * Display the upgrade prompt in the UI
   */
  displayUpgradePrompt() {
    const upgradePrompt = this.getUpgradePrompt();
    
    // Show/hide upgrade prompt container
    const promptContainer = document.querySelector('[data-upgrade-prompt]');
    if (promptContainer) {
      if (upgradePrompt) {
        promptContainer.style.display = 'block';
      } else {
        promptContainer.style.display = 'none';
        return;
      }
    }
    
    // Update upgrade prompt content
    const productNameEl = document.querySelector('[data-upgrade-product-name]');
    if (productNameEl && upgradePrompt) {
      productNameEl.textContent = upgradePrompt.productName;
    }
    
    const descriptionEl = document.querySelector('[data-upgrade-description]');
    if (descriptionEl && upgradePrompt) {
      descriptionEl.textContent = upgradePrompt.description;
    }
    
    const priceEl = document.querySelector('[data-upgrade-price]');
    if (priceEl && upgradePrompt) {
      priceEl.textContent = `$${upgradePrompt.upgradePrice.toFixed(2)}`;
    }
    
    const fullPriceEl = document.querySelector('[data-upgrade-full-price]');
    if (fullPriceEl && upgradePrompt) {
      if (upgradePrompt.savings > 0) {
        fullPriceEl.textContent = `$${upgradePrompt.fullPrice.toFixed(2)}`;
        fullPriceEl.style.display = 'inline';
      } else {
        fullPriceEl.style.display = 'none';
      }
    }
    
    const savingsEl = document.querySelector('[data-upgrade-savings]');
    if (savingsEl && upgradePrompt) {
      if (upgradePrompt.savings > 0) {
        savingsEl.textContent = `Save $${upgradePrompt.savings.toFixed(2)}!`;
        savingsEl.style.display = 'block';
      } else {
        savingsEl.style.display = 'none';
      }
    }
    
    const ctaEl = document.querySelector('[data-upgrade-cta]');
    if (ctaEl && upgradePrompt) {
      ctaEl.textContent = upgradePrompt.ctaText;
      
      // Set data attribute for product type (for Stripe integration)
      ctaEl.setAttribute('data-product-type', upgradePrompt.to);
    }
    
    console.log('✅ Upgrade prompt displayed:', upgradePrompt);
  }
  
  // ============================================================================
  // PROFILE UPDATES
  // ============================================================================
  
  /**
   * Update first name
   */
  async updateFirstName(sourceButton) {
    // Find the INPUT element specifically (not display elements)
    let firstNameInput = document.querySelector('input[data-profile-first-name], textarea[data-profile-first-name]');
    
    // Find the update button
    const updateButton = sourceButton || document.querySelector('[data-update-first-name]');
    
    // Fallback: try to find a nearby input next to the triggering button
    if (!firstNameInput && sourceButton && sourceButton.closest) {
      const scope = sourceButton.closest('form, section, .form-group, .w-form, div') || document;
      firstNameInput = scope.querySelector('input[data-profile-first-name], input[type="text"], input');
    }
    
    if (!firstNameInput) {
      console.error('First name input not found');
      return;
    }
    
    const newFirstName = firstNameInput.value.trim();
    
    if (!newFirstName) {
      this.showError('First name cannot be empty');
      return;
    }
    
    if (newFirstName === this.user.firstName) {
      this.showMessage('No changes to save');
      return;
    }
    
    try {
      this.isUpdating = true;
      
      // Add spinner to button
      if (updateButton) {
        this.setButtonLoading(updateButton, true);
      }
      
      // Always use a fresh token
      let idToken = await window.timBurtonAuth.getIdToken(true);

      // Request function (allows retry on 401)
      const sendUpdate = async (token) => {
        return fetch(`${this.apiBaseUrl}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ firstName: newFirstName })
        });
      };

      let response = await sendUpdate(idToken);

      // If unauthorized, refresh token and retry once
      if (response.status === 401) {
        idToken = await window.timBurtonAuth.getIdToken(true);
        response = await sendUpdate(idToken);
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Failed to update first name (${response.status}) ${errorText}`.trim());
      }
      
      const result = await response.json();
      
      if (result.success) {
        this.user.firstName = newFirstName;
        
        // Update auth state
        window.timBurtonAuth.currentUser.firstName = newFirstName;
        
        // Show success message briefly, then refresh
        this.showMessage('First name updated! Refreshing...');
        
        // Refresh page after 1 second
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(result.error || 'Update failed');
      }
      
    } catch (error) {
      console.error('❌ Error updating first name:', error);
      this.showError('Failed to update first name. Please try again.');
      
      // Remove spinner on error
      if (updateButton) {
        this.setButtonLoading(updateButton, false);
      }
    } finally {
      this.isUpdating = false;
    }
  }
  
  /**
   * Update email
   * Uses Firebase Auth updateEmail()
   * Note: Email updates are disabled for this project - users cannot change their email
   */
  async updateEmail() {
    const emailInput = document.querySelector('[data-profile-email-input]');
    const updateButton = document.querySelector('[data-update-email]');
    
    if (!emailInput) {
      console.error('Email input not found');
      return;
    }
    
    const newEmail = emailInput.value.trim();
    
    if (!newEmail) {
      this.showError('Email cannot be empty');
      return;
    }
    
    if (newEmail === this.user.email) {
      this.showMessage('No changes to save');
      return;
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      this.showError('Invalid email format');
      return;
    }
    
    // Show message that email updates are not supported
    this.showError('Email updates are not available. If you need to change your email, please contact support.');
    return;
    
    /* Email update functionality disabled - Firebase configuration does not allow it
    try {
      this.isUpdating = true;
      
      // Add spinner to button
      if (updateButton) {
        this.setButtonLoading(updateButton, true);
      }
      
      const firebaseUser = window.timBurtonAuth.firebaseAuth.currentUser;
      
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }
      
      // Update email in Firebase Auth
      await firebaseUser.updateEmail(newEmail);
      
      // Send email verification
      await firebaseUser.sendEmailVerification();
      
      this.user.email = newEmail;
      
      // Update auth state
      window.timBurtonAuth.currentUser.email = newEmail;
      
      // Show success message briefly, then refresh
      this.showMessage('Email updated! Refreshing...');
      
      // Refresh page after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error updating email:', error);
      
      let errorMessage = 'Failed to update email. Please try again.';
      
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'For security, please sign out and sign in again before changing your email.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use by another account.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email updates are currently disabled. Please contact support.';
      }
      
      this.showError(errorMessage);
      
      // Remove spinner on error
      if (updateButton) {
        this.setButtonLoading(updateButton, false);
      }
    } finally {
      this.isUpdating = false;
    }
    */
  }
  
  /**
   * Update password
   * Uses Firebase Auth updatePassword()
   */
  async updatePassword() {
    const currentPasswordInput = document.querySelector('[data-current-password]');
    const newPasswordInput = document.querySelector('[data-new-password]');
    const confirmPasswordInput = document.querySelector('[data-confirm-password]');
    const updateButton = document.querySelector('[data-update-password]');
    
    if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput) {
      console.error('Password fields not found');
      return;
    }
    
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      this.showError('All password fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      this.showError('New passwords do not match');
      return;
    }
    
    if (newPassword === currentPassword) {
      this.showError('New password must be different from current password');
      return;
    }
    
    // Validate password strength (same as signup)
    const passwordValidation = window.timBurtonAuth.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      this.showError(passwordValidation.errors.join('. '));
      return;
    }
    
    try {
      this.isUpdating = true;
      
      // Add spinner to button
      if (updateButton) {
        this.setButtonLoading(updateButton, true);
      }
      
      const firebaseUser = window.timBurtonAuth.firebaseAuth.currentUser;
      
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error('User not authenticated');
      }
      
      // Re-authenticate user with current password
      const credential = firebase.auth.EmailAuthProvider.credential(
        firebaseUser.email,
        currentPassword
      );
      
      await firebaseUser.reauthenticateWithCredential(credential);
      
      // Update password
      await firebaseUser.updatePassword(newPassword);
      
      // Clear password fields
      currentPasswordInput.value = '';
      newPasswordInput.value = '';
      confirmPasswordInput.value = '';
      
      // Show success message briefly, then refresh
      this.showMessage('Password updated! Refreshing...');
      
      // Refresh page after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error updating password:', error);
      
      let errorMessage = 'Failed to update password. Please try again.';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password must be at least 8 characters and include uppercase, lowercase, and a number.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'For security, please sign out and sign in again before changing your password.';
      }
      
      this.showError(errorMessage);
      
      // Remove spinner on error
      if (updateButton) {
        this.setButtonLoading(updateButton, false);
      }
    } finally {
      this.isUpdating = false;
    }
  }
  
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  /**
   * Attach event handlers to update buttons
   * Automatically called during initialization
   */
  attachEventHandlers() {
    // Update First Name Button
    const updateFirstNameBtn = document.querySelector('[data-update-first-name]');
    if (updateFirstNameBtn) {
      updateFirstNameBtn.addEventListener('click', () => {
        this.updateFirstName(updateFirstNameBtn);
      });
      console.log('✅ First name update handler attached');
    }
    
    // First name input: update on blur/Enter as a UX enhancement
    const firstNameInput = document.querySelector('input[data-profile-first-name], textarea[data-profile-first-name]');
    if (firstNameInput) {
      // Blur
      firstNameInput.addEventListener('blur', () => {
        const value = (firstNameInput.value || '').trim();
        if (value && value !== (this.user.firstName || '')) {
          this.updateFirstName(updateFirstNameBtn || firstNameInput);
        }
      });
      // Enter key
      firstNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const value = (firstNameInput.value || '').trim();
          if (value && value !== (this.user.firstName || '')) {
            this.updateFirstName(updateFirstNameBtn || firstNameInput);
          }
        }
      });
    }
    
    // Update Email Button
    const updateEmailBtn = document.querySelector('[data-update-email]');
    if (updateEmailBtn) {
      updateEmailBtn.addEventListener('click', () => {
        this.updateEmail();
      });
      console.log('✅ Email update handler attached');
    }
    
    // Update Password Button
    const updatePasswordBtn = document.querySelector('[data-update-password]');
    if (updatePasswordBtn) {
      updatePasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.updatePassword();
      });
      console.log('✅ Password update handler attached');
    }
  }
  
  // ============================================================================
  // UI HELPERS
  // ============================================================================
  
  /**
   * Set button loading state with spinner
   */
  setButtonLoading(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
      // Store original text
      button.dataset.originalText = button.textContent;
      
      // Add spinner and disable
      button.disabled = true;
      button.classList.add('tb-loading');
      
      // Add spinner HTML if not already present
      if (!button.querySelector('.tb-spinner')) {
        const spinner = document.createElement('span');
        spinner.className = 'tb-spinner';
        button.prepend(spinner);
        button.prepend(document.createTextNode(' '));
      }
    } else {
      // Remove spinner and restore
      button.disabled = false;
      button.classList.remove('tb-loading');
      
      // Remove spinner
      const spinner = button.querySelector('.tb-spinner');
      if (spinner) {
        spinner.remove();
        // Remove the space text node if it exists
        if (button.firstChild && button.firstChild.nodeType === 3 && button.firstChild.textContent.trim() === '') {
          button.firstChild.remove();
        }
      }
      
      // Restore original text
      if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
        delete button.dataset.originalText;
      }
    }
  }
  
  showLoadingState(message = 'Loading...') {
    const loader = document.querySelector('[data-account-loading]');
    if (loader) {
      loader.textContent = message;
      loader.style.display = 'block';
    }
  }
  
  hideLoadingState() {
    const loader = document.querySelector('[data-account-loading]');
    if (loader) {
      loader.style.display = 'none';
    }
  }
  
  showMessage(message) {
    const messageEl = document.querySelector('[data-account-success]');
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.style.display = 'block';
      
      // Hide after 5 seconds
      setTimeout(() => {
        messageEl.style.display = 'none';
      }, 5000);
    } else {
      // Fallback: log to console if no UI element
      console.log('✅ Success:', message);
    }
  }
  
  showError(message) {
    const errorEl = document.querySelector('[data-account-error]');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
      
      // Hide after 5 seconds
      setTimeout(() => {
        errorEl.style.display = 'none';
      }, 5000);
    } else {
      // Fallback: log to console if no UI element
      console.error('❌ Error:', message);
    }
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize account page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.accountPageManager = new AccountPageManager();
});

// Make available globally
window.AccountPageManager = AccountPageManager;

