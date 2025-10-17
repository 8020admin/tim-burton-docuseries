# Firebase Setup & Security Guide

## 🔥 Complete Firebase Configuration

### **Step 1: Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `tim-burton-docuseries`
4. Enable Google Analytics: Yes
5. Click **"Create project"**

### **Step 2: Enable Required Services**

#### **Authentication:**
1. Go to **"Authentication"** in left menu
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Enable **"Email/Password"**
5. Enable **"Google"** and configure:
   - Project support email: your email
   - OAuth Client ID (from Google Cloud Console)

#### **Authorized Domains (Required for Password Reset):**
1. Go to **"Authentication"** → **"Settings"** tab
2. Scroll to **"Authorized domains"** section
3. Click **"Add domain"** and add:
   - `timburton-dev.webflow.io`
   - `tim-burton-docuseries.pages.dev`
   - Any production domains
4. **Important:** Without authorized domains, password reset links will fail with `auth/unauthorized-continue-uri` error

#### **Email Templates (Custom Password Reset):**
1. Go to **"Authentication"** → **"Templates"** tab
2. Click on **"Password reset"** template
3. Click **"Customize action URL"**
4. Enter: `https://timburton-dev.webflow.io/reset-password`
5. Click **"Save"**
   - This ensures password reset links point to your custom Webflow page
   - Users will see your branded reset page instead of Firebase's default

#### **Firestore Database:**
1. Go to **"Firestore Database"** in left menu
2. Click **"Create database"**
3. Choose **"Start in production mode"**
4. Choose location: `us-central1` (or closest to users)

#### **Cloud Functions:**
1. Go to **"Functions"** in left menu
2. Click **"Get started"**
3. Upgrade to **Blaze Plan** (pay-as-you-go)

### **Step 3: Get Firebase Config**

1. Go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"**
3. Click **Web icon** (</>) to add web app
4. Register app name: `tim-burton-web`
5. Copy the **Firebase SDK configuration**:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyA0ps2qHN9rFsb4zF3NmyZ7bAW6pcpBRFY",
  authDomain: "tim-burton-docuseries.firebaseapp.com",
  projectId: "tim-burton-docuseries",
  storageBucket: "tim-burton-docuseries.appspot.com",
  messagingSenderId: "939795747867",
  appId: "1:939795747867:web:..."
};
```

### **Step 4: Google OAuth Setup**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services > Credentials**
4. Find **OAuth 2.0 Client ID** (auto-created by Firebase)
5. Add **Authorized JavaScript origins**:
   ```
   https://timburton-dev.webflow.io
   https://tim-burton-docuseries.pages.dev
   http://localhost:8000
   ```
6. Add **Authorized redirect URIs**:
   ```
   https://timburton-dev.webflow.io
   https://tim-burton-docuseries.pages.dev
   ```

### **Step 5: Firestore Security Rules**

Go to **Firestore > Rules** and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
    
    // Purchases collection
    match /purchases/{purchaseId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow write: if false; // Only backend can write
    }
    
    // Content collection (admin only)
    match /content/{contentId} {
      allow read: if request.auth != null;
      allow write: if false; // Only backend can write
    }
  }
}
```

### **Step 6: Deploy Firebase Functions**

```bash
# Navigate to functions directory
cd src/backend/functions

# Install dependencies
npm install

# Deploy to Firebase
npm run deploy
```

**Functions Deployed:**
- ✅ `api` - Main Express API (authentication, payments, content)
- ✅ `stripeWebhook` - Stripe webhook handler
- ✅ `checkRentalExpirations` - Scheduled task (runs hourly for email notifications)

**Scheduled Functions:**

The `checkRentalExpirations` function runs automatically every hour to:
- Send 48-hour rental expiration warnings
- Send 24-hour rental expiration warnings  
- Send rental expired notifications

**Monitoring Scheduled Functions:**
```bash
# View logs for scheduled tasks
firebase functions:log --only checkRentalExpirations

# Test scheduled function manually in Firebase Console
# Go to Functions > checkRentalExpirations > Testing > Run Function
```

---

## 🔒 Security Best Practices

### **Firebase Service Account Keys**

#### **❌ NEVER do this:**
- Store JSON file in project directory
- Commit JSON file to git
- Put it in public folder
- Share via email or chat

#### **✅ DO this instead:**

**Method 1: Environment Variables (Recommended)**

1. Download service account JSON from Firebase Console:
   - Go to **Project Settings > Service Accounts**
   - Click **"Generate new private key"**

2. Extract values from JSON:
```json
{
  "project_id": "tim-burton-docuseries",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-xxxxx@tim-burton-docuseries.iam.gserviceaccount.com"
}
```

