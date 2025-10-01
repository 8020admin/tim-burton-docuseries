# Webflow Integration Guide - Tim Burton Docuseries

## 🎯 **Overview**

This guide shows you how to integrate the authentication system into your Webflow project. The system supports both Google Sign-In and Email/Password authentication.

## 🏗️ **Clean Architecture**

Our authentication system follows a **clean, unified architecture** designed for maintainability and security:

### **Authentication Flow**
```
1. User Action (Sign In/Sign Up)
   ↓
2. Firebase Auth SDK (client-side)
   ↓
3. Get ID Token
   ↓
4. Sync with Backend (/auth/session endpoint)
   ↓
5. Fetch Purchase Status
   ↓
6. Update UI
```

### **Key Principles**
- ✅ **All authentication happens client-side** via Firebase Auth SDK
- ✅ **One backend endpoint** (`/auth/session`) for token verification
- ✅ **Single source of truth** - Firebase `onAuthStateChanged` listener
- ✅ **Unified localStorage** - One key (`timBurtonSession`) with consistent schema
- ✅ **Proper error handling** - Clear error messages and loading states
- ✅ **No patchwork** - Clean separation of concerns

### **What This Means**
- 🔒 More secure (Firebase handles password verification)
- 🚀 Faster (no unnecessary backend calls)
- 🛠️ Easier to maintain (one clear flow)
- 📱 Industry standard (Firebase best practices)
- 🔄 Session persistence works correctly

## 📋 **What You Need to Add to Webflow**

### **1. Scripts to Add in Project Settings**

Go to **Project Settings > Custom Code > Head Code** and add:

```html
<!-- Google Sign-In -->
<script src="https://accounts.google.com/gsi/client"></script>

<!-- Tim Burton Auth (host these files on your domain) -->
<script src="https://your-domain.com/path/to/client-auth.js"></script>
<script src="https://your-domain.com/path/to/webflow-auth-handlers.js"></script>
<script src="https://your-domain.com/path/to/content-access.js"></script>
<script src="https://your-domain.com/path/to/button-state-manager.js"></script>
<script src="https://your-domain.com/path/to/stripe-integration.js"></script>
```

### **2. HTML Structure for Authentication Modal**

Add this HTML structure to your Webflow project:

```html
<!-- Authentication Modal -->
<div class="auth-modal" id="auth-modal" style="display: none;">
  <div class="auth-modal-content">
    <div class="auth-modal-header">
      <h2>Sign In to Watch</h2>
      <button class="auth-close" id="auth-close">&times;</button>
    </div>
    
    <div class="auth-tabs">
      <button class="auth-tab active" data-tab="signin">Sign In</button>
      <button class="auth-tab" data-tab="signup">Sign Up</button>
    </div>
    
    <!-- Sign In Tab -->
    <div class="auth-tab-content active" id="signin-tab">
      <!-- Google Sign-In Button -->
      <div id="google-signin-button" class="google-signin-container"></div>
      
      <div class="auth-divider">
        <span>or</span>
      </div>
      
      <!-- Email Sign-In Form -->
      <form id="email-signin-form" class="auth-form">
        <div class="form-group">
          <input type="email" id="signin-email" placeholder="Email" required>
        </div>
        <div class="form-group">
          <input type="password" id="signin-password" placeholder="Password" required>
        </div>
        <button type="submit" class="auth-btn">Sign In</button>
        <a href="#" id="forgot-password" class="forgot-password">Forgot Password?</a>
      </form>
    </div>
    
    <!-- Sign Up Tab -->
    <div class="auth-tab-content" id="signup-tab">
      <!-- Google Sign-In Button -->
      <div id="google-signup-button" class="google-signin-container"></div>
      
      <div class="auth-divider">
        <span>or</span>
      </div>
      
      <!-- Email Sign-Up Form -->
      <form id="email-signup-form" class="auth-form">
        <div class="form-group">
          <input type="text" id="signup-name" placeholder="Full Name" required>
        </div>
        <div class="form-group">
          <input type="email" id="signup-email" placeholder="Email" required>
        </div>
        <div class="form-group">
          <input type="password" id="signup-password" placeholder="Password" required>
        </div>
        <button type="submit" class="auth-btn">Sign Up</button>
      </form>
    </div>
  </div>
</div>

<!-- Purchase Options Modal -->
<div class="purchase-modal" id="purchase-options-modal" style="display: none;">
  <div class="purchase-modal-content">
    <div class="purchase-modal-header">
      <h2>Choose Your Purchase</h2>
      <button class="close-btn">&times;</button>
    </div>
    
    <div class="purchase-options">
      <div class="purchase-option">
        <h3>Regular Purchase</h3>
        <p class="price">$24.99</p>
        <p class="description">4 episodes of the docuseries</p>
        <button id="regular-purchase-btn" class="purchase-btn">Purchase</button>
      </div>
      
      <div class="purchase-option featured">
        <h3>Box Set</h3>
        <p class="price">$74.99</p>
        <p class="description">4 episodes + 40 hours of extras</p>
        <button id="box-set-purchase-btn" class="purchase-btn">Purchase</button>
      </div>
    </div>
  </div>
</div>

<!-- User Info (shown when signed in) -->
<div class="user-info" id="user-info" style="display: none;">
  <img id="user-avatar" src="" alt="User Avatar" class="user-avatar">
  <span id="user-name" class="user-name"></span>
  <button id="sign-out-btn" class="sign-out-btn">Sign Out</button>
</div>

<!-- Sign In Button (shown when not signed in) -->
<button class="sign-in-btn" id="sign-in-btn">Sign In</button>
```

