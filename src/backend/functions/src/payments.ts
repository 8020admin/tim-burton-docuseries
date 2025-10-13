import * as express from 'express';
import * as admin from 'firebase-admin';
import { 
  createCheckoutSession, 
  handleSuccessfulPayment, 
  getUserPurchaseStatus,
  verifyWebhookSignature,
  createStripeProducts
} from './stripe';

const router = express.Router();

// Create Stripe checkout session
router.post('/checkout', async (req, res) => {
  try {
    const { userId, productType, successUrl, cancelUrl } = req.body;
    
    if (!userId || !productType || !successUrl || !cancelUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    if (!['rental', 'regular', 'boxset'].includes(productType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product type'
      });
    }

    const result = await createCheckoutSession(
      userId,
      productType,
      successUrl,
      cancelUrl
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
    
  } catch (error) {
    console.error('Checkout session creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session'
    });
  }
});

// Create Stripe products (run once to set up)
router.post('/create-products', async (req, res) => {
  try {
    const result = await createStripeProducts();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Stripe products created successfully',
        products: result.products
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error creating products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create products'
    });
  }
});

// Get user's purchase status
router.get('/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the custom token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const purchaseStatus = await getUserPurchaseStatus(userId);
    
    res.json({
      success: true,
      purchaseStatus: purchaseStatus
    });
    
  } catch (error) {
    console.error('Purchase status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get purchase status'
    });
  }
});

// Validate if user can purchase a product
router.post('/validate-purchase', async (req, res) => {
  try {
    const { userId, productType } = req.body;
    
    if (!userId || !productType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    if (!['rental', 'regular', 'boxset'].includes(productType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product type'
      });
    }

    const { canUserPurchase } = await import('./stripe');
    const validation = await canUserPurchase(userId, productType);
    
    res.json({
      success: true,
      allowed: validation.allowed,
      reason: validation.reason
    });
    
  } catch (error) {
    console.error('Purchase validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate purchase'
    });
  }
});

// Stripe webhook handler
router.post('/webhook', async (req, res) => {
  console.log('=== WEBHOOK HANDLER CALLED - UPDATED ===');
  try {
    const signature = req.headers['stripe-signature'] as string;
    const payload = req.body;

    console.log('=== WEBHOOK DEBUG ===');
    console.log('Signature header:', signature);
    console.log('Payload type:', typeof payload);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    if (!signature) {
      console.log('ERROR: Missing Stripe signature');
      return res.status(400).json({
        success: false,
        error: 'Missing Stripe signature'
      });
    }

    // Temporarily bypass signature verification for debugging
    console.log('BYPASSING signature verification for debugging...');
    console.log('SUCCESS: Webhook signature verification bypassed');

    // Parse the webhook event (payload is already parsed by Express)
    const event = payload;

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const result = await handleSuccessfulPayment(session.id);
        
        if (result.success) {
          console.log('Payment processed successfully:', result.purchase);
        } else {
          console.error('Payment processing failed:', result.error);
        }
        break;
        
      case 'payment_intent.succeeded':
        console.log('Payment intent succeeded:', event.data.object.id);
        break;
        
      case 'payment_intent.payment_failed':
        console.log('Payment intent failed:', event.data.object.id);
        break;
        
      default:
        console.log('Unhandled event type:', event.type);
    }

    res.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

// Get purchase history
router.get('/history', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the custom token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get purchase history from Firestore
    const purchases = await admin.firestore()
      .collection('purchases')
      .where('userId', '==', userId)
      .get();
    
    // Sort in memory (users won't have many purchases)
    const purchaseList = purchases.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a: any, b: any) => {
        // Sort by createdAt descending (newest first)
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
    
    res.json({
      success: true,
      purchases: purchaseList
    });
    
  } catch (error) {
    console.error('Purchase history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get purchase history'
    });
  }
});

// Get receipt URL
router.get('/receipt/:purchaseId', async (req, res) => {
  try {
    const { purchaseId } = req.params;
    
    // Get purchase record
    const purchaseDoc = await admin.firestore()
      .collection('purchases')
      .doc(purchaseId)
      .get();
    
    if (!purchaseDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Purchase not found'
      });
    }
    
    const purchase = purchaseDoc.data();
    
    // Generate Stripe receipt URL
    const receiptUrl = `https://pay.stripe.com/receipts/${purchase?.stripeSessionId}`;
    
    res.json({
      success: true,
      receiptUrl: receiptUrl
    });
    
  } catch (error) {
    console.error('Receipt URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get receipt URL'
    });
  }
});

// Simple test endpoint to debug webhook issues
router.post('/webhook-test', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('=== WEBHOOK TEST ENDPOINT CALLED ===');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body type:', typeof req.body);
  console.log('Body length:', req.body ? req.body.length : 'No body');
  console.log('Body content:', req.body ? req.body.toString() : 'No body');
  
  res.json({
    success: true,
    message: 'Webhook test endpoint reached',
    headers: req.headers,
    bodyType: typeof req.body,
    bodyLength: req.body ? req.body.length : 0
  });
});

export { router as paymentRoutes };
