# Stripe Integration Guide - Tim Burton Docuseries

## 🎯 **Overview**

This guide documents the complete Stripe payment integration for the Tim Burton docuseries streaming platform. The system handles three purchase types with secure backend verification and content access control.

## 💳 **Payment System Features**

### **Purchase Types:**
- **Rental**: $14.99 USD - 4-day access to all 4 episodes
- **Regular Purchase**: $24.99 USD - Permanent access to 4 episodes  
- **Box Set**: $74.99 USD - 4 episodes + 40 hours of bonus content

### **Key Features:**
- ✅ **Secure Stripe Checkout** - PCI-compliant payment processing
- ✅ **Webhook Integration** - Automatic purchase verification
- ✅ **Content Access Control** - Backend-verified content serving
- ✅ **Purchase History** - User dashboard with receipt downloads
- ✅ **Rental Expiration** - Automatic access termination after 4 days
- ✅ **Error Handling** - Comprehensive error management

## 🏗️ **System Architecture**

### **Backend Components:**

#### **1. Stripe Service (`stripe.ts`)**
- **Checkout Session Creation**: Handles all three purchase types
- **Webhook Processing**: Verifies payments and updates database
- **Purchase Status Tracking**: Secure backend verification
- **Receipt Generation**: Stripe receipt URLs

#### **2. Payment API (`payments.ts`)**
- **`POST /payments/checkout`**: Creates Stripe checkout sessions
- **`GET /payments/status`**: Gets user's purchase status
- **`POST /payments/webhook`**: Handles Stripe webhooks
- **`GET /payments/history`**: Gets user's purchase history
- **`GET /payments/receipt/:id`**: Gets receipt URL

### **Frontend Components:**

#### **1. Stripe Integration (`stripe-integration.js`)**
- **Checkout Management**: Handles all purchase flows
- **Payment Success/Cancellation**: Automatic redirect handling
- **Purchase History**: Retrieves and displays purchases
- **User Notifications**: Success, error, and info messages

#### **2. Button State Manager (`button-state-manager.js`)**
- **Dynamic Button States**: Updates based on auth and purchase status
- **Purchase Flow Integration**: Triggers Stripe checkout
- **Error Handling**: User-friendly error messages

## 🔧 **Configuration**

### **Environment Variables:**
```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### **Stripe Webhook Configuration:**
- **Endpoint URL**: `https://us-central1-tim-burton-docuseries.cloudfunctions.net/api/payments/webhook`
- **Events**: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`

## 🚀 **How It Works**

### **Purchase Flow:**

1. **User Clicks Purchase Button**
   - Not signed in → Opens auth modal in Sign Up state
   - Signed in → Proceeds to Stripe checkout

2. **Stripe Checkout**
   - Secure payment processing
   - User enters payment details
   - Stripe processes payment

3. **Payment Success**
   - Stripe webhook triggers backend
   - Purchase record created in Firestore
   - User's purchase status updated
   - Redirect to `/watch` page

4. **Content Access**
   - Backend verifies purchase status
   - Content served based on purchase type
   - Rental expiration enforced

### **Button States:**

#### **Not Signed In:**
- `Sign In` + `Rent` + `Buy` buttons visible
- Clicking Rent/Buy opens auth modal

#### **Signed In, Not Paid:**
- `Sign Out` + `Rent` + `Buy` buttons visible
- Clicking Rent/Buy triggers Stripe checkout

#### **Signed In, Paid:**
- `Sign Out` + `Watch Now` button visible
- Access to purchased content

### **Content Access Control:**

#### **HTML Attributes:**
```html
<!-- Content for authenticated users only -->
<div data-auth-required="true">Authenticated content</div>

<!-- Content for paid users only -->
<div data-purchase-required="true">Paid content</div>

<!-- Content for box set purchasers only -->
<div data-boxset-required="true">Box set content</div>

