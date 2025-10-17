"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.checkRentalExpirations = exports.api = void 0;
// Load environment variables from .env file
const dotenv = require("dotenv");
dotenv.config();
const admin = require("firebase-admin");
const cors = require("cors");
const express = require("express");
const logger_1 = require("./logger");
const validation_1 = require("./validation");
// Initialize Firebase Admin with default credentials
// When deployed to Firebase, it will automatically use the correct credentials
admin.initializeApp();
const app = express();
// Configure CORS to allow Cloudflare Pages and Webflow domains
const allowedOrigins = [
    'https://tim-burton-docuseries.pages.dev',
    'https://timburton-dev.webflow.io',
    'https://tim-burton-docuseries-26d403.webflow.io',
    'http://localhost:8000',
    'http://localhost:8001'
];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
// Rate limiting for API endpoints
const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        error: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Apply rate limiting to API routes
app.use('/api', apiLimiter);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
    });
});
// Import route handlers
const auth_1 = require("./auth");
const payments_1 = require("./payments");
const content_1 = require("./content");
const users_1 = require("./users");
const password_reset_1 = require("./password-reset");
// Mount routes
app.use('/auth', auth_1.authRoutes);
app.use('/auth', password_reset_1.passwordResetRoutes); // Mount password reset under /auth
app.use('/payments', payments_1.paymentRoutes);
app.use('/content', content_1.contentRoutes);
app.use('/users', users_1.userRoutes);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Simple webhook test endpoint (bypass all existing code)
app.post('/webhook-test', express.raw({ type: 'application/json' }), (req, res) => {
    console.log('=== SIMPLE WEBHOOK TEST ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', req.body ? req.body.toString() : 'No body');
    res.json({
        success: true,
        message: 'Simple webhook test successful',
        timestamp: new Date().toISOString()
    });
});
// Alternative webhook endpoint
app.post('/stripe-webhook', express.raw({ type: 'application/json' }), (req, res) => {
    console.log('=== STRIPE WEBHOOK ALTERNATIVE ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', req.body ? req.body.toString() : 'No body');
    res.json({
        success: true,
        message: 'Stripe webhook received',
        timestamp: new Date().toISOString()
    });
});
// Simple webhook endpoint for testing
app.post('/webhook-simple', (req, res) => {
    console.log('=== SIMPLE WEBHOOK ENDPOINT ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    res.json({
        success: true,
        message: 'Simple webhook endpoint reached',
        timestamp: new Date().toISOString()
    });
});
// Stripe webhook handler - direct implementation
app.post('/stripe-webhook', express.raw({ type: 'application/json' }), (req, res) => {
    console.log('=== STRIPE WEBHOOK DIRECT ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', req.body ? req.body.toString() : 'No body');
    try {
        // Parse the webhook event
        const event = JSON.parse(req.body.toString());
        console.log('Event type:', event.type);
        console.log('Event ID:', event.id);
        // Handle checkout.session.completed
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            console.log('Checkout session completed:', session.id);
            console.log('Customer email:', session.customer_email);
            console.log('Metadata:', session.metadata);
            // Here you would normally save to Firestore
            // For now, just log success
            console.log('Purchase processed successfully');
        }
        res.json({
            success: true,
            message: 'Webhook processed successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Webhook processing error:', error);
        res.status(400).json({
            success: false,
            error: 'Webhook processing failed',
            details: error.message
        });
    }
});
// Export the Express app as a Firebase Function
exports.api = require('firebase-functions').https.onRequest(app);
// Export scheduled tasks
var scheduled_tasks_1 = require("./scheduled-tasks");
Object.defineProperty(exports, "checkRentalExpirations", { enumerable: true, get: function () { return scheduled_tasks_1.checkRentalExpirations; } });
// Production Stripe webhook function
exports.stripeWebhook = require('firebase-functions').https.onRequest(async (req, res) => {
    var _a, _b;
    const startTime = Date.now();
    logger_1.logger.info('Stripe webhook received', {
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip
    });
    if (req.method !== 'POST') {
        logger_1.logger.warn('Invalid HTTP method for webhook', { method: req.method });
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }
    try {
        const signature = req.headers['stripe-signature'];
        const payload = req.rawBody || req.body;
        if (!signature) {
            logger_1.logger.logSecurityEvent('Missing Stripe signature', 'high', { ip: req.ip });
            return res.status(400).json({
                success: false,
                error: 'Missing Stripe signature'
            });
        }
        // Verify webhook signature
        logger_1.logger.debug('Verifying webhook signature');
        const { verifyWebhookSignature } = require('./stripe');
        if (!verifyWebhookSignature(payload, signature)) {
            logger_1.logger.logSecurityEvent('Invalid webhook signature', 'critical', {
                ip: req.ip,
                signature: signature.substring(0, 20) + '...'
            });
            return res.status(400).json({
                success: false,
                error: 'Invalid webhook signature'
            });
        }
        logger_1.logger.debug('Webhook signature verified successfully');
        const event = JSON.parse(payload.toString());
        logger_1.logger.info('Webhook event received', {
            eventType: event.type,
            eventId: event.id
        });
        // Validate webhook payload
        const validation = (0, validation_1.validateStripeWebhook)(event);
        if (!validation.isValid) {
            logger_1.logger.logSecurityEvent('Invalid webhook payload', 'high', {
                eventId: event.id,
                errors: validation.errors
            });
            return res.status(400).json({
                success: false,
                error: 'Invalid webhook payload',
                details: validation.errors
            });
        }
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            logger_1.logger.info('Processing checkout session', {
                sessionId: session.id,
                customerId: session.customer,
                customerEmail: (0, validation_1.sanitizeString)(session.customer_email || ''),
                amount: session.amount_total,
                currency: session.currency
            });
            // Get user ID from metadata
            const userId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                logger_1.logger.logSecurityEvent('Missing userId in session metadata', 'high', {
                    sessionId: session.id,
                    metadata: session.metadata
                });
                return res.status(400).json({
                    success: false,
                    error: 'Missing userId in session metadata'
                });
            }
            // Validate user ID
            const { validateUserId } = require('./validation');
            const userIdValidation = validateUserId(userId);
            if (!userIdValidation.isValid) {
                logger_1.logger.logSecurityEvent('Invalid userId in session metadata', 'high', {
                    sessionId: session.id,
                    userId,
                    errors: userIdValidation.errors
                });
                return res.status(400).json({
                    success: false,
                    error: 'Invalid userId in session metadata',
                    details: userIdValidation.errors
                });
            }
            // Process payment using the unified handler from stripe.ts
            logger_1.logger.debug('Processing payment with unified handler', { sessionId: session.id });
            const { handleSuccessfulPayment } = require('./stripe');
            const result = await handleSuccessfulPayment(session.id);
            if (!result.success) {
                logger_1.logger.logError(new Error(result.error || 'Payment processing failed'), 'payment_processing', {
                    sessionId: session.id,
                    userId
                });
                return res.status(500).json({
                    success: false,
                    error: result.error || 'Payment processing failed'
                });
            }
            logger_1.logger.logPurchase(userId, session.id, session.amount_total, session.currency);
            logger_1.logger.info('Payment processed successfully with unified handler', {
                userId,
                sessionId: session.id,
                productType: (_b = session.metadata) === null || _b === void 0 ? void 0 : _b.productType
            });
            const processingTime = Date.now() - startTime;
            logger_1.logger.logWebhookEvent(event.type, event.id, true, processingTime);
            res.json({
                success: true,
                message: 'Purchase processed successfully',
                purchaseId: session.id,
                timestamp: new Date().toISOString()
            });
        }
        else {
            logger_1.logger.info('Unhandled event type received', { eventType: event.type });
            res.json({
                success: true,
                message: 'Event received but not processed',
                eventType: event.type,
                timestamp: new Date().toISOString()
            });
        }
    }
    catch (error) {
        logger_1.logger.logError(error, 'webhook_processing', {
            eventId: (event === null || event === void 0 ? void 0 : event.id) || 'unknown',
            processingTime: Date.now() - startTime
        });
        // Send error response
        res.status(500).json({
            success: false,
            error: 'Webhook processing failed',
            timestamp: new Date().toISOString()
        });
    }
});
//# sourceMappingURL=index.js.map