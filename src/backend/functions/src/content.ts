import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import { getPlaybackUrl, saveWatchProgress, getWatchProgress } from './mux';

const router = express.Router();

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
    const result = await getPlaybackUrl(userId, playbackId, contentType as 'episode' | 'extra');
    
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
    
  } catch (error) {
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

    const result = await saveWatchProgress(userId, videoId, currentTime, duration);
    
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
    
  } catch (error) {
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
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required'
      });
    }
    
    const result = await getWatchProgress(userId, videoId);
    
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
    
  } catch (error) {
    console.error('Progress retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get progress'
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
    
  } catch (error) {
    console.error('Content access check error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to check content access'
    });
  }
});

export { router as contentRoutes };
