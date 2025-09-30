"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const admin = require("firebase-admin");
const cors = require("cors");
const express = require("express");
// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: (_a = process.env.FIREBASE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    })
});
const app = express();
app.use(cors({ origin: true }));
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