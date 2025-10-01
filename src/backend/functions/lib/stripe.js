"use strict";
/**
 * Stripe Integration for Tim Burton Docuseries
 * Handles payment processing, checkout sessions, and webhooks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWebhookSignature = exports.getUserPurchaseStatus = exports.handleSuccessfulPayment = exports.createCheckoutSession = void 0;
const admin = require("firebase-admin");
const stripe_1 = require("stripe");
// Initialize Stripe
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});
// Product configurations
const PRODUCTS = {
    rental: {
        name: 'Tim Burton Docuseries - Rental',
        description: '4-day access to all 4 episodes',
        price: 1499,
        type: 'rental',
        duration: 4, // days
    },
    regular: {
        name: 'Tim Burton Docuseries - Regular Purchase',
        description: 'Permanent access to 4 episodes',
        price: 2499,
        type: 'regular',
        duration: null, // permanent
    },
    boxset: {
        name: 'Tim Burton Docuseries - Box Set',
        description: '4 episodes + 40 hours of bonus content',
        price: 7499,
        type: 'boxset',
        duration: null, // permanent
    },
};
/**
 * Create Stripe checkout session
 */
async function createCheckoutSession(userId, productType, successUrl, cancelUrl) {
    try {
        const product = PRODUCTS[productType];
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: product.name,
                            description: product.description,
                        },
                        unit_amount: product.price,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                userId: userId,
                productType: productType,
                project: 'tim-burton-docuseries',
            },
            customer_email: await getUserEmail(userId),
        });
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
 * Get user email for Stripe checkout
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
 * Verify webhook signature
 */
function verifyWebhookSignature(payload, signature) {
    try {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new Error('Webhook secret not configured');
        }
        stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        return true;
    }
    catch (error) {
        console.error('Webhook signature verification failed:', error);
        return false;
    }
}
exports.verifyWebhookSignature = verifyWebhookSignature;
//# sourceMappingURL=stripe.js.map