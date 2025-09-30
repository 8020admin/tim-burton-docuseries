/**
 * Payments Module
 * Handles Stripe payment processing
 */

class PaymentManager {
  constructor(app) {
    this.app = app;
    this.stripe = null;
    this.elements = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Stripe
   */
  async initialize() {
    try {
      // Load Stripe.js
      if (!window.Stripe) {
        await this.loadStripeScript();
      }

      // Initialize Stripe
      this.stripe = window.Stripe(this.app.config.stripe.publishableKey);
      
      this.isInitialized = true;
      console.log('💳 Stripe initialized');
      
    } catch (error) {
      console.error('❌ Stripe initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load Stripe script dynamically
   */
  async loadStripeScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(priceId, userId) {
    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.app.authManager.getUserToken()}`
        },
        body: JSON.stringify({
          priceId: priceId,
          userId: userId
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      return data;
      
    } catch (error) {
      console.error('❌ Failed to create payment intent:', error);
      throw error;
    }
  }

  /**
   * Process payment for rental
   */
  async processRentalPayment() {
    try {
      if (!this.isInitialized) {
        throw new Error('Payment system not initialized');
      }

      const priceId = this.app.config.stripe.priceIds.rental;
      const userId = this.app.user.uid;

      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(priceId, userId);

      // Confirm payment
      const result = await this.stripe.confirmPayment({
        elements: this.elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?type=rental`
        }
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      console.log('✅ Rental payment successful');
      return result;

    } catch (error) {
      console.error('❌ Rental payment failed:', error);
      this.app.handlePaymentError(error);
      throw error;
    }
  }

  /**
   * Process payment for regular purchase
   */
  async processRegularPayment() {
    try {
      if (!this.isInitialized) {
        throw new Error('Payment system not initialized');
      }

      const priceId = this.app.config.stripe.priceIds.regular;
      const userId = this.app.user.uid;

      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(priceId, userId);

      // Confirm payment
      const result = await this.stripe.confirmPayment({
        elements: this.elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?type=regular`
        }
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      console.log('✅ Regular payment successful');
      return result;

    } catch (error) {
      console.error('❌ Regular payment failed:', error);
      this.app.handlePaymentError(error);
      throw error;
    }
  }

  /**
   * Process payment for box set
   */
  async processBoxSetPayment() {
    try {
      if (!this.isInitialized) {
        throw new Error('Payment system not initialized');
      }

      const priceId = this.app.config.stripe.priceIds.boxSet;
      const userId = this.app.user.uid;

      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(priceId, userId);

      // Confirm payment
      const result = await this.stripe.confirmPayment({
        elements: this.elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?type=boxset`
        }
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      console.log('✅ Box set payment successful');
      return result;

    } catch (error) {
      console.error('❌ Box set payment failed:', error);
      this.app.handlePaymentError(error);
      throw error;
    }
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(userId) {
    try {
      const response = await fetch(`/api/payments/history/${userId}`, {
        headers: {
          'Authorization': `Bearer ${await this.app.authManager.getUserToken()}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get payment history');
      }

      return data.payments;

    } catch (error) {
      console.error('❌ Failed to get payment history:', error);
      throw error;
    }
  }

  /**
   * Get receipt download URL
   */
  async getReceiptUrl(paymentId) {
    try {
      const response = await fetch(`/api/payments/receipt/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${await this.app.authManager.getUserToken()}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get receipt URL');
      }

      return data.receiptUrl;

    } catch (error) {
      console.error('❌ Failed to get receipt URL:', error);
      throw error;
    }
  }

  /**
   * Validate payment before content access
   */
  async validatePayment(userId, contentType) {
    try {
      const response = await fetch(`/api/payments/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.app.authManager.getUserToken()}`
        },
        body: JSON.stringify({
          userId: userId,
          contentType: contentType
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Payment validation failed');
      }

      return data.valid;

    } catch (error) {
      console.error('❌ Payment validation failed:', error);
      throw error;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PaymentManager;
} else {
  window.PaymentManager = PaymentManager;
}
