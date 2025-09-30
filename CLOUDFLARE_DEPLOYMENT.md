# Cloudflare Pages Deployment Guide

## 🎯 **Overview**

This guide will help you deploy the Tim Burton Docuseries project to Cloudflare Pages, which will host your static files and provide a fast, global CDN.

## 📋 **What We're Deploying**

- **Static Files**: JavaScript files, CSS, and any static assets
- **Webflow Integration**: The JavaScript files that will be used in Webflow
- **Testing Environment**: A complete test environment for Stripe integration

## 🚀 **Step 1: Prepare Files for Deployment**

### **Create a `public` directory structure:**

```
public/
├── js/
│   ├── client-auth.js
│   ├── webflow-auth-handlers.js
│   ├── content-access.js
│   ├── button-state-manager.js
│   └── stripe-integration.js
├── css/
│   └── styles.css (optional - for standalone testing)
├── test.html (for testing Stripe integration)
└── index.html (optional - landing page)
```

### **Files to Deploy:**

1. **JavaScript Files**: All files from `src/js/` → `public/js/`
2. **Test Environment**: `test-server.html` → `public/test.html`
3. **CSS**: Extract CSS from integration guide → `public/css/styles.css`

## 🚀 **Step 2: Cloudflare Pages Setup**

### **Option A: Connect GitHub Repository (Recommended)**

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add Cloudflare Pages deployment files"
   git push origin main
   ```

2. **Connect to Cloudflare Pages**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to **Pages** → **Create a project**
   - Connect your GitHub repository
   - Set build settings:
     - **Build command**: `echo "No build needed"`
     - **Build output directory**: `public`
     - **Root directory**: `/`

### **Option B: Direct Upload**

1. **Create a ZIP file** of the `public` directory
2. **Upload to Cloudflare Pages**:
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Click **Upload assets**
   - Upload your ZIP file

## 🚀 **Step 3: Environment Variables**

### **Set up environment variables in Cloudflow Pages:**

1. Go to your Cloudflare Pages project
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

```bash
# Firebase Configuration
VITE_FIREBASE_PROJECT_ID=tim-burton-docuseries
VITE_FIREBASE_API_KEY=your-firebase-api-key

# Stripe Configuration  
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# API Endpoints
VITE_API_BASE_URL=https://us-central1-tim-burton-docuseries.cloudfunctions.net/api
```

## 🚀 **Step 4: Update JavaScript Configuration**

### **Update `client-config.js` for production:**

```javascript
// Production configuration
const CONFIG = {
  apiBaseUrl: 'https://us-central1-tim-burton-docuseries.cloudfunctions.net/api',
  stripePublishableKey: 'pk_test_your_stripe_publishable_key', // Replace with your key
  googleClientId: '939795747867-b7t7hvnrmlakbhrcaqu51fcvrqlerdq8.apps.googleusercontent.com'
};

// Make config available globally
window.TIM_BURTON_CONFIG = CONFIG;
```

## 🚀 **Step 5: CORS Configuration**

### **Update Firebase Functions CORS settings:**

The Firebase Functions already have CORS configured, but we need to add your Cloudflare Pages domain:

```javascript
// In your Firebase Functions
const cors = require('cors')({
  origin: [
    'https://your-project.pages.dev',
    'https://your-custom-domain.com',
    'http://localhost:8000' // For local testing
  ]
});
```

## 🚀 **Step 6: Test the Deployment**

### **Test URLs:**

1. **Main Test Page**: `https://your-project.pages.dev/test.html`
2. **JavaScript Files**: `https://your-project.pages.dev/js/client-auth.js`
3. **Stripe Integration**: Test the full purchase flow

### **Test Checklist:**

- [ ] JavaScript files load correctly
- [ ] Authentication works (Google Sign-In + Email/Password)
- [ ] Stripe checkout sessions are created
- [ ] Purchase options modal works
- [ ] Session persistence works
- [ ] Content access control works

## 🚀 **Step 7: Webflow Integration**

### **Update Webflow with Cloudflare URLs:**

Replace the localhost URLs in your Webflow project with Cloudflare Pages URLs:

```html
<!-- In Webflow Project Settings > Custom Code > Head Code -->
<script src="https://your-project.pages.dev/js/client-auth.js"></script>
<script src="https://your-project.pages.dev/js/webflow-auth-handlers.js"></script>
<script src="https://your-project.pages.dev/js/content-access.js"></script>
<script src="https://your-project.pages.dev/js/button-state-manager.js"></script>
<script src="https://your-project.pages.dev/js/stripe-integration.js"></script>
```

## 🚀 **Step 8: Custom Domain (Optional)**

### **Set up custom domain:**

1. **Add domain in Cloudflare Pages**:
   - Go to your project → **Custom domains**
   - Add your domain (e.g., `api.timburton-docuseries.com`)

2. **Update DNS records**:
   - Add CNAME record pointing to your Cloudflare Pages URL

3. **Update CORS settings**:
   - Add your custom domain to Firebase Functions CORS origins

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **CORS Errors**: Make sure your Cloudflare domain is added to Firebase Functions CORS
2. **JavaScript Not Loading**: Check file paths and ensure files are in the correct directory
3. **Stripe Errors**: Verify your Stripe keys are correct and in test mode
4. **Authentication Issues**: Check Firebase configuration and Google OAuth settings

### **Debug Steps:**

1. **Check Browser Console** for JavaScript errors
2. **Verify Network Requests** in browser dev tools
3. **Test API Endpoints** directly
4. **Check Cloudflare Pages logs** for build issues

## 📊 **Monitoring**

### **Cloudflare Analytics:**
- Page views and performance metrics
- Geographic distribution of users
- Cache hit rates

### **Firebase Analytics:**
- Authentication events
- Purchase conversions
- User behavior

## 🎯 **Next Steps After Deployment**

1. **Test Stripe Integration** with real test cards
2. **Set up Webhooks** for production
3. **Configure Domain** for production
4. **Set up Monitoring** and alerts
5. **Performance Optimization**

---

## 🚀 **Ready to Deploy!**

Follow these steps to get your Tim Burton Docuseries project live on Cloudflare Pages with full Stripe integration!
