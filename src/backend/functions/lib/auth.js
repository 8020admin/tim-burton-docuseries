"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const admin = require("firebase-admin");
const express = require("express");
const validation_1 = require("./validation");
const email_1 = require("./email");
const router = express.Router();
exports.authRoutes = router;
// Default profile pictures for new users
const DEFAULT_PROFILE_PICTURES = [
    'https://cdn.prod.website-files.com/68d6c52a4c87b02b7b6bdc18/68dd50236fd957bdf0e1066a_Avatar%206-1.avif',
    'https://cdn.prod.website-files.com/68d6c52a4c87b02b7b6bdc18/68dd5023bf5c55201a5cb12d_Avatar%204.avif',
    'https://cdn.prod.website-files.com/68d6c52a4c87b02b7b6bdc18/68dd5023895de9959c03e5fd_Avatar%205.avif',
    'https://cdn.prod.website-files.com/68d6c52a4c87b02b7b6bdc18/68dd5023f316a35fe23bed0b_Avatar%201.avif',
    'https://cdn.prod.website-files.com/68d6c52a4c87b02b7b6bdc18/68dd502305e767007486b8dd_Avatar%202.avif',
    'https://cdn.prod.website-files.com/68d6c52a4c87b02b7b6bdc18/68dd5023adee09af4d09977b_Avatar%203.avif',
    'https://cdn.prod.website-files.com/68d6c52a4c87b02b7b6bdc18/68dd5023acf6eb36a4c1e2fe_Avatar%206.avif',
    'https://cdn.prod.website-files.com/68d6c52a4c87b02b7b6bdc18/68dd502342682a91bff7b23e_Avatar%207.avif'
];
/**
 * Get a random profile picture from the default set
 */
function getRandomProfilePicture() {
    const randomIndex = Math.floor(Math.random() * DEFAULT_PROFILE_PICTURES.length);
    return DEFAULT_PROFILE_PICTURES[randomIndex];
}
/**
 * Parse display name into firstName and lastName
 */
function parseDisplayName(displayName) {
    if (!displayName) {
        return { firstName: 'User', lastName: '' };
    }
    const nameParts = displayName.trim().split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || '';
    return { firstName, lastName };
}
/**
 * UNIFIED SESSION ENDPOINT
 * This is the ONLY endpoint for authentication token verification and user sync
 * Works with both Google and Email/Password authentication
 */