### **3. Button System for Dynamic States**

The system now supports three button states based on user authentication and purchase status:

#### **Button States:**
- **Not signed in**: Sign In + Rent + Buy buttons
- **Signed in but not paid**: Sign Out + Rent + Buy buttons  
- **Signed in and paid**: Sign Out + Watch Now button

#### **Button HTML Structure:**
Add these data attributes to your buttons in Webflow:

```html
<!-- Sign In/Sign Out Button -->
<button data-button-type="sign-in">Sign In</button>
<button data-button-type="sign-out" style="display: none;">Sign Out</button>

<!-- Rent/Buy/Watch Now Buttons -->
<button data-button-type="rent">Rent</button>
<button data-button-type="buy">Buy</button>
<button data-button-type="watch-now" style="display: none;">Watch Now</button>
```

#### **Content Access Control:**
Add these data attributes to control content visibility:

```html
<!-- Content for authenticated users only -->
<div data-auth-required="true">Authenticated content</div>

<!-- Content for paid users only -->
<div data-purchase-required="true">Paid content</div>

<!-- Content for box set purchasers only -->
<div data-boxset-required="true">Box set content</div>

<!-- Content for non-authenticated users -->
<div data-show-not-signed-in="true">Public content</div>

<!-- Content for authenticated but not paid users -->
<div data-show-not-paid="true">Sign up prompt</div>

<!-- Upgrade prompt for regular purchasers -->
<div data-upgrade-prompt="true">Upgrade to Box Set</div>
```

### **4. JavaScript Event Handlers**

**No need to add JavaScript to Webflow!** All the event handlers are now in separate files that you'll host on your domain.

The JavaScript files include:
1. `client-auth.js` - Core authentication functionality with purchase tracking
2. `webflow-auth-handlers.js` - Webflow-specific event handlers
3. `content-access.js` - Content visibility control based on auth/purchase status
4. `button-state-manager.js` - Dynamic button state management
5. `stripe-integration.js` - Stripe payment processing and checkout

## 🎨 **CSS Styling (Optional)**

Add this CSS to **Project Settings > Custom Code > Head Code** for basic styling:

