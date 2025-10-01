# Stripe Integration Setup Guide

## Overview
The Tim Burton Docuseries uses Stripe for payment processing. This guide will help you configure Stripe for both testing and production.

## Prerequisites
- Stripe account (sign up at https://stripe.com)
- Firebase CLI installed and authenticated
- Access to Firebase project console

## Step 1: Get Your Stripe Keys

### Test Mode (For Development)
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

### Live Mode (For Production)
1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Publishable key** (starts with `pk_live_`)
3. Copy your **Secret key** (starts with `sk_live_`)

## Step 2: Configure Firebase Functions

You need to set the Stripe secret key as an environment variable in Firebase Functions.

### Option A: Using Firebase CLI (Recommended)

```bash
# Navigate to your project root
cd /Users/cocovega/Dev/8020\ Clients/tim-burton-docuseries/prototype

# Set the Stripe secret key (use your actual key)
firebase functions:config:set stripe.secret_key="sk_test_YOUR_KEY_HERE"

# Optionally set webhook secret (needed for production)
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET"

# Verify the configuration
firebase functions:config:get

# Redeploy functions for changes to take effect
firebase deploy --only functions
```

### Option B: Using Firebase Console

1. Go to https://console.firebase.google.com
2. Select your project: **tim-burton-docuseries**
3. Go to **Functions** → **Configuration**
4. Add environment variable:
   - Key: `STRIPE_SECRET_KEY`
   - Value: `sk_test_YOUR_KEY_HERE`
5. Save and redeploy functions

## Step 3: Set Up Stripe Webhook (For Production)

Webhooks allow Stripe to notify your backend when payments succeed.

### 3.1 Create Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Set endpoint URL:
   ```
   https://us-central1-tim-burton-docuseries.cloudfunctions.net/api/payments/webhook
   ```
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **Add endpoint**

### 3.2 Get Webhook Secret

1. Click on your newly created webhook
2. Copy the **Signing secret** (starts with `whsec_`)
3. Add it to Firebase Functions:
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_YOUR_SECRET_HERE"
   firebase deploy --only functions
   ```

## Step 4: Update Environment Variables

The backend code expects these environment variables:
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Your webhook signing secret (optional for testing)

### Current Code Reference
In `src/backend/functions/src/stripe.ts`:
```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});
```

## Step 5: Test the Integration

### 5.1 Test Cards (Test Mode Only)

Use these test card numbers in Stripe Checkout:

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Payment Declined:**
- Card: `4000 0000 0000 0002`

**Requires Authentication (3D Secure):**
- Card: `4000 0025 0000 3155`

### 5.2 Test the Flow

1. Go to your Webflow site
2. Sign in with a test account
3. Click **Rent** or **Buy**
4. Complete checkout with a test card
5. Verify you're redirected back with success message
6. Check Firebase Console → Firestore → `purchases` collection for the record

## Step 6: Check Firebase Functions Logs

If payments aren't working:

```bash
# View real-time logs
firebase functions:log --only api

# Or view in console
# https://console.firebase.google.com/project/tim-burton-docuseries/functions/logs
```

Common errors:
- `STRIPE_SECRET_KEY is undefined` → Environment variable not set
- `Invalid API Key` → Wrong key or test/live mode mismatch
- `CORS error` → Origin not whitelisted (already configured for Cloudflare Pages)

## Step 7: Pricing Configuration

Current prices are defined in `src/backend/functions/src/stripe.ts`:

```typescript
const PRODUCTS = {
  rental: {
    name: 'Tim Burton Docuseries - Rental',
    description: '4-day access to all 4 episodes',
    price: 1499, // $14.99 in cents
  },
  regular: {
    name: 'Tim Burton Docuseries - Regular Purchase',
    description: 'Permanent access to 4 episodes',
    price: 2499, // $24.99 in cents
  },
  boxset: {
    name: 'Tim Burton Docuseries - Box Set',
    description: '4 episodes + 40 hours of bonus content',
    price: 7499, // $74.99 in cents
  },
};
```

To change prices, edit these values (in cents) and redeploy:
```bash
firebase deploy --only functions
```

## Troubleshooting

### Issue: "Failed to create checkout session"

**Possible causes:**
1. Stripe secret key not configured
2. Invalid API key
3. CORS issues
4. Firebase Functions cold start timeout

**Solution:**
```bash
# 1. Re-authenticate with Firebase
firebase login --reauth

# 2. Set Stripe key
firebase functions:config:set stripe.secret_key="sk_test_YOUR_KEY"

# 3. Redeploy
firebase deploy --only functions

# 4. Test again
```

### Issue: "Purchase status not updating"

**Possible causes:**
1. Webhook not configured
2. Webhook secret incorrect
3. Firestore rules blocking writes

**Solution:**
- Check webhook is active in Stripe dashboard
- Verify webhook secret is set correctly
- Check Firebase Functions logs for webhook errors

### Issue: "User charged but no access granted"

**This is a webhook issue:**
1. Check Stripe dashboard → Webhooks → Events
2. Look for failed `checkout.session.completed` events
3. Check Firebase Functions logs
4. Manually grant access via Firestore if needed

## Security Notes

✅ **Safe to expose:**
- Stripe Publishable Key (`pk_test_` or `pk_live_`)
- Firebase Web API Key
- Cloudflare Pages domain

❌ **Never expose:**
- Stripe Secret Key (`sk_test_` or `sk_live_`)
- Stripe Webhook Secret (`whsec_`)
- Firebase Admin SDK credentials

All sensitive keys are stored server-side in Firebase Functions environment variables and are never sent to the client.

## Production Checklist

Before going live:

- [ ] Switch from test to live Stripe keys
- [ ] Set up production webhook endpoint
- [ ] Test with real (small amount) payment
- [ ] Verify purchase records in Firestore
- [ ] Test access control works correctly
- [ ] Monitor Firebase Functions logs
- [ ] Set up Stripe email receipts
- [ ] Configure refund policy in Stripe
- [ ] Test rental expiration (4 days)
- [ ] Verify CORS settings work with production domains

## Support

If you encounter issues:
1. Check Firebase Functions logs
2. Check Stripe Dashboard → Events
3. Review browser console for client-side errors
4. Check network tab for failed API calls

---

**Last Updated:** October 1, 2025

