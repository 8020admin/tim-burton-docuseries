import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';

const router = express.Router();

// Get signed video URL
router.post('/signed-url', async (req, res) => {
  try {
    const { videoId } = req.body;
    
    // This would integrate with Mux to generate signed URLs
    // For now, return a mock signed URL
    const signedUrl = `https://stream.mux.com/${videoId}.m3u8?token=mock_token_${Date.now()}`;
    
    res.json({
      success: true,
      signedUrl: signedUrl
    });
    
  } catch (error) {
    console.error('Signed URL generation error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to generate signed URL'
    });
  }
});

// Save watch progress
router.post('/progress', async (req, res) => {
  try {
    const { videoId, userId, currentTime, duration, progress } = req.body;
    
    // Save progress to Firestore
    await admin.firestore()
      .collection('watchProgress')
      .doc(`${userId}_${videoId}`)
      .set({
        userId: userId,
        videoId: videoId,
        currentTime: currentTime,
        duration: duration,
        progress: progress,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    
    res.json({
      success: true,
      message: 'Progress saved'
    });
    
  } catch (error) {
    console.error('Progress save error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to save progress'
    });
  }
});

// Get watch progress
router.get('/progress/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.query.userId; // This would come from authenticated user
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required'
      });
    }
    
    const progressDoc = await admin.firestore()
      .collection('watchProgress')
      .doc(`${userId}_${videoId}`)
      .get();
    
    if (progressDoc.exists) {
      res.json({
        success: true,
        progress: progressDoc.data()
      });
    } else {
      res.json({
        success: true,
        progress: null
      });
    }
    
  } catch (error) {
    console.error('Progress retrieval error:', error);
    res.status(400).json({
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