```css
<style>
/* Auth Modal */
.auth-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.auth-modal-content {
  background: white;
  padding: 30px;
  border-radius: 10px;
  width: 90%;
  max-width: 400px;
  position: relative;
}

.auth-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.auth-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.auth-tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.auth-tab {
  background: none;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.auth-tab.active {
  border-bottom-color: #007bff;
}

.auth-tab-content {
  display: none;
}

.auth-tab-content.active {
  display: block;
}

.google-signin-container {
  margin-bottom: 20px;
  text-align: center;
}

.auth-divider {
  text-align: center;
  margin: 20px 0;
  position: relative;
}

.auth-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #eee;
}

.auth-divider span {
  background: white;
  padding: 0 15px;
  color: #666;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
}

.auth-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
}

.auth-btn:hover {
  background: #0056b3;
}

.forgot-password {
  text-align: center;
  color: #007bff;
  text-decoration: none;
  font-size: 14px;
}

/* User Info */
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.user-name {
  font-weight: bold;
}

.sign-out-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.sign-out-btn:hover {
  background: #c82333;
}

/* Sign In Button */
.sign-in-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.sign-in-btn:hover {
  background: #0056b3;
}

/* Loading Spinner */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-btn.loading {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Purchase Options Modal */
.purchase-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
}

.purchase-modal-content {
  background: white;
  padding: 30px;
  border-radius: 10px;
  width: 90%;
  max-width: 600px;
  position: relative;
}

.purchase-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.purchase-modal-header h2 {
  margin: 0;
  font-size: 24px;
}

.purchase-modal .close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.purchase-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.purchase-option {
  border: 2px solid #eee;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.purchase-option:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.purchase-option.featured {
  border-color: #007bff;
  background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%);
  position: relative;
}

.purchase-option.featured::before {
  content: "Most Popular";
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #007bff;
  color: white;
  padding: 5px 15px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
}

.purchase-option h3 {
  margin: 0 0 10px 0;
  font-size: 20px;
  color: #333;
}

.purchase-option .price {
  font-size: 32px;
  font-weight: bold;
  color: #007bff;
  margin: 10px 0;
}

.purchase-option .description {
  color: #666;
  margin: 10px 0 20px 0;
  line-height: 1.4;
}

.purchase-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  transition: background 0.3s ease;
}

.purchase-btn:hover {
  background: #0056b3;
}

.purchase-option.featured .purchase-btn {
  background: #28a745;
}

.purchase-option.featured .purchase-btn:hover {
  background: #218838;
}

/* Responsive Design */
@media (max-width: 768px) {
  .purchase-options {
    grid-template-columns: 1fr;
  }
  
  .purchase-modal-content {
    margin: 20px;
    padding: 20px;
  }
}
</style>
```

## 🚀 **Testing the Integration**

### **✅ Successfully Tested & Verified!**

The authentication system has been thoroughly tested in the Webflow environment and is working perfectly:

1. **✅ Google Sign-In** - OAuth flow working correctly
2. **✅ Email/Password Sign-In** - Form validation and authentication working
3. **✅ Email/Password Sign-Up** - User creation and account setup functional
4. **✅ Sign-Out Functionality** - Proper session termination and UI state reset
5. **✅ Session Restoration** - User stays logged in after page refresh
6. **✅ Error Handling** - Proper error messages and fallback mechanisms
7. **✅ UI State Management** - Smooth transitions between authenticated/unauthenticated states

### **Test Results:**
- **Webflow Integration**: Perfect modal functionality with tab switching
- **Firebase Backend**: All API endpoints responding correctly
- **Security**: Custom tokens working, proper CORS configuration
- **User Experience**: Clean, intuitive authentication flow
- **Button States**: Dynamic button management working correctly
- **Content Access Control**: HTML attributes properly controlling content visibility
- **Stripe Integration**: Complete payment processing system deployed and ready
- **Purchase Tracking**: Backend verification system working with Stripe webhooks

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"Authentication system not loaded" error:**
   - Check that the client-auth.js script is loading correctly
   - Verify the script URL is accessible

2. **Google Sign-In not working:**
   - Check that Google OAuth Client ID is correct
   - Verify authorized domains in Google Cloud Console

3. **Email authentication not working:**
   - Check that Email/Password is enabled in Firebase Console
   - Verify the API endpoints are responding correctly

4. **Session not restoring:**
   - Check localStorage for stored user data
   - Verify the custom token is still valid

## 📝 **Next Steps**

### **✅ Authentication Complete - Ready for Next Phase!**

The authentication system is **fully functional and production-ready** in Webflow! 

**Next development phases:**
1. **✅ Authentication System** - Complete and tested
2. **✅ Button State Management** - Complete and ready
3. **✅ Content Access Control** - Complete and ready
4. **✅ Stripe Payment Integration** - Complete and deployed
5. **🚀 Mux Video Streaming** - Ready to begin
6. **📝 Content Management** - Final phase

**The complete authentication and payment system is ready - let's add video streaming!** 🎥
