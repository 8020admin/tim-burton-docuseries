# Firebase Setup Guide

## 🔥 **Complete Firebase Setup Instructions**

### **Step 1: Create Firebase Project**

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Click "Create a project"**
3. **Enter project name:** `tim-burton-docuseries`
4. **Enable Google Analytics:** Yes
5. **Choose Analytics account:** Create new or use existing
6. **Click "Create project"**

### **Step 2: Enable Required Services**

#### **Authentication:**
1. **Go to "Authentication" in left menu**
2. **Click "Get started"**
3. **Go to "Sign-in method" tab**
4. **Enable "Email/Password"**
5. **Enable "Google"** and configure:
   - **Project support email:** your email
   - **Web SDK configuration:** We'll get this later

#### **Firestore Database:**
1. **Go to "Firestore Database" in left menu**
2. **Click "Create database"**
3. **Choose "Start in test mode"** (we'll secure it later)
4. **Choose location:** `us-central1` (or closest to your users)

#### **Functions:**
1. **Go to "Functions" in left menu**
2. **Click "Get started"**
3. **Follow the setup instructions**

### **Step 3: Get Service Account Keys**

1. **Go to Project Settings** (gear icon)
2. **Go to "Service accounts" tab**
3. **Click "Generate new private key"**
4. **Download the JSON file** - keep this secure!

### **Step 4: Set Up Environment Variables**

#### **Install Firebase CLI:**
```bash
npm install -g firebase-tools
```

#### **Login to Firebase:**
```bash
firebase login
```

#### **Navigate to backend directory:**
```bash
cd src/backend
```

#### **Initialize Firebase Functions:**
```bash
firebase init functions
```
- **Choose TypeScript:** Yes
- **Install dependencies:** Yes

#### **Set Environment Variables:**
```bash
# Set Firebase configuration
firebase functions:config:set firebase.project_id="tim-burton-docuseries"
firebase functions:config:set firebase.private_key="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
firebase functions:config:set firebase.client_email="firebase-adminsdk-xxxxx@tim-burton-docuseries.iam.gserviceaccount.com"

# Set other service variables (we'll add these as we set up each service)
firebase functions:config:set stripe.secret_key="sk_live_..."
firebase functions:config:set mux.token_id="your-token-id"
firebase functions:config:set mux.token_secret="your-token-secret"
firebase functions:config:set sendgrid.api_key="SG..."
```

### **Step 5: Deploy Functions**

```bash
# Install dependencies
cd functions
npm install

# Build the functions
npm run build

# Deploy to Firebase
firebase deploy --only functions
```

### **Step 6: Get Your API URL**

After deployment, you'll get a URL like:
```
https://us-central1-tim-burton-docuseries.cloudfunctions.net/api
```

**Update your client configuration** with this URL:
```javascript
// In src/js/client-config.js
api: {
  baseUrl: "https://us-central1-tim-burton-docuseries.cloudfunctions.net/api"
}
```

## 🔒 **Security Checklist**

- ✅ **Firebase project created**
- ✅ **Authentication enabled** (Email + Google)
- ✅ **Firestore database created**
- ✅ **Functions enabled**
- ✅ **Service account JSON downloaded**
- ✅ **Environment variables set** via Firebase CLI
- ✅ **JSON file deleted** from computer
- ✅ **Functions deployed** successfully

## 🧪 **Test Your Setup**

### **Test the API:**
```bash
curl https://us-central1-tim-burton-docuseries.cloudfunctions.net/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📋 **Next Steps**

1. **Confirm Firebase setup** is working
2. **Set up Stripe** (next service)
3. **Set up Mux** (video streaming)
4. **Set up SendGrid** (emails)
5. **Test full integration**

**Ready to proceed with Stripe setup?**
