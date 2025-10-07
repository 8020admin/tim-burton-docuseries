/**
 * Stripe Integration for Tim Burton Docuseries
 * Handles payment processing, checkout sessions, and webhooks
 */

import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Stripe Product IDs (created in Stripe Dashboard)
const STRIPE_PRODUCTS = {
  rental: {
    productId: 'prod_TC4QfwGl48nNV0', // Tim Burton Docuseries - Rental
    priceId: 'price_1SFgHU2YdOc8xn437spJce8c', // $14.99 rental
    name: 'Tim Burton Docuseries - Rental',
    description: '4-day access to all 4 episodes',
    duration: 4, // days
  },
  regular: {
    productId: 'prod_TC2n3CqFP5Cct9', // Tim Burton Docuseries - Regular
    priceId: 'price_1SFehl2YdOc8xn43KaRTMc9s', // $24.99 regular
    name: 'Tim Burton Docuseries - Regular Purchase',
    description: 'Permanent access to 4 episodes',
    duration: null, // permanent
  },
  boxset: {
    productId: 'prod_TC4PDyQhTgSNYe', // Tim Burton Docuseries - Box Set
    priceId: 'price_1SFgH02YdOc8xn43d7DYb2Rl', // $74.99 box set
    name: 'Tim Burton Docuseries - Box Set',
    description: '4 episodes + 40 hours of bonus content',
    duration: null, // permanent
  },
};

// Legacy product configurations for backward compatibility
const PRODUCTS = {
  rental: {
    name: STRIPE_PRODUCTS.rental.name,
    description: STRIPE_PRODUCTS.rental.description,
    price: 1499, // $14.99 in cents (updated from $9.99)
    type: 'rental' as const,
    duration: STRIPE_PRODUCTS.rental.duration,
  },
  regular: {
    name: STRIPE_PRODUCTS.regular.name,
    description: STRIPE_PRODUCTS.regular.description,
    price: 2499, // $24.99 in cents
    type: 'regular' as const,
    duration: STRIPE_PRODUCTS.regular.duration,
  },
  boxset: {
    name: STRIPE_PRODUCTS.boxset.name,
    description: STRIPE_PRODUCTS.boxset.description,
    price: 7499, // $74.99 in cents
    type: 'boxset' as const,
    duration: STRIPE_PRODUCTS.boxset.duration,
  },
};

/**
 * Validate if user can purchase a product
 */
export async function canUserPurchase(userId: string, productType: 'rental' | 'regular' | 'boxset') {
  try {
    const purchaseStatus = await getUserPurchaseStatus(userId);
    
    // No existing purchase - can buy anything
    if (!purchaseStatus.hasAccess && purchaseStatus.type !== 'expired') {
      return {
        allowed: true,
        reason: null
      };
    }
    
    // Has expired rental - can buy anything
    if (purchaseStatus.type === 'expired') {
      return {
        allowed: true,
        reason: null
      };
    }
    
    const currentType = purchaseStatus.type;
    
    // Box Set owners can't buy anything (they have everything)
    if (currentType === 'boxset') {
      return {
        allowed: false,
        reason: 'You already own the Box Set, which includes all content.'
      };
    }
    
    // Regular owners
    if (currentType === 'regular') {
      if (productType === 'rental') {
        return {
          allowed: false,
          reason: 'You already have permanent access. A rental is not needed.'
        };
      }
      if (productType === 'regular') {
        return {
          allowed: false,
          reason: 'You already own the Regular Purchase.'
        };
      }
      if (productType === 'boxset') {
        return {
          allowed: true,
          reason: null // Upgrade to Box Set allowed
        };
      }
    }
    
    // Active rental owners
    if (currentType === 'rental') {
      if (productType === 'rental') {
        return {
          allowed: false,
          reason: 'You already have an active rental. It expires on ' + 
                  (purchaseStatus.expiresAt ? new Date(purchaseStatus.expiresAt).toLocaleDateString() : 'soon') + '.'
        };
      }
      // Can upgrade to Regular or Box Set
      return {
        allowed: true,
        reason: null
      };
    }
    
    // Default: allow purchase
    return {
      allowed: true,
      reason: null
    };
    
  } catch (error) {
    console.error('Error validating purchase:', error);
    // On error, default to allowing purchase to avoid blocking legitimate users
    return {
      allowed: true,
      reason: null
    };
  }
}

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(
  userId: string,
  productType: 'rental' | 'regular' | 'boxset',
  successUrl: string,
  cancelUrl: string
) {
  try {
    // Validate if user can purchase this product
    const validation = await canUserPurchase(userId, productType);
    
    if (!validation.allowed) {
      console.log(`❌ Purchase blocked for user ${userId}: ${validation.reason}`);
      return {
        success: false,
        error: validation.reason || 'You cannot purchase this product at this time.',
      };
    }
    
    const product = STRIPE_PRODUCTS[productType];
    
    // Get or create Stripe customer for this user
    const customerId = await getOrCreateStripeCustomer(userId);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: product.priceId, // Use Stripe Price ID instead of price_data
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer: customerId,
      metadata: {
        userId: userId,
        productType: productType,
        project: 'tim-burton-docuseries',
      },
    });

    console.log(`✅ Checkout session created for user ${userId} with customer ${customerId} and product ${product.priceId}`);

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      success: false,
      error: 'Failed to create checkout session',
    };
  }
}

