# Authentication Setup - Tim Burton Docuseries

## 🎯 **Overview**

This document outlines the complete authentication system setup for the Tim Burton Docuseries platform, including Firebase Authentication, Google Sign-In, and client-side integration.

## ✅ **What's Been Implemented**

### **1. Firebase Authentication Setup**
- ✅ Google Sign-In enabled in Firebase Console
- ✅ Firebase Functions deployed with authentication endpoints
- ✅ Firestore security rules configured
- ✅ Client-side authentication code created

### **2. API Endpoints**

**Base URL:** `https://us-central1-tim-burton-docuseries.cloudfunctions.net/api`

#### **Authentication Endpoints:**

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/auth/google` | Sign in with Google | `{ "idToken": "google_id_token" }` | `{ "success": true, "user": {...}, "customToken": "..." }` |
| POST | `/auth/verify` | Verify custom token | `{ "token": "custom_token" }` | `{ "success": true, "user": {...} }` |
| GET | `/auth/user` | Get user data | `?uid=user_id` | `{ "success": true, "user": {...} }` |
| POST | `/auth/refresh` | Refresh custom token | `{ "uid": "user_id" }` | `{ "success": true, "customToken": "..." }` |
| GET | `/health` | Health check | - | `{ "status": "ok", "message": "...", "timestamp": "..." }` |

### **3. Firestore Security Rules**

```javascript
// Users can only access their own data
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// Users can only access their own purchases
match /purchases/{purchaseId} {
  allow read, write: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && 
    request.resource.data.userId == request.auth.uid;
}

// Content is read-only for authenticated users
match /content/{contentId} {
  allow read: if request.auth != null;
  allow write: if false; // Only admins can write
}
```

## 🔧 **Configuration Required**

### **1. Google OAuth Client ID**

**You need to replace the placeholder in the client code:**

**File:** `src/js/client-auth.js`
**Line 25:** Replace `YOUR_GOOGLE_OAUTH_CLIENT_ID` with your actual Google OAuth client ID

**To get your Google OAuth Client ID:**
1. Go to Firebase Console → Authentication → Sign-in method → Google
2. Copy the "Web SDK configuration" client ID
3. Replace the placeholder in the client code

### **2. Environment Variables**

**File:** `functions/.env`
```bash
FIREBASE_PROJECT_ID=tim-burton-docuseries
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tim-burton-docuseries.iam.gserviceaccount.com
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id-here
```

## 🚀 **How to Use in Webflow**

### **1. Add Scripts to Webflow**

Add these scripts to your Webflow project in the `<head>` section:

```html
<!-- Google Sign-In -->
<script src="https://accounts.google.com/gsi/client"></script>

<!-- Tim Burton Auth -->
<script src="https://your-domain.com/path/to/client-auth.js"></script>
```

### **2. HTML Structure for Sign-In Button**

```html
<!-- Sign-In Button Container -->
<div id="google-signin-button"></div>

<!-- User Info (hidden by default) -->
<div id="user-info" style="display: none;">
  <img id="user-avatar" src="" alt="User Avatar">
  <span id="user-name"></span>
  <button id="sign-out-btn">Sign Out</button>
</div>
```

### **3. JavaScript Event Listeners**

```javascript
// Listen for authentication events
document.addEventListener('timBurtonAuth', (event) => {
  const { type, data, user, isSignedIn } = event.detail;
  
  switch (type) {
    case 'signIn':
    case 'sessionRestored':
      // User is signed in
      document.getElementById('google-signin-button').style.display = 'none';
      document.getElementById('user-info').style.display = 'block';
      document.getElementById('user-avatar').src = user.picture;
      document.getElementById('user-name').textContent = user.name;
      break;
      
    case 'signOut':
      // User signed out
      document.getElementById('google-signin-button').style.display = 'block';
      document.getElementById('user-info').style.display = 'none';
      break;
      
    case 'signInError':
      // Handle sign-in error
      console.error('Sign-in error:', data.error);
      break;
  }
});

// Initialize Google Sign-In button
document.addEventListener('DOMContentLoaded', () => {
  // Wait for auth to be ready
  setTimeout(() => {
    if (window.timBurtonAuth) {
      window.timBurtonAuth.renderGoogleSignInButton('google-signin-button');
    }
  }, 1000);
});

// Sign out button
document.getElementById('sign-out-btn').addEventListener('click', () => {
  if (window.timBurtonAuth) {
    window.timBurtonAuth.signOut();
  }
});
```

## 🧪 **Testing the Authentication**

### **1. Test API Endpoints**

```bash
# Health check
curl https://us-central1-tim-burton-docuseries.cloudfunctions.net/api/health

# Test with a valid Google ID token
curl -X POST https://us-central1-tim-burton-docuseries.cloudfunctions.net/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "your_google_id_token_here"}'
```

### **2. Test Client-Side Integration**

1. Open your Webflow site
2. Check browser console for authentication events
3. Test sign-in/sign-out functionality
4. Verify user data is stored in localStorage

## 🔒 **Security Features**

- ✅ **Token-based authentication** with custom tokens
- ✅ **Secure API endpoints** with proper error handling
- ✅ **Firestore security rules** protecting user data
- ✅ **CORS protection** for API endpoints
- ✅ **Session management** with localStorage
- ✅ **Token verification** on every request

## 📝 **Next Steps**

1. **Replace Google OAuth Client ID** in client code
2. **Test authentication flow** in Webflow
3. **Implement payment integration** (Stripe)
4. **Add video streaming** (Mux)
5. **Set up content management** (Firestore collections)

## 🐛 **Troubleshooting**

### **Common Issues:**

1. **"Invalid ID token" error:**
   - Check that Google Sign-In is enabled in Firebase Console
   - Verify the Google OAuth Client ID is correct

2. **CORS errors:**
   - Ensure the API endpoints are properly configured with CORS
   - Check that the client is making requests to the correct domain

3. **"User not found" error:**
   - Verify Firestore security rules are deployed
   - Check that the user document exists in Firestore

4. **Session not restoring:**
   - Check localStorage for stored user data
   - Verify the custom token is still valid

## 📞 **Support**

If you encounter any issues with the authentication setup, check:
1. Firebase Console for error logs
2. Browser console for client-side errors
3. Network tab for API request/response details