router.post('/session', async (req, res) => {
    var _a;
    try {
        const { idToken, firstName: providedFirstName, lastName: providedLastName } = req.body;
        if (!idToken) {
            return res.status(400).json({
                success: false,
                error: 'ID token is required'
            });
        }
        // Verify the ID token (works for all Firebase Auth providers)
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        // Get or create user document in Firestore
        const userDoc = await admin.firestore().collection('users').doc(uid).get();
        if (!userDoc.exists) {
            // Use provided names if available, otherwise parse from token
            let firstName;
            let lastName;
            if (providedFirstName) {
                // Use explicitly provided names (from signup form)
                firstName = providedFirstName;
                lastName = providedLastName || '';
            }
            else {
                // Fall back to parsing displayName from token (Google Sign-In)
                const parsed = parseDisplayName(decodedToken.name);
                firstName = parsed.firstName;
                lastName = parsed.lastName;
            }
            const displayName = `${firstName} ${lastName}`.trim() || ((_a = decodedToken.email) === null || _a === void 0 ? void 0 : _a.split('@')[0]) || 'User';
            // Create new user document with enhanced profile data
            const newUser = {
                uid: uid,
                email: decodedToken.email,
                firstName: firstName,
                lastName: lastName,
                displayName: displayName,
                photoURL: decodedToken.picture || getRandomProfilePicture(),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await admin.firestore().collection('users').doc(uid).set(newUser);
            console.log('✅ New user created:', uid, 'with profile:', { firstName, lastName, photoURL: newUser.photoURL });
            // Send welcome email to new user
            if (decodedToken.email) {
                const emailResult = await (0, email_1.sendWelcomeEmail)(decodedToken.email, firstName);
                if (emailResult.success) {
                    console.log(`✅ Welcome email sent to ${decodedToken.email}`);
                }
                else {
                    console.warn(`⚠️ Failed to send welcome email: ${emailResult.error}`);
                }
            }
            return res.json({
                success: true,
                user: newUser
            });
        }
        else {
            // Update last login for existing user
            await admin.firestore().collection('users').doc(uid).update({
                lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Get fresh user data
            const userData = (await admin.firestore().collection('users').doc(uid).get()).data();
            console.log('✅ Existing user session synced:', uid);
            return res.json({
                success: true,
                user: userData
            });
        }
    }
    catch (error) {
        console.error('❌ Session sync error:', error);
        let errorMessage = 'Session sync failed';
        let statusCode = 400;
        if (error.code === 'auth/id-token-expired') {
            errorMessage = 'Session expired. Please sign in again.';
            statusCode = 401;
        }
        else if (error.code === 'auth/id-token-revoked') {
            errorMessage = 'Session revoked. Please sign in again.';
            statusCode = 401;
        }
        else if (error.code === 'auth/invalid-id-token') {
            errorMessage = 'Invalid session. Please sign in again.';
            statusCode = 401;
        }
        res.status(statusCode).json({
            success: false,
            error: errorMessage
        });
    }
});
/**
 * VALIDATE PASSWORD
 * Endpoint to validate password strength before account creation
 * This provides server-side validation as an additional safety layer
 */
router.post('/validate-password', async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({
                success: false,
                error: 'Password is required'
            });
        }
        const validation = (0, validation_1.validatePassword)(password);
        return res.json({
            success: validation.isValid,
            isValid: validation.isValid,
            errors: validation.errors
        });
    }
    catch (error) {
        console.error('❌ Password validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Password validation failed'
        });
    }
});
/**
 * UPDATE USER PROFILE
 * Allows users to update their profile information
 */
router.put('/profile', async (req, res) => {
    try {
        const { firstName, lastName, photoURL } = req.body;
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'Authorization token required' });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        // Prepare update data
        const updateData = {
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (firstName !== undefined)
            updateData.firstName = firstName;
        if (lastName !== undefined)
            updateData.lastName = lastName;
        if (photoURL !== undefined)
            updateData.photoURL = photoURL;
        // Update display name if firstName or lastName changed
        if (firstName !== undefined || lastName !== undefined) {
            const userDoc = await admin.firestore().collection('users').doc(uid).get();
            const currentData = userDoc.data();
            const newFirstName = firstName !== undefined ? firstName : ((currentData === null || currentData === void 0 ? void 0 : currentData.firstName) || 'User');
            const newLastName = lastName !== undefined ? lastName : ((currentData === null || currentData === void 0 ? void 0 : currentData.lastName) || '');
            updateData.displayName = newLastName ? `${newFirstName} ${newLastName}` : newFirstName;
        }
        // Update user document in Firestore
        await admin.firestore().collection('users').doc(uid).update(updateData);
        // Get updated user data
        const updatedUserDoc = await admin.firestore().collection('users').doc(uid).get();
        const updatedUser = updatedUserDoc.data();
        console.log('✅ Profile updated for user:', uid, 'with data:', updateData);
        res.json({
            success: true,
            user: updatedUser
        });
    }
    catch (error) {
        console.error('❌ Profile update error:', error);
        let errorMessage = 'Profile update failed. Please try again.';
        let statusCode = 500;
        if (error.code === 'auth/invalid-token') {
            errorMessage = 'Invalid session. Please sign in again.';
            statusCode = 401;
        }
        res.status(statusCode).json({
            success: false,
            error: errorMessage
        });
    }
});
//# sourceMappingURL=auth.js.map