<!-- Upgrade prompt for regular purchasers -->
<div data-upgrade-prompt="true">Upgrade to Box Set</div>
```

#### **Backend Verification:**
- **Episodes**: Available to all paid users (rental, regular, box set)
- **Bonus Content**: Available only to box set purchasers
- **Secure URLs**: Backend-verified content serving

## 📊 **Database Schema**

### **Purchases Collection:**
```javascript
{
  userId: string,
  productType: 'rental' | 'regular' | 'boxset',
  stripeSessionId: string,
  stripePaymentIntentId: string,
  amount: number,
  currency: string,
  status: 'completed',
  createdAt: timestamp,
  expiresAt: timestamp | null // 4 days for rental, null for permanent
}
```

### **Users Collection:**
```javascript
{
  // ... existing user fields
  purchaseStatus: {
    hasAccess: boolean,
    type: 'rental' | 'regular' | 'boxset' | null,
    lastUpdated: timestamp
  }
}
```

## 🔒 **Security Features**

### **Payment Security:**
- **PCI Compliance**: Stripe handles all payment data
- **Webhook Verification**: Stripe signature validation
- **Backend Verification**: All content access verified server-side

### **Content Protection:**
- **Authentication Required**: Must be signed in to purchase
- **Purchase Verification**: Backend checks purchase status
- **Rental Expiration**: Automatic access termination
- **Secure URLs**: Time-limited, user-specific content URLs

## 🧪 **Testing**

### **Test Scenarios:**
1. **Rental Purchase** - $14.99, 4-day access
2. **Regular Purchase** - $24.99, permanent access
3. **Box Set Purchase** - $74.99, episodes + bonus content
4. **Payment Failure** - Error handling and user feedback
5. **Rental Expiration** - Access termination after 4 days
6. **Content Access** - Proper content serving based on purchase

### **Test Cards (Stripe Test Mode):**
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`

## 🚨 **Error Handling**

### **Common Errors:**
1. **Payment Failed** - User-friendly error messages
2. **Webhook Failure** - Automatic retry and logging
3. **Network Issues** - Graceful fallback handling
4. **Invalid Purchase** - Clear error messaging

### **Monitoring:**
- **Stripe Dashboard** - Payment monitoring and analytics
- **Firebase Logs** - Backend error tracking
- **Webhook Logs** - Payment processing verification

## 📈 **Analytics & Monitoring**

### **Stripe Analytics:**
- Payment success rates
- Revenue tracking
- Customer insights
- Refund management

### **Custom Analytics:**
- Purchase conversion rates
- Content access patterns
- User behavior tracking
- Error monitoring

## 🔄 **Maintenance**

### **Regular Tasks:**
- Monitor webhook delivery
- Check payment success rates
- Review error logs
- Update Stripe API versions

### **Troubleshooting:**
- Webhook delivery issues
- Payment processing errors
- Content access problems
- User experience issues

## 📝 **API Reference**

### **Create Checkout Session:**
```javascript
POST /payments/checkout
{
  "userId": "string",
  "productType": "rental" | "regular" | "boxset",
  "successUrl": "string",
  "cancelUrl": "string"
}
```

### **Get Purchase Status:**
```javascript
GET /payments/status
Authorization: Bearer <token>
```

### **Get Purchase History:**
```javascript
GET /payments/history
Authorization: Bearer <token>
```

### **Get Receipt URL:**
```javascript
GET /payments/receipt/:purchaseId
Authorization: Bearer <token>
```

## ✅ **Deployment Status**

The Stripe integration is **fully deployed and production-ready**:

- ✅ **Backend API** - All endpoints deployed to Firebase Functions
- ✅ **Webhook Handler** - Configured and processing payments
- ✅ **Frontend Integration** - Complete checkout flow implemented
- ✅ **Content Access Control** - Backend-verified content serving
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Testing** - All purchase flows tested and verified

## 🎉 **Ready for Production**

The complete payment system is ready for production use with:
- Secure payment processing
- Automatic purchase verification
- Content access control
- User-friendly error handling
- Comprehensive monitoring

**Next Phase**: Ready to implement Mux video streaming! 🎥
