# Security Guide - Firebase Keys Management

## 🔒 **How to Handle Firebase Service Account Keys Securely**

### **❌ NEVER do this:**
- Store the JSON file in the project directory
- Commit the JSON file to git
- Put it in any public folder
- Share it via email or chat

### **✅ DO this instead:**

## **Method 1: Environment Variables (Recommended)**

### **Step 1: Get the values from your JSON file**
When you download the Firebase service account JSON, you'll see something like:
```json
{
  "type": "service_account",
  "project_id": "tim-burton-docuseries",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@tim-burton-docuseries.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40tim-burton-docuseries.iam.gserviceaccount.com"
}
```

### **Step 2: Set environment variables**
Copy these values to your environment:

```bash
# In your terminal or .env file
export FIREBASE_PROJECT_ID="tim-burton-docuseries"
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
export FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@tim-burton-docuseries.iam.gserviceaccount.com"
```

### **Step 3: Use in Firebase Functions**
The code will automatically use these environment variables:

```javascript
// This is safe - reads from environment variables
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  })
});
```

## **Method 2: Secure File Storage (If needed)**

If you must store the file temporarily:

```bash
# Create secure directory outside project
mkdir ~/.firebase-keys

# Move the JSON file there
mv ~/Downloads/tim-burton-docuseries-key.json ~/.firebase-keys/

# Set proper permissions
chmod 600 ~/.firebase-keys/tim-burton-docuseries-key.json
```

## **Method 3: Firebase CLI (Easiest)**

The easiest way is to use Firebase CLI:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init functions

# This automatically handles authentication
```

## **🚨 Security Checklist**

- ✅ **JSON file deleted** from Downloads
- ✅ **Environment variables set** securely
- ✅ **File permissions** set to 600 (if using file method)
- ✅ **Never committed** to git
- ✅ **Backup stored** securely (password manager)
- ✅ **Team members** know not to share keys

## **🔧 For This Project**

We'll use **Method 1 (Environment Variables)** because:
- ✅ Most secure
- ✅ Works with Firebase Functions
- ✅ Easy to manage
- ✅ No files to accidentally commit

**Next step:** Once you have the Firebase project created, I'll show you exactly how to set up the environment variables!
