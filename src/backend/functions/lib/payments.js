"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();
exports.paymentRoutes = router;
// Create payment intent
router.post('/create-intent', async (req, res) => {
    try {
        const { priceId } = req.body;
        // This would integrate with Stripe
        // For now, return a mock response
        res.json({
            success: true,
            paymentIntent: {
                id: 'pi_mock_' + Date.now(),
                clientSecret: 'pi_mock_client_secret',
                status: 'requires_payment_method'
            }
        });
    }
    catch (error) {
        console.error('Payment intent creation error:', error);
        res.status(400).json({
            success: false,
            error: 'Payment intent creation failed'
        });
    }
});
// Confirm payment
router.post('/confirm', async (req, res) => {
    try {
        const { paymentIntentId } = req.body;
        // This would confirm the payment with Stripe
        // For now, return a mock success response
        res.json({
            success: true,
            payment: {
                id: paymentIntentId,
                status: 'succeeded',
                amount: 1499,
                currency: 'usd'
            }
        });
    }
    catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(400).json({
            success: false,
            error: 'Payment confirmation failed'
        });
    }
});
// Get payment history
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // Get payment history from Firestore
        const payments = await admin.firestore()
            .collection('payments')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();
        const paymentList = payments.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json({
            success: true,
            payments: paymentList
        });
    }
    catch (error) {
        console.error('Payment history error:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to get payment history'
        });
    }
});
// Get receipt URL
router.get('/receipt/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        // This would generate a receipt URL from Stripe
        // For now, return a mock URL
        res.json({
            success: true,
            receiptUrl: `https://pay.stripe.com/receipts/${paymentId}`
        });
    }
    catch (error) {
        console.error('Receipt URL error:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to get receipt URL'
        });
    }
});
//# sourceMappingURL=payments.js.map