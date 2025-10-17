import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendRentalExpirationWarning, sendRentalExpiredNotification } from './email';

/**
 * Check rental expirations and send notifications
 * Runs every hour on the hour
 */
export const checkRentalExpirations = functions.pubsub
  .schedule('0 * * * *') // Every hour on the hour
  .timeZone('America/Los_Angeles') // Adjust to your timezone
  .onRun(async (context) => {
    console.log('🔔 Running rental expiration check...');
    
    const now = admin.firestore.Timestamp.now();
    const nowMillis = now.toMillis();
    
    // Calculate time windows
    const in48Hours = admin.firestore.Timestamp.fromMillis(nowMillis + 48 * 60 * 60 * 1000);
    const in47Hours = admin.firestore.Timestamp.fromMillis(nowMillis + 47 * 60 * 60 * 1000);
    const in24Hours = admin.firestore.Timestamp.fromMillis(nowMillis + 24 * 60 * 60 * 1000);
    const in23Hours = admin.firestore.Timestamp.fromMillis(nowMillis + 23 * 60 * 60 * 1000);
    
    try {
      // Check for 48-hour warnings
      await send48HourWarnings(in47Hours, in48Hours);
      
      // Check for 24-hour warnings
      await send24HourWarnings(in23Hours, in24Hours);
      
      // Check for expired rentals
      await sendExpiredNotifications(now);
      
      console.log('✅ Rental expiration check complete');
    } catch (error) {
      console.error('❌ Error in rental expiration check:', error);
      throw error; // Re-throw to mark function as failed
    }
  });

/**
 * Send 48-hour expiration warnings
 */
async function send48HourWarnings(startTime: admin.firestore.Timestamp, endTime: admin.firestore.Timestamp) {
  try {
    const rentals = await admin.firestore()
      .collection('purchases')
      .where('productType', '==', 'rental')
      .where('rentalExpiresAt', '>=', startTime)
      .where('rentalExpiresAt', '<=', endTime)
      .where('notificationsSent.warning48h', '==', false)
      .get();

    console.log(`📧 Found ${rentals.size} rentals needing 48h warning`);

    for (const doc of rentals.docs) {
      const purchase = doc.data();
      
      // Get user data
      const userDoc = await admin.firestore().collection('users').doc(purchase.userId).get();
      const userData = userDoc.data();
      
      if (!userData?.email) {
        console.warn(`⚠️ No email for user ${purchase.userId}, skipping`);
        continue;
      }

      // Send warning email
      const expiresAt = purchase.rentalExpiresAt.toDate().toLocaleString();
      const emailResult = await sendRentalExpirationWarning(
        userData.email,
        userData.firstName || 'User',
        48,
        expiresAt
      );

      if (emailResult.success) {
        // Mark as sent
        await doc.ref.update({
          'notificationsSent.warning48h': true
        });
        console.log(`✅ 48h warning sent to ${userData.email}`);
      } else {
        console.error(`❌ Failed to send 48h warning to ${userData.email}:`, emailResult.error);
      }
    }
  } catch (error) {
    console.error('❌ Error sending 48h warnings:', error);
  }
}

/**
 * Send 24-hour expiration warnings
 */
async function send24HourWarnings(startTime: admin.firestore.Timestamp, endTime: admin.firestore.Timestamp) {
  try {
    const rentals = await admin.firestore()
      .collection('purchases')
      .where('productType', '==', 'rental')
      .where('rentalExpiresAt', '>=', startTime)
      .where('rentalExpiresAt', '<=', endTime)
      .where('notificationsSent.warning24h', '==', false)
      .get();

    console.log(`📧 Found ${rentals.size} rentals needing 24h warning`);

    for (const doc of rentals.docs) {
      const purchase = doc.data();
      
      // Get user data
      const userDoc = await admin.firestore().collection('users').doc(purchase.userId).get();
      const userData = userDoc.data();
      
      if (!userData?.email) {
        console.warn(`⚠️ No email for user ${purchase.userId}, skipping`);
        continue;
      }

      // Send warning email
      const expiresAt = purchase.rentalExpiresAt.toDate().toLocaleString();
      const emailResult = await sendRentalExpirationWarning(
        userData.email,
        userData.firstName || 'User',
        24,
        expiresAt
      );

      if (emailResult.success) {
        // Mark as sent
        await doc.ref.update({
          'notificationsSent.warning24h': true
        });
        console.log(`✅ 24h warning sent to ${userData.email}`);
      } else {
        console.error(`❌ Failed to send 24h warning to ${userData.email}:`, emailResult.error);
      }
    }
  } catch (error) {
    console.error('❌ Error sending 24h warnings:', error);
  }
}

/**
 * Send expired rental notifications
 */
async function sendExpiredNotifications(now: admin.firestore.Timestamp) {
  try {
    // Find rentals that expired in the last hour and haven't been notified
    const oneHourAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 60 * 60 * 1000);
    
    const rentals = await admin.firestore()
      .collection('purchases')
      .where('productType', '==', 'rental')
      .where('rentalExpiresAt', '<=', now)
      .where('rentalExpiresAt', '>=', oneHourAgo)
      .where('notificationsSent.expired', '==', false)
      .get();

    console.log(`📧 Found ${rentals.size} expired rentals needing notification`);

    for (const doc of rentals.docs) {
      const purchase = doc.data();
      
      // Get user data
      const userDoc = await admin.firestore().collection('users').doc(purchase.userId).get();
      const userData = userDoc.data();
      
      if (!userData?.email) {
        console.warn(`⚠️ No email for user ${purchase.userId}, skipping`);
        continue;
      }

      // Send expired notification
      const emailResult = await sendRentalExpiredNotification(
        userData.email,
        userData.firstName || 'User'
      );

      if (emailResult.success) {
        // Mark as sent
        await doc.ref.update({
          'notificationsSent.expired': true
        });
        console.log(`✅ Expiration notification sent to ${userData.email}`);
      } else {
        console.error(`❌ Failed to send expiration notification to ${userData.email}:`, emailResult.error);
      }
    }
  } catch (error) {
    console.error('❌ Error sending expiration notifications:', error);
  }
}

