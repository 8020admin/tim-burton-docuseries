# Stripe Integration Guide

## 🎯 Overview

Complete Stripe payment integration for the Tim Burton Docuseries streaming platform with secure backend verification and content access control.

---

## 💳 Payment Options

### **Purchase Types:**
- **Rental**: $24.99 USD - 4-day access to all 4 episodes
- **Regular Purchase**: $39.99 USD - Permanent access to 4 episodes  
- **Box Set**: $74.99 USD - 4 episodes + 40 hours of bonus content

### **Features:**
- ✅ Secure Stripe Checkout (PCI-compliant)
- ✅ Webhook Integration (automatic verification)
- ✅ Content Access Control (backend-verified)
- ✅ Purchase History & Receipt Downloads
- ✅ Rental Expiration (automatic after 4 days)
- ✅ Duplicate Purchase Prevention (multi-layered validation)
- ✅ Comprehensive Error Handling
- ✅ Proper Customer Management (No more "Guest" customers)
- ✅ End-to-end Purchase Processing
- ✅ UI State Updates (Buy → Watch Now, Already Owned, Upgrade)

---

## 🚀 Setup Instructions

### **Step 1: Get Stripe API Keys**

#### **Test Mode (Development):**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy **Publishable key** (starts with `pk_test_`)
3. Copy **Secret key** (starts with `sk_test_`)

#### **Live Mode (Production):**
1. Go to https://dashboard.stripe.com/apikeys
2. Copy **Publishable key** (starts with `pk_live_`)
3. Copy **Secret key** (starts with `sk_live_`)

### **Step 2: Configure Firebase Functions**

Set Stripe secret key as environment variable:

```bash
# For local development
cd src/backend/functions
echo "STRIPE_SECRET_KEY=sk_test_your_key_here" > .env

# For production (Firebase)
firebase functions:config:set stripe.secret_key="sk_live_your_key_here"
```

### **Step 3: Set Up Webhooks**

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Enter webhook URL:
   ```
   https://us-central1-tim-burton-docuseries.cloudfunctions.net/api/stripe/webhook
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Set it in Firebase:
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_your_secret"
   ```

### **Step 4: Test the Integration**

Use Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

---

## 📡 API Endpoints

### **Create Checkout Session**
```javascript
POST /api/stripe/create-checkout-session

Headers:
  Authorization: Bearer <firebase-id-token>
  Content-Type: application/json

Body:
{
  "purchaseType": "regular|boxset|rental",
  "successUrl": "https://your-domain.com/success",
  "cancelUrl": "https://your-domain.com/cancel"
}

Response:
{
  "success": true,
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

### **Webhook Handler**
```javascript
POST /api/stripe/webhook

Headers:
  stripe-signature: <stripe-signature-header>

Body: (Raw Stripe event payload)

Response:
{
  "received": true
}
```

### **Get Purchase Status**
```javascript
GET /api/payments/status

Headers:
  Authorization: Bearer <firebase-id-token>