/**
 * Handle successful payment
 */
export async function handleSuccessfulPayment(sessionId: string) {
  try {
    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    const userId = session.metadata?.userId;
    const productType = session.metadata?.productType as 'rental' | 'regular' | 'boxset';
    
    if (!userId || !productType) {
      throw new Error('Missing required metadata');
    }

    // Create purchase record
    const purchaseData = {
      userId: userId,
      productType: productType,
      stripeSessionId: sessionId,
      stripePaymentIntentId: session.payment_intent as string,
      amount: session.amount_total,
      currency: session.currency,
      status: 'completed',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: productType === 'rental' 
        ? new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) // 4 days from now
        : null,
    };

    // Save to Firestore
    await admin.firestore().collection('purchases').add(purchaseData);

    // Update user's purchase status
    await updateUserPurchaseStatus(userId, productType);

    return {
      success: true,
      purchase: purchaseData,
    };
  } catch (error) {
    console.error('Error handling successful payment:', error);
    return {
      success: false,
      error: 'Failed to process payment',
    };
  }
}

/**
 * Get user's purchase status
 */
export async function getUserPurchaseStatus(userId: string) {
  try {
    const purchases = await admin.firestore()
      .collection('purchases')
      .where('userId', '==', userId)
      .where('status', '==', 'completed')
      .orderBy('createdAt', 'desc')
      .get();

    if (purchases.empty) {
      return {
        hasAccess: false,
        type: null,
        expiresAt: null,
      };
    }

    const latestPurchase = purchases.docs[0].data();
    const now = new Date();
    
    // Check if rental has expired
    if (latestPurchase.productType === 'rental' && latestPurchase.expiresAt) {
      const expiresAt = latestPurchase.expiresAt.toDate();
      if (now > expiresAt) {
        return {
          hasAccess: false,
          type: 'expired',
          expiresAt: expiresAt,
        };
      }
    }

    return {
      hasAccess: true,
      type: latestPurchase.productType,
      expiresAt: latestPurchase.expiresAt?.toDate() || null,
    };
  } catch (error) {
    console.error('Error getting user purchase status:', error);
    return {
      hasAccess: false,
      type: null,
      expiresAt: null,
    };
  }
}

/**
 * Update user's purchase status in their profile
 */