3. Set environment variables:
```bash
# Local development (.env file)
FIREBASE_PROJECT_ID=tim-burton-docuseries
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tim-burton-docuseries.iam.gserviceaccount.com

# Production (Firebase Functions - automatically uses default credentials)
# No manual setup needed when deployed to Firebase
```

**Method 2: Default Credentials (Production)**

When deployed to Firebase, use:
```javascript
import * as admin from 'firebase-admin';

// Firebase automatically provides credentials
admin.initializeApp();
```

### **API Key Security**

**Client-Side (Web API Key):**
- ✅ Safe to expose in client code
- ✅ Has restrictions set in Google Cloud Console
- ✅ Rate limited by Firebase

**Server-Side (Secret Keys):**
- ❌ Never expose in client code
- ✅ Use environment variables
- ✅ Restrict access with IAM rules

### **Firestore Security**

1. **Always use security rules** - Never leave in test mode
2. **Validate user authentication** - Check `request.auth`
3. **Restrict write access** - Backend only for sensitive data
4. **Use field-level security** - Don't expose sensitive fields
5. **Audit regularly** - Review rules and access patterns

---

## 🔧 CORS Configuration

Update `src/backend/functions/src/index.ts`:

```typescript
const allowedOrigins = [
  'https://tim-burton-docuseries.pages.dev',
  'https://timburton-dev.webflow.io',
  'http://localhost:8000',
  'http://localhost:8001'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS policy error'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
```

---

## 🗄️ Firestore Collections Schema

### **users/**
```javascript
{
  uid: "firebase-uid",
  email: "user@example.com",
  displayName: "User Name",
  photoURL: "https://...",
  createdAt: Timestamp,
  lastLoginAt: Timestamp,
  purchases: {
    currentAccess: {
      type: "regular|boxset|rental|null",
      expiresAt: Timestamp,
      purchasedAt: Timestamp
    }
  }
}
```

### **purchases/**
```javascript
{
  userId: "firebase-uid",
  stripeSessionId: "cs_...",
  type: "regular|boxset|rental",
  amount: 3999,
  currency: "usd",
  status: "completed",
  createdAt: Timestamp,
  expiresAt: Timestamp, // For rentals
  metadata: {
    receiptUrl: "https://...",
    customerEmail: "user@example.com"
  }
}
```

### **content/** (optional - for CMS)
```javascript
{
  contentId: "episode-1",
  title: "Episode 1 Title",
  description: "...",
  muxAssetId: "mux-asset-id",
  muxPlaybackId: "playback-id",
  duration: 3600,
  accessLevel: "regular|boxset",
  order: 1
}
```

---

## 🐛 Troubleshooting

### **Authentication not working:**
- Check Firebase Auth is enabled
- Verify OAuth Client ID is correct
- Check authorized domains in Google Cloud Console
- Review browser console for errors

### **Firestore permission denied:**
- Check security rules are deployed
- Verify user is authenticated
- Review rules match document structure
- Check field-level permissions

### **Functions deployment fails:**
- Verify Blaze plan is active
- Check Node.js version (18+)
- Ensure all dependencies are installed
- Review Cloud Functions logs

### **CORS errors:**
- Add domain to allowed origins
- Check credentials setting
- Verify preflight requests
- Review browser console

---

## 📊 Monitoring & Logs

### **Firebase Console:**
- **Authentication**: Monitor sign-ins
- **Firestore**: Check read/write operations
- **Functions**: View execution logs
- **Performance**: Track response times

### **Cloud Functions Logs:**
```bash
# View logs
firebase functions:log

# Filter by function
firebase functions:log --only api

# Real-time logs
firebase functions:log --follow
```

### **Firestore Usage:**
- Go to **Firestore > Usage**
- Monitor reads/writes/deletes
- Check storage usage
- Review quota limits

---

## ✅ Production Checklist

- [ ] Firebase project created
- [ ] Authentication enabled (Google + Email/Password)
- [ ] Firestore database created
- [ ] Security rules deployed (production mode)
- [ ] Cloud Functions deployed
- [ ] Service account configured
- [ ] OAuth domains whitelisted
- [ ] CORS configured
- [ ] Environment variables set
- [ ] Monitoring enabled
- [ ] Backup strategy defined

---

## 📝 Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Firestore Rules**: https://firebase.google.com/docs/firestore/security/rules-structure
- **Cloud Functions**: https://firebase.google.com/docs/functions
- **Authentication**: https://firebase.google.com/docs/auth

---

## 🚀 Status

**Production Ready** - All Firebase services configured and secured.

**Project ID**: `tim-burton-docuseries`  
**Region**: `us-central1`  
**API URL**: https://us-central1-tim-burton-docuseries.cloudfunctions.net/api

