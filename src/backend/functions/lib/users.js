"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();
exports.userRoutes = router;
// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const userId = req.query.userId; // This would come from authenticated user
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID required'
            });
        }
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        res.json({
            success: true,
            user: userDoc.data()
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to get profile'
        });
    }
});
// Update user profile
router.put('/profile', async (req, res) => {
    try {
        const { userId, displayName, email } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID required'
            });
        }
        const updateData = {
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        };
        if (displayName)
            updateData.displayName = displayName;
        if (email)
            updateData.email = email;
        await admin.firestore().collection('users').doc(userId).update(updateData);
        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to update profile'
        });
    }
});
// Export user data (GDPR)
router.post('/export-data', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID required'
            });
        }
        // Get all user data
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const payments = await admin.firestore()
            .collection('payments')
            .where('userId', '==', userId)
            .get();
        const progress = await admin.firestore()
            .collection('watchProgress')
            .where('userId', '==', userId)
            .get();
        const exportData = {
            user: userDoc.data(),
            payments: payments.docs.map(doc => doc.data()),
            watchProgress: progress.docs.map(doc => doc.data()),
            exportedAt: new Date().toISOString()
        };
        res.json({
            success: true,
            data: exportData
        });
    }
    catch (error) {
        console.error('Export data error:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to export data'
        });
    }
});
// Delete user account
router.delete('/account', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID required'
            });
        }
        // Delete user data from Firestore
        await admin.firestore().collection('users').doc(userId).delete();
        // Delete payments (or anonymize)
        const payments = await admin.firestore()
            .collection('payments')
            .where('userId', '==', userId)
            .get();
        for (const payment of payments.docs) {
            await payment.ref.delete();
        }
        // Delete watch progress
        const progress = await admin.firestore()
            .collection('watchProgress')
            .where('userId', '==', userId)
            .get();
        for (const prog of progress.docs) {
            await prog.ref.delete();
        }
        // Delete from Firebase Auth
        await admin.auth().deleteUser(userId);
        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete account error:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to delete account'
        });
    }
});
//# sourceMappingURL=users.js.map