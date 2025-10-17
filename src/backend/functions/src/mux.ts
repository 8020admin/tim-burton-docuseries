/**
 * Mux Integration for Tim Burton Docuseries
 * Handles video streaming, signed URLs, and content delivery
 */

import * as admin from 'firebase-admin';

// Use CommonJS require for Mux (as per official documentation)
const Mux = require('@mux/mux-node');

// Initialize Mux client
let muxClient: any = null;

/**
 * Get or initialize Mux client
 */
function getMuxClient(): any {
  if (!muxClient) {
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;

    if (!tokenId || !tokenSecret) {
      throw new Error('Mux credentials not configured. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables.');
    }

    // Initialize Mux client with authentication
    muxClient = new Mux(tokenId, tokenSecret);

    console.log('✅ Mux client initialized');
  }

  return muxClient;
}

/**
 * Generate signed playback URL for a video
 * Uses Mux's built-in JWT helper for secure URL generation
 */
export async function generateSignedPlaybackUrl(
  playbackId: string,
  userId: string,
  expiresIn: number = 604800 // 7 days in seconds (Mux default)
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Environment variables for signing (Mux SDK will auto-detect these)
    // MUX_SIGNING_KEY = signing key ID
    // MUX_PRIVATE_KEY = private key
    
    if (!process.env.MUX_SIGNING_KEY || !process.env.MUX_PRIVATE_KEY) {
      throw new Error('Mux signing keys not configured. Please set MUX_SIGNING_KEY and MUX_PRIVATE_KEY environment variables.');
    }

    // Use Mux's built-in JWT helper
    // NOTE: Keep params minimal to allow Chromecast/casting devices to access the stream
    // The user_id param can cause issues with casting since the request comes from a different device
    const token = Mux.JWT.signPlaybackId(playbackId, {
      type: 'video',
      expiration: `${expiresIn}s`
      // params removed to allow casting devices to access the stream
      // Access control is already handled by the getPlaybackUrl() function
    });

    // Construct the signed URL
    const signedUrl = `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;

    console.log(`✅ Generated signed URL for playback ID: ${playbackId}, user: ${userId}`);

    return {
      success: true,
      url: signedUrl
    };

  } catch (error) {
    console.error('❌ Error generating signed URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate signed URL'
    };
  }
}

/**
 * Get video asset information from Mux
 */
export async function getVideoAsset(assetId: string) {
  try {
    const mux = getMuxClient();
    const asset = await mux.Video.Assets.get(assetId);

    return {
      success: true,
      asset: {
        id: asset.id,
        status: asset.status,
        duration: asset.duration,
        playbackIds: asset.playback_ids,
        createdAt: asset.created_at
      }
    };

  } catch (error) {
    console.error('❌ Error fetching video asset:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch video asset'
    };
  }
}

/**
 * Check if user has access to specific content
 */
export async function checkContentAccess(
  userId: string,
  contentType: 'episode' | 'extra'
): Promise<{ hasAccess: boolean; purchaseType: string | null; reason?: string }> {
  try {
    // Get user's purchase status
    const purchases = await admin.firestore()
      .collection('purchases')
      .where('userId', '==', userId)
      .where('status', '==', 'completed')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (purchases.empty) {
      return {
        hasAccess: false,
        purchaseType: null,
        reason: 'No active purchase found'
      };
    }

    const purchase = purchases.docs[0].data();
    const productType = purchase.productType;

    // Check rental expiration
    if (productType === 'rental' && purchase.expiresAt) {
      const expiresAt = purchase.expiresAt.toDate();
      const now = new Date();

      if (now > expiresAt) {
        return {
          hasAccess: false,
          purchaseType: 'expired',
          reason: 'Rental has expired'
        };
      }
    }

    // Access rules:
    // - Episodes: rental, regular, boxset
    // - Extras: boxset only
    if (contentType === 'episode') {
      return {
        hasAccess: ['rental', 'regular', 'boxset'].includes(productType),
        purchaseType: productType
      };
    } else if (contentType === 'extra') {
      return {
        hasAccess: productType === 'boxset',
        purchaseType: productType,
        reason: productType !== 'boxset' ? 'Extras require Box Set purchase' : undefined
      };
    }

    return {
      hasAccess: false,
      purchaseType: productType,
      reason: 'Unknown content type'
    };

  } catch (error) {
    console.error('❌ Error checking content access:', error);
    return {
      hasAccess: false,
      purchaseType: null,
      reason: 'Error checking access'
    };
  }
}

/**
 * Get video playback URL with access control
 */
export async function getPlaybackUrl(
  userId: string,
  playbackId: string,
  contentType: 'episode' | 'extra'
): Promise<{ success: boolean; url?: string; error?: string; accessDenied?: boolean }> {
  try {
    // Check if user has access
    const accessCheck = await checkContentAccess(userId, contentType);

    if (!accessCheck.hasAccess) {
      console.log(`❌ Access denied for user ${userId} to ${contentType}: ${accessCheck.reason}`);
      return {
        success: false,
        accessDenied: true,
        error: accessCheck.reason || 'Access denied'
      };
    }

    // Generate signed URL
    const result = await generateSignedPlaybackUrl(playbackId, userId);

    if (result.success && result.url) {
      console.log(`✅ Playback URL generated for user ${userId}, content type: ${contentType}`);
      return {
        success: true,
        url: result.url
      };
    }

    return {
      success: false,
      error: result.error || 'Failed to generate playback URL'
    };

  } catch (error) {
    console.error('❌ Error getting playback URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get playback URL'
    };
  }
}

/**
 * Save watch progress for a video
 */
export async function saveWatchProgress(
  userId: string,
  videoId: string,
  currentTime: number,
  duration: number
) {
  try {
    const progress = Math.round((currentTime / duration) * 100);
    const completed = progress >= 95; // Mark as completed if >= 95%

    await admin.firestore()
      .collection('watchProgress')
      .doc(`${userId}_${videoId}`)
      .set({
        userId: userId,
        videoId: videoId,
        currentTime: currentTime,
        duration: duration,
        progress: progress,
        completed: completed,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

    return {
      success: true,
      progress: progress,
      completed: completed
    };

  } catch (error) {
    console.error('❌ Error saving watch progress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save progress'
    };
  }
}

/**
 * Get watch progress for a video
 */
export async function getWatchProgress(userId: string, videoId: string) {
  try {
    const progressDoc = await admin.firestore()
      .collection('watchProgress')
      .doc(`${userId}_${videoId}`)
      .get();

    if (progressDoc.exists) {
      return {
        success: true,
        progress: progressDoc.data()
      };
    }

    return {
      success: true,
      progress: null
    };

  } catch (error) {
    console.error('❌ Error getting watch progress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get progress'
    };
  }
}

