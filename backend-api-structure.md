# Backend API Structure

## 🔒 **Secure Backend Architecture**

Since Webflow will host the frontend, we need a **separate backend API** to handle all sensitive operations securely.

## 🏗️ **Backend Requirements**

### **What the Backend Handles:**
- ✅ **Firebase Admin SDK** (server-side only)
- ✅ **Stripe secret keys** (never exposed to client)
- ✅ **Mux API keys** (server-side only)
- ✅ **SendGrid API keys** (server-side only)
- ✅ **Database operations** (Firestore admin)
- ✅ **Signed URL generation** (secure video access)
- ✅ **Payment processing** (Stripe webhooks)
- ✅ **Regional validation** (Cloudflare integration)

### **What the Frontend (Webflow) Handles:**
- ✅ **User interface** (HTML/CSS in Webflow)
- ✅ **Client-side JavaScript** (safe, public code)
- ✅ **API communication** (calls to backend)
- ✅ **User interactions** (buttons, forms, modals)

## 📡 **API Endpoints Structure**

```
https://your-api-domain.com/api/
├── auth/
│   ├── POST /google          # Google Sign-In
│   ├── POST /email           # Email/password auth
│   ├── POST /signup          # User registration
│   ├── POST /logout          # User logout
│   ├── GET  /status          # Check auth status
│   └── POST /reset-password  # Password reset
├── payments/
│   ├── POST /create-intent   # Create Stripe payment intent
│   ├── POST /confirm         # Confirm payment
│   ├── GET  /history/:userId # Payment history
│   └── GET  /receipt/:id     # Download receipt
├── content/
│   ├── POST /signed-url      # Get signed video URL
│   ├── POST /progress        # Save watch progress
│   ├── GET  /progress/:id    # Get watch progress
│   └── POST /access          # Check content access
└── users/
    ├── GET  /profile         # Get user profile
    ├── PUT  /profile         # Update user profile
    ├── POST /export-data     # GDPR data export
    └── DELETE /account       # Delete account
```

## 🔐 **Security Implementation**

### **Environment Variables (Backend Only):**
```bash
# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Mux
MUX_TOKEN_ID=your-token-id
MUX_TOKEN_SECRET=your-token-secret

# SendGrid
SENDGRID_API_KEY=SG...

# Cloudflare
CLOUDFLARE_API_TOKEN=your-token
CLOUDFLARE_ZONE_ID=your-zone-id
```

### **Client-Side Security:**
- ✅ **No API keys** in client code
- ✅ **HTTPS only** communication
- ✅ **CORS protection** on backend
- ✅ **Rate limiting** on sensitive endpoints
- ✅ **Input validation** on all requests

## 🚀 **Deployment Options**

### **Option 1: Vercel/Netlify Functions**
- **Pros:** Easy deployment, serverless
- **Cons:** Limited to function timeouts
- **Best for:** Simple API operations

### **Option 2: Firebase Functions**
- **Pros:** Integrates with Firebase, easy setup
- **Cons:** Cold start delays
- **Best for:** Firebase-heavy operations

### **Option 3: Node.js/Express Server**
- **Pros:** Full control, better performance
- **Cons:** More complex setup
- **Best for:** Complex operations, real-time features

### **Option 4: Serverless Framework**
- **Pros:** Multi-cloud, scalable
- **Cons:** Learning curve
- **Best for:** Production applications

## 📋 **Next Steps**

1. **Choose backend deployment** (I recommend Firebase Functions for simplicity)
2. **Set up backend API** with all endpoints
3. **Configure environment variables** securely
4. **Test API endpoints** with Postman/curl
5. **Update client code** to use API endpoints
6. **Deploy and test** full integration

## 🔄 **Data Flow**

```
User Action (Webflow) 
    ↓
Client JavaScript (Safe)
    ↓
API Call to Backend
    ↓
Backend API (Secure)
    ↓
Service Integration (Firebase/Stripe/Mux)
    ↓
Response to Client
    ↓
Update UI (Webflow)
```

**This architecture ensures NO sensitive data is exposed in the Webflow frontend!**