async function updateUserPurchaseStatus(userId: string, productType: string) {
  try {
    const userRef = admin.firestore().collection('users').doc(userId);
    
    await userRef.update({
      purchaseStatus: {
        hasAccess: true,
        type: productType,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
    });
  } catch (error) {
    console.error('Error updating user purchase status:', error);
  }
}

/**
 * Get or create Stripe customer for user
 */
async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  try {
    // First, check if user already has a Stripe customer ID stored
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.stripeCustomerId) {
      console.log(`✅ Found existing Stripe customer for user ${userId}: ${userData.stripeCustomerId}`);
      return userData.stripeCustomerId;
    }
    
    // Get user details for customer creation
    const email = userData?.email;
    const firstName = userData?.firstName || '';
    const lastName = userData?.lastName || '';
    
    if (!email) {
      throw new Error(`No email found for user ${userId}`);
    }
    
    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: email,
      name: `${firstName} ${lastName}`.trim() || email.split('@')[0],
      metadata: {
        userId: userId,
        project: 'tim-burton-docuseries',
        // Add unique identifier to prevent consolidation
        uniqueId: `${userId}-${Date.now()}`
      }
    });
    
    console.log(`✅ Created new Stripe customer for user ${userId}: ${customer.id}`);
    
    // Store the Stripe customer ID in Firestore
    await admin.firestore().collection('users').doc(userId).update({
      stripeCustomerId: customer.id,
      stripeCustomerCreatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return customer.id;
    
  } catch (error) {
    console.error(`❌ Error getting/creating Stripe customer for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get user email for Stripe checkout (legacy function - keeping for compatibility)
 */
async function getUserEmail(userId: string): Promise<string | undefined> {
  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    return userDoc.data()?.email;
  } catch (error) {
    console.error('Error getting user email:', error);
    return undefined;
  }
}

/**
 * Create Stripe products and prices (run once to set up)
 */
export async function createStripeProducts() {
  try {
    console.log('🛠️ Creating Stripe products...');
    
    const products = [];
    
    // Create Rental Product
    const rentalProduct = await stripe.products.create({
      name: 'Tim Burton Docuseries - Rental',
      description: '4-day access to all 4 episodes',
      metadata: {
        type: 'rental',
        duration_days: '4'
      }
    });
    
    const rentalPrice = await stripe.prices.create({
      product: rentalProduct.id,
      unit_amount: 1499, // $14.99
      currency: 'usd',
      metadata: {
        product_type: 'rental'
      }
    });
    
    products.push({
      type: 'rental',
      productId: rentalProduct.id,
      priceId: rentalPrice.id,
      name: rentalProduct.name
    });
    
    // Create Regular Product
    const regularProduct = await stripe.products.create({
      name: 'Tim Burton Docuseries - Regular Purchase',
      description: 'Permanent access to 4 episodes',
      metadata: {
        type: 'regular',
        duration: 'permanent'
      }
    });
    
    const regularPrice = await stripe.prices.create({
      product: regularProduct.id,
      unit_amount: 2499, // $24.99
      currency: 'usd',
      metadata: {
        product_type: 'regular'
      }
    });
    
    products.push({
      type: 'regular',
      productId: regularProduct.id,
      priceId: regularPrice.id,
      name: regularProduct.name
    });
    
    // Create Box Set Product
    const boxsetProduct = await stripe.products.create({
      name: 'Tim Burton Docuseries - Box Set',
      description: '4 episodes + 40 hours of bonus content',
      metadata: {
        type: 'boxset',
        duration: 'permanent'
      }
    });
    
    const boxsetPrice = await stripe.prices.create({
      product: boxsetProduct.id,
      unit_amount: 7499, // $74.99
      currency: 'usd',
      metadata: {
        product_type: 'boxset'
      }
    });
    
    products.push({
      type: 'boxset',
      productId: boxsetProduct.id,
      priceId: boxsetPrice.id,
      name: boxsetProduct.name
    });
    
    console.log('✅ Stripe products created successfully:');
    products.forEach(p => {
      console.log(`  ${p.type}: ${p.name}`);
      console.log(`    Product ID: ${p.productId}`);
      console.log(`    Price ID: ${p.priceId}`);
    });
    
    return {
      success: true,
      products: products
    };
    
  } catch (error) {
    console.error('❌ Error creating Stripe products:', error);
    return {
      success: false,
      error: 'Failed to create Stripe products'
    };
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
  try {
    // Try environment variable first, then Firebase config
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 
                         require('firebase-functions').config().stripe?.webhook_secret;
    
    if (!webhookSecret) {
      console.error('Webhook secret not configured in environment or Firebase config');
      throw new Error('Webhook secret not configured');
    }

    // Convert Buffer to string if needed
    const payloadString = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload;

    const event = stripe.webhooks.constructEvent(payloadString, signature, webhookSecret);
    console.log('Webhook signature verified successfully for event:', event.type);
    return true;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}
