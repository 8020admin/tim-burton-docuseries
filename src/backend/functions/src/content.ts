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

// Get continue watching data (hero section + all progress)
router.get('/continue-watching', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required'
      });
    }

    // Episode sequence (episodes 1-4 only, no bonus content in hero)
    const episodeSequence = ['episode-1', 'episode-2', 'episode-3', 'episode-4'];
    const episodeTitles: { [key: string]: string } = {
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
    const progressMap: { [key: string]: any } = {};
    let lastWatched: any = null;
    let lastWatchedTime = 0;

    progressDocs.forEach((doc) => {
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
      const updatedTime = data.lastUpdated?.toMillis() || 0;
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
        } else {
          // All episodes watched, loop back to first
          continueWatchingVideoId = 'episode-1';
          isNextEpisode = true;
        }
      } else {
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
      currentTime: progressMap[continueWatchingVideoId]?.currentTime || 0,
      progress: progressMap[continueWatchingVideoId]?.progress || 0,
      completed: progressMap[continueWatchingVideoId]?.completed || false,
      isNextEpisode: isNextEpisode
    };

    // Build all progress array
    const allProgress = episodeSequence.map(videoId => ({
      videoId: videoId,
      progress: progressMap[videoId]?.progress || 0,
      completed: progressMap[videoId]?.completed || false,
      currentTime: progressMap[videoId]?.currentTime || 0
    }));

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
    
  } catch (error) {
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
    
  } catch (error) {
    console.error('Content access check error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to check content access'
    });
  }
});

export { router as contentRoutes };