Response:
{
  "success": true,
  "purchaseStatus": {
    "hasAccess": true,
    "type": "regular|boxset|rental",
    "expiresAt": "2024-01-01T00:00:00.000Z", // Only for rentals
    "purchaseDate": "2023-12-28T00:00:00.000Z"
  }
}
```

---

## 🏗️ System Architecture

### **Frontend Flow:**
1. User clicks "Buy" button
2. JavaScript calls `/create-checkout-session`
3. Redirect to Stripe Checkout
4. User completes payment
5. Stripe redirects to success/cancel URL

### **Backend Flow (Webhook):**
1. Stripe sends webhook event
2. Verify webhook signature
3. Extract session data
4. Update Firestore with purchase info
5. Send confirmation email (optional)

### **Access Control:**
1. User requests content
2. Backend checks `/payments/status`
3. Verify purchase in Firestore
4. Check expiration (for rentals)
5. Grant or deny access

---

## 🗄️ Firestore Schema

### **Purchases Collection**
```javascript
purchases/{purchaseId}
{
  userId: "firebase-uid",
  stripeSessionId: "cs_test_...",
  type: "regular|boxset|rental",
  amount: 3999, // in cents
  currency: "usd",
  status: "completed|failed|refunded",
  createdAt: Timestamp,
  expiresAt: Timestamp, // Only for rentals (4 days from purchase)
  metadata: {
    receiptUrl: "https://stripe.com/...",
    customerEmail: "user@example.com"
  }
}
```

### **Users Collection (Purchase Info)**
```javascript
users/{userId}
{
  // ... other user fields
  purchases: {
    currentAccess: {
      type: "regular|boxset|rental|null",
      expiresAt: Timestamp, // Only for rentals
      purchasedAt: Timestamp
    },
    history: [
      {
        purchaseId: "purchase-id",
        type: "regular",
        date: Timestamp,
        amount: 3999
      }
    ]
  }
}
```

---

## 🔒 Security Best Practices

1. **Never expose Secret Key** - Only use in backend
2. **Always verify webhooks** - Use signing secret
3. **Validate user authentication** - Check Firebase ID token
4. **Use HTTPS only** - Stripe requires SSL
5. **Handle errors gracefully** - Don't expose internal errors
6. **Log webhook events** - For debugging and auditing
7. **Test thoroughly** - Use test mode before going live

---

## 🐛 Troubleshooting

### **Webhook not receiving events:**
- Check webhook URL is publicly accessible
- Verify webhook secret is correct
- Check Stripe dashboard for webhook logs
- Ensure CORS is properly configured

### **Payment succeeds but access not granted:**
- Check webhook is firing correctly
- Verify Firestore write permissions
- Check user ID matching in webhook handler
- Review Cloud Functions logs

### **3D Secure not working:**
- Ensure return URL is whitelisted
- Check payment intent status
- Verify webhook handles `payment_intent.succeeded`

### **Test mode vs Live mode issues:**
- Use correct API keys for environment
- Check webhook endpoints match mode
- Verify product IDs are correct

---

## 📊 Testing Checklist

- [ ] Rental purchase flow
- [ ] Regular purchase flow
- [ ] Box set purchase flow
- [ ] Webhook receives events
- [ ] Firestore updates correctly
- [ ] Access control works
- [ ] Rental expiration works
- [ ] Error handling works
- [ ] 3D Secure authentication
- [ ] Payment failure handling
- [ ] Refund handling (optional)

---

## 🚀 Deployment

### **Development:**
```bash
cd src/backend/functions
npm run deploy
```

### **Production:**
1. Switch to live Stripe keys
2. Update webhook URL to production
3. Test with real payment (small amount)
4. Monitor Cloud Functions logs
5. Verify Firestore updates

---

## 🛡️ Duplicate Purchase Prevention

**Automatically prevents customers from buying the same product twice.**

**Rules:**
- Box Set owners: Cannot buy anything (already have everything)
- Regular owners: Can only upgrade to Box Set
- Active Rental: Can upgrade to Regular or Box Set (no duplicate rentals)
- Expired Rental: Can buy anything

**Implementation:**
- ✅ Client-side validation (better UX, instant feedback)
- ✅ Server-side validation (security, cannot be bypassed)
- ✅ Smart UI states (buttons show "Already Owned", "Upgrade to Box Set", etc.)

**Endpoint:** `POST /api/payments/validate-purchase`

---

## 📝 Additional Resources

- **Stripe Docs**: https://stripe.com/docs
- **Stripe Checkout**: https://stripe.com/docs/payments/checkout
- **Webhooks Guide**: https://stripe.com/docs/webhooks
- **Test Cards**: https://stripe.com/docs/testing

---

## ✅ Status

**Production Ready** - All features implemented and tested.

**Live URLs:**
- API: https://us-central1-tim-burton-docuseries.cloudfunctions.net/api
- Webhook: https://us-central1-tim-burton-docuseries.cloudfunctions.net/api/stripe/webhook

