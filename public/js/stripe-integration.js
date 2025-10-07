/**
 * Stripe Integration for Tim Burton Docuseries
 * Handles payment processing and checkout sessions
 */

class StripeIntegration {
  constructor() {
    this.apiBaseUrl = 'https://us-central1-tim-burton-docuseries.cloudfunctions.net/api';
    this.auth = null;
    this.init();
  }

  /**
   * Initialize Stripe integration
   */
  init() {
    // Wait for auth system to be available
    if (window.timBurtonAuth) {
      this.auth = window.timBurtonAuth;
    } else {
      // Wait for auth system to load
      document.addEventListener('DOMContentLoaded', () => {
        this.auth = window.timBurtonAuth;
      });
    }
  }

  /**
   * Validate if user can purchase a product
   */
  async validatePurchase(userId, productType) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/payments/validate-purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          productType
        })
      });

      const result = await response.json();

      if (result.success) {
        return {
          allowed: result.allowed,
          reason: result.reason
        };
      } else {
        throw new Error(result.error || 'Failed to validate purchase');
      }
    } catch (error) {
      console.error('Purchase validation error:', error);
      // On error, default to allowing purchase to avoid blocking legitimate users
      return {
        allowed: true,
        reason: null
      };
    }
  }

  /**
   * Create checkout session for rental
   */
  async createRentalCheckout() {
    if (!this.auth || !this.auth.isSignedIn()) {
      throw new Error('User must be signed in to purchase');
    }

    const userId = this.auth.getCurrentUser().uid;
    
    // Validate purchase before checkout
    const validation = await this.validatePurchase(userId, 'rental');
    
    if (!validation.allowed) {
      this.showErrorMessage(validation.reason || 'You cannot purchase this product at this time.');
      throw new Error(validation.reason);
    }

    const successUrl = `${window.location.origin}/episodes?purchase=success`;
    const cancelUrl = `${window.location.origin}?purchase=cancelled`;

    return await this.createCheckoutSession(userId, 'rental', successUrl, cancelUrl);
  }

  /**
   * Create checkout session for regular purchase
   */
  async createRegularPurchaseCheckout() {
    if (!this.auth || !this.auth.isSignedIn()) {
      throw new Error('User must be signed in to purchase');
    }

    const userId = this.auth.getCurrentUser().uid;
    
    // Validate purchase before checkout
    const validation = await this.validatePurchase(userId, 'regular');
    
    if (!validation.allowed) {
      this.showErrorMessage(validation.reason || 'You cannot purchase this product at this time.');
      throw new Error(validation.reason);
    }

    const successUrl = `${window.location.origin}/episodes?purchase=success`;
    const cancelUrl = `${window.location.origin}?purchase=cancelled`;

    return await this.createCheckoutSession(userId, 'regular', successUrl, cancelUrl);
  }

  /**
   * Create checkout session for box set
   */
  async createBoxSetCheckout() {
    if (!this.auth || !this.auth.isSignedIn()) {
      throw new Error('User must be signed in to purchase');
    }

    const userId = this.auth.getCurrentUser().uid;
    
    // Validate purchase before checkout
    const validation = await this.validatePurchase(userId, 'boxset');
    
    if (!validation.allowed) {
      this.showErrorMessage(validation.reason || 'You cannot purchase this product at this time.');
      throw new Error(validation.reason);
    }

    const successUrl = `${window.location.origin}/episodes?purchase=success`;
    const cancelUrl = `${window.location.origin}?purchase=cancelled`;

    return await this.createCheckoutSession(userId, 'boxset', successUrl, cancelUrl);
  }

  /**
   * Create checkout session
   */
  async createCheckoutSession(userId, productType, successUrl, cancelUrl) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/payments/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          productType,
          successUrl,
          cancelUrl
        })
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to Stripe checkout
        window.location.href = result.url;
      } else {
        throw new Error(result.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout session creation error:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment redirect
   */
  async handlePaymentSuccess() {
    try {
      // Refresh purchase status
      if (this.auth) {
        await this.auth.fetchPurchaseStatus();
        
        // Trigger auth event to update UI
        this.auth.dispatchAuthEvent('purchaseCompleted', this.auth.getPurchaseStatus());
      }

      // Show success message
      this.showSuccessMessage('Payment successful! You now have access to the content.');
      
      // Redirect to overview page after a short delay
      setTimeout(() => {
        window.location.href = '/episodes';
      }, 2000);

    } catch (error) {
      console.error('Payment success handling error:', error);
      this.showErrorMessage('Payment was successful, but there was an error updating your account. Please refresh the page.');
    }
  }

  /**
   * Handle cancelled payment
   */
  handlePaymentCancelled() {
    this.showInfoMessage('Payment was cancelled. You can try again anytime.');
  }

  /**
   * Get purchase history
   */
  async getPurchaseHistory() {
    if (!this.auth || !this.auth.isSignedIn()) {
      throw new Error('User must be signed in to view purchase history');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/payments/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.auth.getCustomToken()}`
        }
      });

      const result = await response.json();

      if (result.success) {
        return result.purchases;
      } else {
        throw new Error(result.error || 'Failed to get purchase history');
      }
    } catch (error) {
      console.error('Purchase history error:', error);
      throw error;
    }
  }

  /**
   * Get receipt URL for a purchase
   */
  async getReceiptUrl(purchaseId) {
    if (!this.auth || !this.auth.isSignedIn()) {
      throw new Error('User must be signed in to view receipts');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/payments/receipt/${purchaseId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.auth.getCustomToken()}`
        }
      });

      const result = await response.json();

      if (result.success) {
        return result.receiptUrl;
      } else {
        throw new Error(result.error || 'Failed to get receipt URL');
      }
    } catch (error) {
      console.error('Receipt URL error:', error);
      throw error;
    }
  }

  /**
   * Show success message
   */
  showSuccessMessage(message) {
    this.showMessage(message, 'success');
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    this.showMessage(message, 'error');
  }

  /**
   * Show info message
   */
  showInfoMessage(message) {
    this.showMessage(message, 'info');
  }

  /**
   * Show message to user
   */
  showMessage(message, type = 'info') {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = `stripe-notification stripe-notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 5px;
      color: white;
      font-weight: bold;
      z-index: 10000;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    // Set background color based on type
    switch (type) {
      case 'success':
        notification.style.backgroundColor = '#28a745';
        break;
      case 'error':
        notification.style.backgroundColor = '#dc3545';
        break;
      case 'info':
        notification.style.backgroundColor = '#17a2b8';
        break;
    }

    // Add to page
    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
}

// Initialize Stripe integration
document.addEventListener('DOMContentLoaded', () => {
  window.stripeIntegration = new StripeIntegration();
  
  // Handle payment success/cancellation from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const purchase = urlParams.get('purchase');
  
  if (purchase === 'success' && window.stripeIntegration) {
    window.stripeIntegration.handlePaymentSuccess();
  } else if (purchase === 'cancelled' && window.stripeIntegration) {
    window.stripeIntegration.handlePaymentCancelled();
  }
});

// Export for use in other scripts
window.StripeIntegration = StripeIntegration;
