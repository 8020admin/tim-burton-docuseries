"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentRoutes = void 0;
const admin = require("firebase-admin");
const express = require("express");
const mux_1 = require("./mux");
const router = express.Router();
exports.contentRoutes = router;
// Get signed video URL with access control
router.post('/playback-url', async (req, res) => {
    try {
        const { userId, playbackId, contentType } = req.body;
        if (!userId || !playbackId || !contentType) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: userId, playbackId, contentType'
            });
        }
        if (!['episode', 'extra'].includes(contentType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid content type. Must be "episode" or "extra"'
            });
        }
        // Get playback URL with access control
        const result = await (0, mux_1.getPlaybackUrl)(userId, playbackId, contentType);
        if (result.success && result.url) {
            return res.json({
                success: true,
                url: result.url
            });
        }
        if (result.accessDenied) {
            return res.status(403).json({
                success: false,
                error: result.error || 'Access denied',
                accessDenied: true
            });
        }
        return res.status(500).json({
            success: false,
            error: result.error || 'Failed to generate playback URL'
        });
    }
    catch (error) {
        console.error('Playback URL error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate playback URL'
        });
    }
});
// Save watch progress
router.post('/progress', async (req, res) => {
    try {
        const { videoId, userId, currentTime, duration } = req.body;
        if (!videoId || !userId || currentTime === undefined || !duration) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: videoId, userId, currentTime, duration'
            });
        }
        const result = await (0, mux_1.saveWatchProgress)(userId, videoId, currentTime, duration);
        if (result.success) {
            return res.json({
                success: true,
                message: 'Progress saved',
                progress: result.progress
            });
        }
        return res.status(500).json({
            success: false,
            error: result.error || 'Failed to save progress'
        });
    }
    catch (error) {
        console.error('Progress save error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save progress'
        });
    }
});
// Get watch progress
router.get('/progress/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID required'
            });
        }
        const result = await (0, mux_1.getWatchProgress)(userId, videoId);
        if (result.success) {
            return res.json({
                success: true,
                progress: result.progress
            });
        }
        return res.status(500).json({
            success: false,
            error: result.error || 'Failed to get progress'
        });
    }
    catch (error) {
        console.error('Progress retrieval error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get progress'
        });
    }
});
// Get continue watching data (hero section + all progress)
router.get('/continue-watching', async (req, res) => {
    var _a, _b, _c;
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID required'
            });
        }
        // Episode sequence (episodes 1-4 only, no bonus content in hero)
        const episodeSequence = ['episode-1', 'episode-2', 'episode-3', 'episode-4'];
        const episodeTitles = {
            'episode-1': 'Suburban Hell',
            'episode-2': 'Misunderstood Monsters',
            'episode-3': 'Rebel by Design',
            'episode-4': 'Coming Home'
        };
        // Get all watch progress for user
        const progressDocs = await admin.firestore()
            .collection('watchProgress')
            .where('userId', '==', userId)
            .get();
        // Build progress map
        const progressMap = {};
        let lastWatched = null;
        let lastWatchedTime = 0;
        progressDocs.forEach((doc) => {
            var _a;
            const data = doc.data();
            progressMap[data.videoId] = {
                videoId: data.videoId,
                progress: data.progress || 0,
                completed: data.completed || false,
                currentTime: data.currentTime || 0,
                duration: data.duration || 0,
                lastUpdated: data.lastUpdated
            };
            // Track most recently watched
            const updatedTime = ((_a = data.lastUpdated) === null || _a === void 0 ? void 0 : _a.toMillis()) || 0;
            if (updatedTime > lastWatchedTime) {
                lastWatchedTime = updatedTime;
                lastWatched = data;
            }
        });
        // Determine continue watching episode
        let continueWatchingVideoId = 'episode-1'; // Default to first episode
        let isNextEpisode = false;
        if (lastWatched) {
            if (lastWatched.completed) {
                // Find next episode in sequence
                const currentIndex = episodeSequence.indexOf(lastWatched.videoId);
                if (currentIndex !== -1 && currentIndex < episodeSequence.length - 1) {
                    // Next episode
                    continueWatchingVideoId = episodeSequence[currentIndex + 1];
                    isNextEpisode = true;
                }
                else {
                    // All episodes watched, loop back to first
                    continueWatchingVideoId = 'episode-1';
                    isNextEpisode = true;
                }
            }
            else {
                // Continue current episode
                continueWatchingVideoId = lastWatched.videoId;
                isNextEpisode = false;
            }
        }
        // Get episode number from videoId
        const episodeNumber = parseInt(continueWatchingVideoId.replace('episode-', ''));
        const episodeTitle = episodeTitles[continueWatchingVideoId] || 'Unknown';
        // Build continue watching object
        const continueWatching = {
            videoId: continueWatchingVideoId,
            title: episodeTitle,
            episodeNumber: episodeNumber,
            currentTime: ((_a = progressMap[continueWatchingVideoId]) === null || _a === void 0 ? void 0 : _a.currentTime) || 0,
            progress: ((_b = progressMap[continueWatchingVideoId]) === null || _b === void 0 ? void 0 : _b.progress) || 0,
            completed: ((_c = progressMap[continueWatchingVideoId]) === null || _c === void 0 ? void 0 : _c.completed) || false,
            isNextEpisode: isNextEpisode
        };
        // Build all progress array
        const allProgress = episodeSequence.map(videoId => {
            var _a, _b, _c;
            return ({
                videoId: videoId,
                progress: ((_a = progressMap[videoId]) === null || _a === void 0 ? void 0 : _a.progress) || 0,
                completed: ((_b = progressMap[videoId]) === null || _b === void 0 ? void 0 : _b.completed) || false,
                currentTime: ((_c = progressMap[videoId]) === null || _c === void 0 ? void 0 : _c.currentTime) || 0
            });
        });
        // Add bonus content if exists
        if (progressMap['bonus-1']) {
            allProgress.push({
                videoId: 'bonus-1',
                progress: progressMap['bonus-1'].progress,
                completed: progressMap['bonus-1'].completed,
                currentTime: progressMap['bonus-1'].currentTime
            });
        }
        res.json({
            success: true,
            continueWatching: continueWatching,
            allProgress: allProgress
        });
    }
    catch (error) {
        console.error('Continue watching error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get continue watching data'
        });
    }
});
// Check content access
router.post('/access', async (req, res) => {
    try {
        const { userId, contentType } = req.body;
        // Check if user has access to content
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.json({
                success: true,
                hasAccess: false
            });
        }
        const userData = userDoc.data();
        // Check for active purchases
        const purchases = await admin.firestore()
            .collection('purchases')
            .where('userId', '==', userId)
            .where('status', '==', 'active')
            .get();
        let hasAccess = false;
        if (purchases.docs.length > 0) {
            // Check if purchase includes the requested content type
            for (const purchase of purchases.docs) {
                const purchaseData = purchase.data();
                if (purchaseData.contentType === contentType || purchaseData.contentType === 'boxset') {
                    hasAccess = true;
                    break;
                }
            }
        }
        res.json({
            success: true,
            hasAccess: hasAccess
        });
    }
    catch (error) {
        console.error('Content access check error:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to check content access'
        });
    }
});
//# sourceMappingURL=content.js.map