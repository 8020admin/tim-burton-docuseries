"use strict";
/**
 * Stripe Integration for Tim Burton Docuseries
 * Handles payment processing, checkout sessions, and webhooks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWebhookSignature = exports.createStripeProducts = exports.getUserPurchaseStatus = exports.handleSuccessfulPayment = exports.createCheckoutSession = exports.canUserPurchase = void 0;
const admin = require("firebase-admin");
const stripe_1 = require("stripe");
// Initialize Stripe
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});
// Stripe Product IDs (created in Stripe Dashboard)
const STRIPE_PRODUCTS = {
    rental: {
        productId: 'prod_TC4QfwGl48nNV0',
        priceId: 'price_1SFgHU2YdOc8xn437spJce8c',
        name: 'Tim Burton Docuseries - Rental',
        description: '4-day access to all 4 episodes',
        duration: 4, // days
    },
    regular: {
        productId: 'prod_TC2n3CqFP5Cct9',
        priceId: 'price_1SFehl2YdOc8xn43KaRTMc9s',
        name: 'Tim Burton Docuseries - Regular Purchase',
        description: 'Permanent access to 4 episodes',
        duration: null, // permanent
    },
    boxset: {
        productId: 'prod_TC4PDyQhTgSNYe',
        priceId: 'price_1SFgH02YdOc8xn43d7DYb2Rl',
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
        price: 1499,
        type: 'rental',
        duration: STRIPE_PRODUCTS.rental.duration,
    },
    regular: {
        name: STRIPE_PRODUCTS.regular.name,
        description: STRIPE_PRODUCTS.regular.description,
        price: 2499,
        type: 'regular',
        duration: STRIPE_PRODUCTS.regular.duration,
    },
    boxset: {
        name: STRIPE_PRODUCTS.boxset.name,
        description: STRIPE_PRODUCTS.boxset.description,
        price: 7499,
        type: 'boxset',
        duration: STRIPE_PRODUCTS.boxset.duration,
    },
};
/**
 * Validate if user can purchase a product
 */
async function canUserPurchase(userId, productType) {
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
    }
    catch (error) {
        console.error('Error validating purchase:', error);
        // On error, default to allowing purchase to avoid blocking legitimate users
        return {
            allowed: true,
            reason: null
        };
    }
}
exports.canUserPurchase = canUserPurchase;
/**
 * Create Stripe checkout session
 */
async function createCheckoutSession(userId, productType, successUrl, cancelUrl) {
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
                    price: product.priceId,
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
    }
    catch (error) {
        console.error('Error creating checkout session:', error);
        return {
            success: false,
            error: 'Failed to create checkout session',
        };
    }
}
exports.createCheckoutSession = createCheckoutSession;
/**
 * Handle successful payment
 */
async function handleSuccessfulPayment(sessionId) {
    var _a, _b;
    try {
        // Retrieve the session
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status !== 'paid') {
            throw new Error('Payment not completed');
        }
        const userId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.userId;
        const productType = (_b = session.metadata) === null || _b === void 0 ? void 0 : _b.productType;
        if (!userId || !productType) {
            throw new Error('Missing required metadata');
        }
        // Create purchase record
        const purchaseData = {
            userId: userId,
            productType: productType,
            stripeSessionId: sessionId,
            stripePaymentIntentId: session.payment_intent,
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
    }
    catch (error) {
        console.error('Error handling successful payment:', error);
        return {
            success: false,
            error: 'Failed to process payment',
        };
    }
}
exports.handleSuccessfulPayment = handleSuccessfulPayment;
/**
 * Get user's purchase status
 */
async function getUserPurchaseStatus(userId) {
    var _a;
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
            expiresAt: ((_a = latestPurchase.expiresAt) === null || _a === void 0 ? void 0 : _a.toDate()) || null,
        };
    }
    catch (error) {
        console.error('Error getting user purchase status:', error);
        return {
            hasAccess: false,
            type: null,
            expiresAt: null,
        };
    }
}
exports.getUserPurchaseStatus = getUserPurchaseStatus;
/**
 * Update user's purchase status in their profile
 */
async function updateUserPurchaseStatus(userId, productType) {
    try {
        const userRef = admin.firestore().collection('users').doc(userId);
        await userRef.update({
            purchaseStatus: {
                hasAccess: true,
                type: productType,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            },
        });
    }
    catch (error) {
        console.error('Error updating user purchase status:', error);
    }
}
/**
 * Get or create Stripe customer for user
 */
async function getOrCreateStripeCustomer(userId) {
    try {
        // First, check if user already has a Stripe customer ID stored
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (userData === null || userData === void 0 ? void 0 : userData.stripeCustomerId) {
            console.log(`✅ Found existing Stripe customer for user ${userId}: ${userData.stripeCustomerId}`);
            return userData.stripeCustomerId;
        }
        // Get user details for customer creation
        const email = userData === null || userData === void 0 ? void 0 : userData.email;
        const firstName = (userData === null || userData === void 0 ? void 0 : userData.firstName) || '';
        const lastName = (userData === null || userData === void 0 ? void 0 : userData.lastName) || '';
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
    }
    catch (error) {
        console.error(`❌ Error getting/creating Stripe customer for user ${userId}:`, error);
        throw error;
    }
}
/**
 * Get user email for Stripe checkout (legacy function - keeping for compatibility)
 */
async function getUserEmail(userId) {
    var _a;
    try {
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        return (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.email;
    }
    catch (error) {
        console.error('Error getting user email:', error);
        return undefined;
    }
}
/**
 * Create Stripe products and prices (run once to set up)
 */
async function createStripeProducts() {
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
            unit_amount: 1499,
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
            unit_amount: 2499,
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
            unit_amount: 7499,
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
    }
    catch (error) {
        console.error('❌ Error creating Stripe products:', error);
        return {
            success: false,
            error: 'Failed to create Stripe products'
        };
    }
}
exports.createStripeProducts = createStripeProducts;
/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload, signature) {
    var _a;
    try {
        // Try environment variable first, then Firebase config
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ||
            ((_a = require('firebase-functions').config().stripe) === null || _a === void 0 ? void 0 : _a.webhook_secret);
        if (!webhookSecret) {
            console.error('Webhook secret not configured in environment or Firebase config');
            throw new Error('Webhook secret not configured');
        }
        // Convert Buffer to string if needed
        const payloadString = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload;
        const event = stripe.webhooks.constructEvent(payloadString, signature, webhookSecret);
        console.log('Webhook signature verified successfully for event:', event.type);
        return true;
    }
    catch (error) {
        console.error('Webhook signature verification failed:', error);
        return false;
    }
}
exports.verifyWebhookSignature = verifyWebhookSignature;
//# sourceMappingURL=stripe.js.map