"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const admin = require("firebase-admin");
const cors = require("cors");
const express = require("express");
// Initialize Firebase Admin with default credentials
// When deployed to Firebase, it will automatically use the correct credentials
admin.initializeApp();
const app = express();
// Configure CORS to allow Cloudflare Pages and Webflow domains
const allowedOrigins = [
    'https://tim-burton-docuseries.pages.dev',
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
// Import route handlers
const auth_1 = require("./auth");
const payments_1 = require("./payments");
const content_1 = require("./content");
const users_1 = require("./users");
// Mount routes
app.use('/auth', auth_1.authRoutes);
app.use('/payments', payments_1.paymentRoutes);
app.use('/content', content_1.contentRoutes);
app.use('/users', users_1.userRoutes);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Export the Express app as a Firebase Function
exports.api = require('firebase-functions').https.onRequest(app);
//# sourceMappingURL=index.js.map