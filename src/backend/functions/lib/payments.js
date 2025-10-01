"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
const express = require("express");
const admin = require("firebase-admin");
const stripe_1 = require("./stripe");
const router = express.Router();
exports.paymentRoutes = router;
// Create Stripe checkout session
router.post('/checkout', async (req, res) => {
    try {
        const { userId, productType, successUrl, cancelUrl } = req.body;
        if (!userId || !productType || !successUrl || !cancelUrl) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters'
            });
        }
        if (!['rental', 'regular', 'boxset'].includes(productType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product type'
            });
        }
        const result = await (0, stripe_1.createCheckoutSession)(userId, productType, successUrl, cancelUrl);
        if (result.success) {
            res.json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        console.error('Checkout session creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create checkout session'
        });
    }
});
// Get user's purchase status
router.get('/status', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Missing or invalid authorization header'
            });
        }
        const token = authHeader.split(' ')[1];
        // Verify the custom token
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        const purchaseStatus = await (0, stripe_1.getUserPurchaseStatus)(userId);
        res.json({
            success: true,
            purchaseStatus: purchaseStatus
        });
    }
    catch (error) {
        console.error('Purchase status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get purchase status'
        });
    }
});
// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.headers['stripe-signature'];
        const payload = req.body;
        // Verify webhook signature
        if (!(0, stripe_1.verifyWebhookSignature)(payload, signature)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid webhook signature'
            });
        }
        // Parse the webhook event
        const event = JSON.parse(payload.toString());
        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                const result = await (0, stripe_1.handleSuccessfulPayment)(session.id);
                if (result.success) {
                    console.log('Payment processed successfully:', result.purchase);
                }
                else {
                    console.error('Payment processing failed:', result.error);
                }
                break;
            case 'payment_intent.succeeded':
                console.log('Payment intent succeeded:', event.data.object.id);
                break;
            case 'payment_intent.payment_failed':
                console.log('Payment intent failed:', event.data.object.id);
                break;
            default:
                console.log('Unhandled event type:', event.type);
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({
            success: false,
            error: 'Webhook processing failed'
        });
    }
});
// Get purchase history
router.get('/history', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Missing or invalid authorization header'
            });
        }
        const token = authHeader.split(' ')[1];
        // Verify the custom token
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        // Get purchase history from Firestore
        const purchases = await admin.firestore()
            .collection('purchases')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();
        const purchaseList = purchases.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json({
            success: true,
            purchases: purchaseList
        });
    }
    catch (error) {
        console.error('Purchase history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get purchase history'
        });
    }
});
// Get receipt URL
router.get('/receipt/:purchaseId', async (req, res) => {
    try {
        const { purchaseId } = req.params;
        // Get purchase record
        const purchaseDoc = await admin.firestore()
            .collection('purchases')
            .doc(purchaseId)
            .get();
        if (!purchaseDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Purchase not found'
            });
        }
        const purchase = purchaseDoc.data();
        // Generate Stripe receipt URL
        const receiptUrl = `https://pay.stripe.com/receipts/${purchase === null || purchase === void 0 ? void 0 : purchase.stripeSessionId}`;
        res.json({
            success: true,
            receiptUrl: receiptUrl
        });
    }
    catch (error) {
        console.error('Receipt URL error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get receipt URL'
        });
    }
});
//# sourceMappingURL=payments.js.map