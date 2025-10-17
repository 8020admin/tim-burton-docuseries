# Webflow Integration Guide - Tim Burton Docuseries

## 🎯 **Overview**

This guide shows you how to integrate the authentication system into your Webflow project. The system uses **data attributes** for all interactions, making it flexible and easy to integrate without ID or class conflicts.

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
- ✅ **Attribute-based interactions** - No IDs or classes for JavaScript
- ✅ **Namespaced CSS classes** - All critical classes prefixed with `tb-` to prevent conflicts
- ✅ **Proper error handling** - Clear error messages and loading states
- ✅ **No patchwork** - Clean separation of concerns

### **What This Means**
- 🔒 More secure (Firebase handles password verification)
- 🚀 Faster (no unnecessary backend calls)
- 🛠️ Easier to maintain (one clear flow)
- 📱 Industry standard (Firebase best practices)
- 🔄 Session persistence works correctly
- 🎯 No ID conflicts with Webflow

---

## 🏷️ **Naming Conventions**

### **CSS Classes (Prefixed with `tb-`)**
To prevent conflicts with Webflow's existing styles, **all critical CSS classes are prefixed with `tb-`** (Tim Burton):

- `.tb-active` - Active state for tabs and content
- `.tb-spinner` - Loading spinner animation
- `.tb-loading` - Loading state for buttons
- `@keyframes tb-spin` - Spinner animation keyframes

**Why This Matters:**
- ✅ **No conflicts** with Webflow's existing `.active`, `.loading`, or other generic classes
- ✅ **Clear ownership** - you know which classes belong to this authentication system
- ✅ **Safer integration** - your Webflow styles won't interfere with authentication functionality

### **Data Attributes (Hyphenated)**
All data attributes use **hyphenated naming** for consistency and readability:

**Button Types:**
- ✅ `data-button-type="sign-in"` (recommended)
- ✅ `data-button-type="sign-out"` (recommended)
- ℹ️ Also supports: `"signin"` and `"signout"` (for backwards compatibility)

**Content Visibility:**
- ✅ `data-show-not-signed-in="true"` - Shows when user is NOT signed in
- ✅ `data-show-not-paid="true"` - Shows when signed in but hasn't purchased
- ✅ `data-upgrade-prompt="true"` - Shows upgrade prompt for regular purchasers

**Important:** Always use the hyphenated versions shown in this guide for consistency!

---

## 📋 **1. Scripts to Add in Webflow**

Go to **Project Settings > Custom Code > Head Code** and add:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>

<!-- Google Sign-In -->
<script src="https://accounts.google.com/gsi/client"></script>

<!-- HLS.js for video playback -->
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>

<!-- Google Cast SDK for Chromecast -->
<script src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"></script>

<!-- Tim Burton Auth & Video Player (Cloudflare Pages) -->
<script src="https://tim-burton-docuseries.pages.dev/js/client-auth.js"></script>
<script src="https://tim-burton-docuseries.pages.dev/js/webflow-auth-handlers.js"></script>
<script src="https://tim-burton-docuseries.pages.dev/js/content-access.js"></script>
<script src="https://tim-burton-docuseries.pages.dev/js/button-state-manager.js"></script>
<script src="https://tim-burton-docuseries.pages.dev/js/stripe-integration.js"></script>
<script src="https://tim-burton-docuseries.pages.dev/js/user-profile.js"></script>
<script src="https://tim-burton-docuseries.pages.dev/js/video-player.js"></script>
<script src="https://tim-burton-docuseries.pages.dev/js/content-manager.js"></script>
<script src="https://tim-burton-docuseries.pages.dev/js/init-video-player.js"></script>

<!-- Page-Specific Scripts (add to specific pages only, not globally) -->
<!-- Account Page (add to /account page only) -->
<!-- <script src="https://tim-burton-docuseries.pages.dev/js/account-page.js"></script> -->

<!-- Episodes Page (add to /episodes page only) -->
<!-- <script src="https://tim-burton-docuseries.pages.dev/js/episodes-page.js"></script> -->

<!-- Password Reset Page (add to /reset-password page only) -->
<!-- <script src="https://tim-burton-docuseries.pages.dev/js/password-reset-page.js"></script> -->
```

---

## 🔐 **2. Authentication Modal**

### **Modal Container**
Create a div and add these attributes:

**Webflow Settings:**
- Custom Attribute: `data-modal` = `auth`
- Set initial style: `display: none`

```html
<div data-modal="auth" style="display: none;">
  <!-- Modal content -->
</div>
```

### **Close Button**
Any button inside the modal can close it:

**Webflow Settings:**
- Custom Attribute: `data-modal-action` = `close`

```html
<button data-modal-action="close">×</button>
```

### **Modal Headings (Sign In vs Sign Up)**

You can now have **separate headings** for the Sign In and Sign Up tabs:

**Sign In Heading:**
- Custom Attribute: `data-modal-heading` = `signin`

```html
<h2 data-modal-heading="signin">Sign In to Watch</h2>
```

**Sign Up Heading:**
- Custom Attribute: `data-modal-heading` = `signup`

```html
<h2 data-modal-heading="signup">Create Your Account</h2>
```

**How It Works:**
- The system automatically shows/hides the correct heading based on which tab is active
- When user switches to "Sign In" tab → Sign In heading shows, Sign Up heading hides
- When user switches to "Sign Up" tab → Sign Up heading shows, Sign In heading hides

**Note:** If you don't add these attributes, the system will work fine with a single shared heading.

---

### **Tab Buttons**
For switching between Sign In and Sign Up:

**Sign In Tab:**
- Custom Attribute: `data-auth-tab` = `signin`
- Add class `tb-active` for default state

**Sign Up Tab:**
- Custom Attribute: `data-auth-tab` = `signup`

```html
<button data-auth-tab="signin" class="tb-active">Sign In</button>
<button data-auth-tab="signup">Sign Up</button>
```

### **Tab Content**
Containers for each tab's content:

**Sign In Content:**
- Custom Attribute: `data-auth-tab-content` = `signin`
- Add class `tb-active` for default state

**Sign Up Content:**
- Custom Attribute: `data-auth-tab-content` = `signup`

```html
<div data-auth-tab-content="signin" class="tb-active">
  <!-- Sign in form -->
</div>

<div data-auth-tab-content="signup">
  <!-- Sign up form -->
</div>
```

---

## 📝 **3. Authentication Forms**

### **Sign In Form**
Create a form with these attributes:

**Form:**
- Custom Attribute: `data-form` = `signin`

**Email Input:**
- Custom Attribute: `data-field` = `email`
- Type: `email`
- Required: Yes

**Password Input:**
- Custom Attribute: `data-field` = `password`
- Type: `password`
- Required: Yes

```html
<form data-form="signin">
  <input type="email" data-field="email" placeholder="Email" required>
  <input type="password" data-field="password" placeholder="Password" required>
  <button type="submit">Sign In</button>
</form>
```

**Note:** Passwords must meet the following requirements:
- Minimum 8 characters, maximum 128 characters
- At least one lowercase letter, one uppercase letter, and one number

### **Sign Up Form**
Create a form with these attributes:

**Form:**
- Custom Attribute: `data-form` = `signup`

**Name Input:**
- Custom Attribute: `data-field` = `name`
- Type: `text`
- Placeholder: "First Name"

**Email Input:**
- Custom Attribute: `data-field` = `email`
- Type: `email`
- Required: Yes

**Password Input:**
- Custom Attribute: `data-field` = `password`
- Type: `password`
- Required: Yes
- **Password Requirements:**
  - Minimum 8 characters
  - Maximum 128 characters
  - At least one lowercase letter (a-z)
  - At least one uppercase letter (A-Z)
  - At least one number (0-9)

```html
<form data-form="signup">
  <input type="text" data-field="name" placeholder="First Name" required>
  <input type="email" data-field="email" placeholder="Email" required>
  <input type="password" data-field="password" placeholder="Password (min 8 chars, uppercase, lowercase, number)" required>
  <button type="submit">Sign Up</button>
</form>
```

### **Password Reset Link**
Add this to your sign-in form:

**Link:**
- Custom Attribute: `data-action` = `reset-password`

```html
<a href="#" data-action="reset-password">Forgot Password?</a>
```

---

## 🔵 **4. Google Sign-In**

### **Google Sign-In Container**
Create a div for the Google button:

**Container:**
- Custom Attribute: `data-google-signin` = `google-signin-btn`
- The value must be a unique ID

**For Sign In Tab:**
```html
<div data-google-signin="google-signin-btn"></div>
```

**For Sign Up Tab:**
```html
<div data-google-signin="google-signup-btn"></div>
```

---

## 🛒 **5. Purchase Modal**

### **Modal Container**
**Webflow Settings:**
- Custom Attribute: `data-modal` = `purchase`
- Set initial style: `display: none`

```html
<div data-modal="purchase" style="display: none;">
  <!-- Purchase options -->
</div>
```

### **Close Button**
**Webflow Settings:**
- Custom Attribute: `data-modal-action` = `close`

```html
<button data-modal-action="close">×</button>
```

### **Purchase Buttons**
**Regular Purchase:**
- Custom Attribute: `data-purchase-type` = `regular`

**Box Set Purchase:**
- Custom Attribute: `data-purchase-type` = `boxset`

```html
<!-- Regular Purchase -->
<button data-purchase-type="regular">
  Purchase - $39.99
</button>

<!-- Box Set Purchase -->
<button data-purchase-type="boxset">
  Purchase Box Set - $74.99
</button>
```

### **Complete Purchase Modal Example**
Here's a complete purchase modal with all attributes:

```html
<!-- Purchase Modal: Fixed overlay with centered content -->
<div data-modal="purchase" style="display: none;">
  <div class="modal-content">
    <!-- Header -->
    <div class="modal-header">
      <h2>Choose Your Purchase</h2>
      <button data-modal-action="close">×</button>
    </div>
    
    <!-- Purchase Options -->
    <div class="purchase-options">
      <!-- Regular Purchase Option -->
      <div class="purchase-option">
        <h3>Regular Access</h3>
        <p>Watch the complete docuseries</p>
        <div class="price">$39.99</div>
        <button data-purchase-type="regular">
          Purchase Now
        </button>
      </div>
      
      <!-- Box Set Purchase Option -->
      <div class="purchase-option">
        <h3>Box Set</h3>
        <p>Complete series + exclusive extras</p>
        <div class="price">$74.99</div>
        <button data-purchase-type="boxset">
          Purchase Box Set
        </button>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="modal-footer">
      <p>Secure payment powered by Stripe</p>
    </div>
  </div>
</div>
```

---

## 🔘 **6. Interactive Buttons**

### **Sign In/Out Buttons**
**Sign In Button:**
- Custom Attribute: `data-button-type` = `sign-in`

**Sign Out Button:**
- Custom Attribute: `data-button-type` = `sign-out`
- Set initial style: `display: none`

```html
<button data-button-type="sign-in">Sign In</button>
<button data-button-type="sign-out" style="display: none;">Sign Out</button>
```

### **Purchase Buttons**
**Rent Button:**
- Custom Attribute: `data-button-type` = `rent`

**Buy Button:**
- Custom Attribute: `data-button-type` = `buy`

**Watch Now Button:**
- Custom Attribute: `data-button-type` = `watch-now`
- Set initial style: `display: none`

```html
<button data-button-type="rent">Rent</button>
<button data-button-type="buy">Buy</button>
<button data-button-type="watch-now" style="display: none;">Watch Now</button>
```

---

## 🎬 **7. Content Visibility Control**

Control what content shows based on user state:

### **Authentication Required**
Only shows when user is signed in:
- Custom Attribute: `data-auth-required` = `true`

```html
<div data-auth-required="true">
  This content only shows when user is authenticated
</div>
```

### **Purchase Required**
Only shows when user has purchased:
- Custom Attribute: `data-purchase-required` = `true`

```html
<div data-purchase-required="true">
  This content only shows when user has purchased
</div>
```

### **Box Set Required**
Only shows for box set purchasers:
- Custom Attribute: `data-boxset-required` = `true`

```html
<div data-boxset-required="true">
  This content only shows for box set purchasers
</div>
```

### **Show for Non-Authenticated Users**
Shows only when user is NOT signed in:
- Custom Attribute: `data-show-not-signed-in` = `true`

```html
<div data-show-not-signed-in="true">
  Sign up to watch!
</div>
```

### **Show for Non-Paid Users**
Shows when signed in but hasn't purchased:
- Custom Attribute: `data-show-not-paid` = `true`

```html
<div data-show-not-paid="true">
  Purchase to unlock all content
</div>
```

### **Upgrade Prompt**
Shows for regular purchasers (not box set):
- Custom Attribute: `data-upgrade-prompt` = `true`

```html
<div data-upgrade-prompt="true">
  Upgrade to Box Set for extras!
</div>
```

---

## 💬 **8. Feedback Messages (Optional)**

### **Error Container**
For custom error display:
- Custom Attribute: `data-auth-error`
- Set initial style: `display: none`

```html
<div data-auth-error style="display: none;"></div>
```

### **Success Container**
For custom success messages:
- Custom Attribute: `data-auth-success`
- Set initial style: `display: none`

```html
<div data-auth-success style="display: none;"></div>
```

---

## 🎨 **9. Complete Modal Example**

Here's a complete authentication modal with all attributes:

> **Important:** The modal should have `style="display: none;"` by default. The JavaScript will change this to `display: flex` to show it centered on the page.

```html
<!-- Auth Modal: Fixed overlay with centered content -->
<div data-modal="auth" style="display: none;">
  <div class="modal-content">
    <!-- Header -->
    <div class="modal-header">
      <h2>Sign In to Watch</h2>
      <button data-modal-action="close">×</button>
    </div>
    
    <!-- Tabs -->
    <div class="tabs">
      <button data-auth-tab="signin" class="tb-active">Sign In</button>
      <button data-auth-tab="signup">Sign Up</button>
    </div>
    
    <!-- Sign In Tab -->
    <div data-auth-tab-content="signin" class="tb-active">
      <!-- Google Sign-In -->
      <div data-google-signin="google-signin-btn"></div>
      
      <div class="divider">or</div>
      
      <!-- Email Form -->
      <form data-form="signin">
        <input type="email" data-field="email" placeholder="Email" required>
        <input type="password" data-field="password" placeholder="Password" required>
        <button type="submit">Sign In</button>
      </form>
      
      <a href="#" data-action="reset-password">Forgot Password?</a>
    </div>
    
    <!-- Sign Up Tab -->
    <div data-auth-tab-content="signup">
      <!-- Google Sign-In -->
      <div data-google-signin="google-signup-btn"></div>
      
      <div class="divider">or</div>
      
      <!-- Email Form -->
      <form data-form="signup">
        <input type="text" data-field="name" placeholder="First Name" required>
        <input type="email" data-field="email" placeholder="Email" required>
        <input type="password" data-field="password" placeholder="Password" required>
        <button type="submit">Sign Up</button>
      </form>
    </div>
    
    <!-- Feedback Messages -->
    <div data-auth-error style="display: none;"></div>
    <div data-auth-success style="display: none;"></div>
  </div>
</div>
```

---

## 🎨 **10. CSS Styling**

Add the external stylesheet to **Project Settings > Custom Code > Head Code**:

```html
<link rel="stylesheet" href="https://tim-burton-docuseries.pages.dev/css/tim-burton-styles.css">
```

**What's Included:**
- ✅ Tab functionality (show/hide content)
- ✅ Loading states (spinner, disabled buttons)
- ✅ Skeleton loading animation
- ✅ Modal visibility control
- ✅ Google Sign-In container sizing
- ✅ Post-load visibility control

**Note:** The designer handles all visual/layout styling in Webflow. This CSS only includes functionality-critical rules for:
- Classes with `.tb-` prefix
- Attribute-based selectors (`[data-*]`)
- JavaScript-controlled states

---

## 🔐 **11. Password Recovery System**

### **Overview**

The password recovery system has two components:
1. **Password Recovery Modal** - Popup for requesting a reset link
2. **Password Reset Page** - Dedicated page for setting a new password

Your project already has:
- ✅ Backend endpoints (`password-reset.ts`)
- ✅ SendGrid email template configured
- ✅ Frontend methods (`resetPassword()`, `confirmPasswordReset()`)
- ✅ Modal handlers in place

---

### **Step 1: Disable Firebase's Default Password Page**

#### **Firebase Console Configuration:**

1. Go to [Firebase Console → Authentication → Templates](https://console.firebase.google.com/project/tim-burton-docuseries/authentication/emails)
2. Click **"Email Templates"** → **"Password reset"**
3. Click **"Customize action URL"**
4. Enter: `https://timburton-dev.webflow.io/reset-password`
5. Click **"Save"**

This ensures all password reset links point to YOUR custom page, not Firebase's default.

#### **Environment Configuration:**

Make sure your backend `.env` file has:
```bash
PASSWORD_RESET_URL=https://timburton-dev.webflow.io/reset-password
```

---

### **Step 2: Password Recovery Modal (Request Reset)**

This modal appears when users click "Forgot Password?" in the sign-in form.

#### **Modal Container**
**Webflow Settings:**
- Custom Attribute: `data-modal` = `password-recovery`
- Set initial style: `display: none`

```html
<div data-modal="password-recovery" style="display: none;">
  <div class="modal-content">
    <h2>Reset Password</h2>
    <button data-modal-action="close">×</button>
    
    <form data-form="password-recovery">
      <div class="form-group">
        <label for="recovery-email">Email Address</label>
        <input 
          type="email" 
          id="recovery-email" 
          data-field="email" 
          placeholder="Enter your email address"
          required
        />
      </div>
      
      <button type="submit" data-button="submit">
        Send Reset Email
      </button>
      
      <div data-auth-error style="display: none;"></div>
      <div data-auth-success style="display: none;"></div>
    </form>
    
    <div class="modal-footer">
      <button data-action="back-to-signin">Back to Sign In</button>
    </div>
  </div>
</div>
```

#### **Modal Attributes Reference**

| Element | Attribute | Value |
|---------|-----------|-------|
| Modal Container | `data-modal` | `password-recovery` |
| Close Button | `data-modal-action` | `close` |
| Form | `data-form` | `password-recovery` |
| Email Input | `data-field` | `email` |
| Submit Button | `data-button` | `submit` |
| Error Container | `data-auth-error` | (no value) |
| Success Container | `data-auth-success` | (no value) |
| Back Button | `data-action` | `back-to-signin` |

#### **Trigger Link**
Add this to your sign-in form:

**Webflow Settings:**
- Custom Attribute: `data-action` = `reset-password`

```html
<a href="#" data-action="reset-password">Forgot Password?</a>
```

---

### **Step 3: Password Reset Page (Set New Password)**

Create a new **dedicated Webflow page** (NOT a modal) that handles the actual password reset when users click the link in their email. This is a standalone page with a simple form.

#### **Page Setup:**
- **Page Slug:** `reset-password`
- **Full URL:** `https://timburton-dev.webflow.io/reset-password`
- **Page Type:** Regular page (not a modal/popup)

#### **Page Structure:**

This is a simple standalone page with a centered form:

```html
<!-- Full page content - no modal wrapper needed -->
<div class="reset-password-container">
  
  <!-- Header -->
  <div class="reset-password-header">
    <h1>Create New Password</h1>
    <p>Enter your new password below.</p>
  </div>
  
  <!-- Reset Password Form -->
  <form data-form="reset-password" class="reset-password-form">
    
    <!-- New Password Field -->
    <div class="form-group">
      <label for="new-password">New Password</label>
      <input 
        type="password" 
        id="new-password" 
        data-field="new-password" 
        placeholder="Enter new password"
        required
      />
      <small class="help-text">
        Must be at least 8 characters with uppercase, lowercase, and a number
      </small>
    </div>
    
    <!-- Confirm Password Field -->
    <div class="form-group">
      <label for="confirm-password">Confirm Password</label>
      <input 
        type="password" 
        id="confirm-password" 
        data-field="confirm-password" 
        placeholder="Confirm new password"
        required
      />
    </div>
    
    <!-- Submit Button -->
    <button type="submit" data-button="reset-password-submit">
      Reset Password
    </button>
    
    <!-- Feedback Messages -->
    <div data-reset-error class="error-message" style="display: none;"></div>
    <div data-reset-success class="success-message" style="display: none;"></div>
    
  </form>
  
  <!-- Back to Home Link -->
  <div class="reset-password-footer">
    <a href="/">Back to Home</a>
  </div>
  
</div>
```

**Important:** This is a **standalone page**, not a modal. Style it like a normal page with:
- Centered content container
- Clean, simple form layout
- No modal overlay or popup behavior

#### **Page Attributes Reference**

| Element | Attribute | Value |
|---------|-----------|-------|
| Form | `data-form` | `reset-password` |
| New Password Input | `data-field` | `new-password` |
| Confirm Password Input | `data-field` | `confirm-password` |
| Submit Button | `data-button` | `reset-password-submit` |
| Error Container | `data-reset-error` | (no value) |
| Success Container | `data-reset-success` | (no value) |

#### **Page JavaScript Handler**

The password reset page requires a dedicated script to handle the form submission and Firebase password reset confirmation.

**Add to Page Settings → Custom Code → Before `</body>`**:

```html
<script src="https://tim-burton-docuseries.pages.dev/js/password-reset-page.js"></script>
```

**What this script does:**
- Extracts the `oobCode` from the URL parameters (sent via email link)
- Validates that both password fields match
- Calls `window.timBurtonAuth.confirmPasswordReset()` to update the password
- Shows success/error messages
- Redirects to homepage on success

**Script Location:** `/public/js/password-reset-page.js`

**Note:** Make sure the Firebase Auth scripts are loaded first (they should be in your Project Settings → Head Code). The script will automatically initialize when the page loads.

---

### **How It Works**

1. **User clicks "Forgot Password?"** → Password Recovery Modal opens (popup)
2. **User enters email in modal** → Backend sends reset email via SendGrid
3. **User receives email** → Clicks reset link in email
4. **User lands on `/reset-password` page** → Dedicated standalone page (NOT a modal) with form
5. **User enters new password** → Form validates and updates password via Firebase
6. **Success message shows** → After 2 seconds, user redirected to homepage
7. **User can sign in** → Can now sign in with new password

---

### **SendGrid Email Configuration**

Your SendGrid password reset email is **already configured**! 

**Template ID:** `SENDGRID_TEMPLATE_PASSWORD_RESET` (in `.env`)  
**Variables:**
```json
{
  "firstName": "User",
  "resetLink": "https://timburton-dev.webflow.io/reset-password?oobCode=abc123..."
}
```

**Template Content Example:**
```html
<h1>Reset Your Password</h1>
<p>Hi {{firstName}},</p>
<p>We received a request to reset your password. Click the button below:</p>
<a href="{{resetLink}}" style="background: #000; color: #fff; padding: 12px 24px;">
  Reset Password
</a>
<p>This link expires in 1 hour.</p>
<p>If you didn't request this, ignore this email.</p>
```

---

### **Testing**

1. **Test Modal:**
   - Sign in page → Click "Forgot Password?"
   - Enter email → Submit
   - Check for success message

2. **Test Email:**
   - Check inbox for password reset email
   - Verify link format: `https://timburton-dev.webflow.io/reset-password?oobCode=...`

3. **Test Reset Page:**
   - Click link in email
   - Enter new password (must meet requirements)
   - Submit → Should see success message and redirect

4. **Test Sign In:**
   - Use new password to sign in
   - Should work successfully

---

### **Troubleshooting**

**Modal not opening:**
- Verify `data-action="reset-password"` on trigger link
- Check browser console for errors
- Ensure `webflow-auth-handlers.js` is loaded

**Email not sending:**
- Check Firebase Functions logs: `firebase functions:log`
- Verify SendGrid template ID in `.env`
- Check SendGrid Activity Feed

**Reset page not working:**
- Verify page slug is exactly `reset-password`
- Check `oobCode` parameter exists in URL
- Ensure Firebase scripts are loaded in head
- Check browser console for errors

**Password validation fails:**
- Must be 8+ characters
- Must have uppercase letter
- Must have lowercase letter
- Must have number

----

## 👤 **12. User Profile System**

### **Profile Data Structure**
Users now have enhanced profile data:
- `firstName` - First name (required)
- `lastName` - Last name (optional, can be added later)
- `photoURL` - Profile picture URL (randomly assigned for new users)
- `displayName` - Full name (auto-generated from firstName + lastName)
- `email` - Email address
- `createdAt` - Account creation timestamp
- `lastLoginAt` - Last login timestamp
- `lastUpdatedAt` - Last profile update timestamp

### **Profile Display Elements**
**Webflow Settings:**
- Profile Image: Custom Attribute `data-profile-image`
- First Name: Custom Attribute `data-profile-first-name`
- Last Name: Custom Attribute `data-profile-last-name`
- Full Name: Custom Attribute `data-profile-full-name`
- Email: Custom Attribute `data-profile-email`

```html
<!-- Profile Display Example -->
<div class="user-profile">
  <img data-profile-image src="" alt="Profile picture" />
  <h3 data-profile-full-name></h3>
  <p data-profile-email></p>
  
  <!-- Individual name fields -->
  <span data-profile-first-name></span>
  <span data-profile-last-name></span>
</div>
```

### **Profile Management JavaScript**
The system automatically:
- Assigns random profile pictures to new users
- Extracts firstName/lastName from Google Sign-In data
- Updates profile displays when user signs in
- Provides API for profile updates

### **Default Profile Pictures**
New users get randomly assigned one of these avatars:
- Avatar 1-7 (various styles)
- Google users get their Google profile picture if available
- Fallback to random avatar if Google picture unavailable

----

## 🎬 **12. Video Player Integration**

### **Overview**
The video player is a **viewport-filling modal** that:
- ✅ Opens when clicking video thumbnails
- ✅ Fills the entire viewport (not inline)
- ✅ Supports fullscreen playback
- ✅ Uses HLS.js for adaptive streaming (or native iOS player on Safari/iOS)
- ✅ **Chromecast support** - Cast to your TV with one click
- ✅ **iOS auto-fullscreen** - Automatically launches in fullscreen on iPhone/iPad with native controls
- ✅ Automatically handles access control
- ✅ Tracks watch progress
- ✅ Works seamlessly with authentication

### **Setup Video Thumbnails**

**Step 1: Add `data-video-id` Attribute**

In Webflow, add the `data-video-id` attribute to any clickable element (image, button, div, etc.):

1. Select your video thumbnail or poster image
2. Go to **Settings** → **Custom Attributes**
3. Add:
   - Name: `data-video-id`
   - Value: `episode-1` (or `episode-2`, `episode-3`, `bonus-1`)

**Available Video IDs:**
- `episode-1` - Suburban Hell
- `episode-2` - Misunderstood Monsters  
- `episode-3` - Rebel by Design
- `bonus-1` - Behind the Scenes (Box Set only)

**Example Webflow Structure:**
```html
<!-- Episode Thumbnail -->
<div class="episode-card">
  <img 
    src="episode-1-thumbnail.jpg" 
    alt="Episode 1"
    data-video-id="episode-1"
    style="cursor: pointer;"
  />
  <h3>Suburban Hell</h3>
  <p>Episode 1</p>
</div>

<!-- Bonus Content (Box Set Required) -->
<div class="bonus-card" data-boxset-required="true">
  <img 
    src="bonus-thumbnail.jpg"
    alt="Behind the Scenes"
    data-video-id="bonus-1"
    style="cursor: pointer;"
  />
  <h3>Behind the Scenes</h3>
  <p>Box Set Exclusive</p>
</div>
```

### **How It Works**

1. **User clicks thumbnail** with `data-video-id`
2. **Content Manager** looks up the playback ID
3. **Backend validates** user has access (rental/regular/boxset)
4. **Signed URL** is generated (secure, time-limited)
5. **Video Player** opens as full-viewport modal
6. **HLS streaming** starts automatically
7. **Watch progress** is tracked every 10 seconds

### **Access Control**

The system automatically enforces access rules:

| Content Type | Rental | Regular | Box Set |
|--------------|--------|---------|---------|
| Episodes (1-3) | ✅ | ✅ | ✅ |
| Bonus Content | ❌ | ❌ | ✅ |

- Users with **expired rentals** cannot access videos
- **Signed URLs** expire after 7 days
- All requests are **authenticated** via Firebase token

### **Player Controls**

**Keyboard Shortcuts:**
- `Spacebar` - Play/Pause
- `F` - Toggle fullscreen
- `Escape` - Close player

**Features:**
- ✅ Adaptive bitrate streaming (HLS)
- ✅ **Chromecast support** - Cast button appears automatically when Chromecast is available
- ✅ **iOS native player** - Automatically launches in fullscreen on iPhone/iPad with native controls and AirPlay
- ✅ Fullscreen support
- ✅ Resume from last position
- ✅ Loading states
- ✅ Error handling
- ✅ Mobile-friendly
- ✅ Native controls (play, pause, scrub, volume, fullscreen)

### **Configuring Playback IDs**

After uploading videos to Mux, update the playback IDs in the browser console:

```javascript
// Option 1: Update individual video
window.contentManager.updatePlaybackId('episode-1', 'abc123xyz...');

// Option 2: Batch update all videos
window.contentManager.updateAllPlaybackIds({
  'episode-1': 'abc123xyz...',
  'episode-2': 'def456uvw...',
  'episode-3': 'ghi789rst...',
  'bonus-1': 'jkl012qpo...'
});
```

Or edit `public/js/content-manager.js` directly and redeploy.

### **Testing**

1. **Test Authentication:** Sign in with a test account
2. **Test Rental Access:** Buy rental, try playing episode
3. **Test Box Set Access:** Buy box set, try playing bonus content
4. **Test Expiration:** Wait for rental to expire, verify access denied
5. **Test Resume:** Play video, close, reopen - should resume
6. **Test Fullscreen:** Press `F` or click fullscreen button
7. **Test Error Handling:** Try accessing video without purchase

### **Troubleshooting**

**Video won't play:**
- Check user is signed in and has active purchase
- Verify playback ID is configured (not `REPLACE_WITH_...`)
- Check browser console for errors
- Ensure HLS.js script is loaded

**Player doesn't open:**
- Verify `data-video-id` attribute is set
- Check element is clickable (`cursor: pointer`)
- Ensure video player scripts are loaded

**Access denied:**
- Verify user has correct purchase type
- Check rental hasn't expired
- Ensure backend has Mux credentials configured

----

## 📊 **13. Continue Watching & Progress Tracking**

### **Overview**

The system automatically tracks watch progress and intelligently displays the current/next episode in a hero section, with progress bars for all episodes.

**Features:**
- ✅ Shows current episode being watched in hero section
- ✅ Shows next episode if previous was completed
- ✅ Updates progress bars for all episodes automatically
- ✅ Changes button text dynamically ("Continue Watching" vs "Play")
- ✅ Calculates time remaining accurately
- ✅ Loops back to Episode 1 when all episodes are watched
- ✅ Excludes bonus content from hero rotation (only in progress bars)
- ✅ **Skeleton loading animation** for instant feedback (shows on page load, removes when data arrives)

### **Hero Section Setup**

**Step 1: Add Skeleton Class to Hero Wrapper**

1. Select the hero section wrapper (the parent container for all hero elements)
2. Add class: `hero` (so JavaScript can find it)
3. Add class: `tb-loading-skeleton` or `tb-preloading-skeleton` (shows skeleton on page load)
4. JavaScript will automatically remove skeleton classes once data loads

**Optional: Hide Elements Until Data Loads**

To prevent elements from appearing before data is ready, add the attribute:

```html
<div data-show-after-load="true">
  <!-- This content will be hidden until skeleton is removed -->
</div>
```

- Elements with `data-show-after-load="true"` are hidden by CSS
- JavaScript reveals them when data finishes loading
- Useful for progress bars, buttons, or any dynamic content that needs data first

**Step 2: Add Hero Section Attributes**

Add these attributes to your hero section elements in Webflow:

**1. Episode Title**
```html
<div data-hero-title>Episode 1: Suburban Hell</div>
```
- Attribute: `data-hero-title`
- Updates: Episode number and title

**2. Episode Description**
```html
<div data-hero-description>A four-part journey into Tim Burton's world...</div>
```
- Attribute: `data-hero-description`
- Updates: Description based on current episode

**3. Progress Bar Container**
```html
<div data-hero-progress-bar>
  <div class="progress-bar"></div>
</div>
```
- Parent: `data-hero-progress-bar`
- Child: (no attribute, direct child div)
- Updates: Child div width to match progress percentage

**4. Time Remaining - Hours**
```html
<div data-hero-time-hours>1</div>
```
- Attribute: `data-hero-time-hours`
- Updates: Hours remaining

**5. Time Remaining - Minutes**
```html
<div data-hero-time-mins>50</div>
```
- Attribute: `data-hero-time-mins`
- Updates: Minutes remaining

**6. Play Button**
```html
<div data-hero-play-button data-video-id="episode-1">
  <div aria-hidden="true" data-hero-button-text>play</div>
</div>
```
- Button: `data-hero-play-button` + `data-video-id` (auto-updated)
- Text: `data-hero-button-text`
- Updates: Button text ("Continue Watching" or "play") and `data-video-id`

### **Episode List Progress Bars**

For each episode in your episode list, add these attributes:

```html
<!-- Episode 1 -->
<div data-progress-bar data-video-id="episode-1">
  <div class="progress-bar"></div>
</div>

<!-- Episode 2 -->
<div data-progress-bar data-video-id="episode-2">
  <div class="progress-bar"></div>
</div>

<!-- Episode 3 -->
<div data-progress-bar data-video-id="episode-3">
  <div class="progress-bar"></div>
</div>

<!-- Episode 4 -->
<div data-progress-bar data-video-id="episode-4">
  <div class="progress-bar"></div>
</div>

<!-- Bonus Content -->
<div data-progress-bar data-video-id="bonus-1">
  <div class="progress-bar"></div>
</div>
```

**Attributes:**
- Parent: `data-progress-bar` + `data-video-id`
- Child: (no attribute, direct child div)

**Video IDs:**
- Episodes: `episode-1`, `episode-2`, `episode-3`, `episode-4`
- Bonus: `bonus-1`

### **Episode Sequencing Logic**

The system follows this flow:

1. **No watch history** → Shows Episode 1 with "Play" button
2. **Watching Episode 1 (25% complete)** → Shows Episode 1 with "Continue Watching" button
3. **Completed Episode 1** → Shows Episode 2 with "Play" button
4. **Completed Episode 2** → Shows Episode 3 with "Play" button
5. **Completed Episode 3** → Shows Episode 4 with "Play" button
6. **Completed Episode 4** → Loops back to Episode 1 with "Play" button

**Important:** Bonus content is NOT included in hero rotation (only in progress bars).

### **Testing Progress Tracking**

After adding all attributes and publishing your Webflow site:

1. **Sign in** with a user who has purchased
2. **Refresh** the page
3. **Check console** for: `✅ Hero section updated: episode-1 (0%)`
4. **Verify** hero section shows Episode 1
5. **Watch** some of Episode 1
6. **Refresh** page → Verify progress bar and time remaining updated
7. **Complete** Episode 1 (watch to 95%+)
8. **Refresh** page → Verify hero now shows Episode 2 with "Play" button

### **Troubleshooting Progress Tracking**

**Hero section not updating:**
- Check all `data-hero-*` attributes are correct
- Check browser console for errors
- Verify user is signed in and has purchased
- Check `window.contentManager` exists in console

**Progress bars not updating:**
- Verify `data-progress-bar` attribute on container
- Verify `data-video-id` matches exactly (`episode-1`, not `Episode-1`)
- Check direct child div exists for width update

**Button text not changing:**
- Verify `data-hero-button-text` attribute
- Check if element is the text element (not icon wrapper)

----

## 📚 **Quick Reference Table**

| Element Type | Attribute | Value |
|--------------|-----------|-------|
| **Modals** |
| Auth Modal | `data-modal` | `auth` |
| Purchase Modal | `data-modal` | `purchase` |
| Password Recovery Modal | `data-modal` | `password-recovery` |
| Close Button | `data-modal-action` | `close` |
| Sign In Modal Heading | `data-modal-heading` | `signin` |
| Sign Up Modal Heading | `data-modal-heading` | `signup` |
| **Authentication** |
| Sign In Tab | `data-auth-tab` | `signin` |
| Sign Up Tab | `data-auth-tab` | `signup` |
| Sign In Content | `data-auth-tab-content` | `signin` |
| Sign Up Content | `data-auth-tab-content` | `signup` |
| Sign In Form | `data-form` | `signin` |
| Sign Up Form | `data-form` | `signup` |
| **Form Fields** |
| Email Field | `data-field` | `email` |
| Password Field | `data-field` | `password` |
| Name Field | `data-field` | `name` |
| **Profile Display** |
| Profile Image | `data-profile-image` | - |
| First Name | `data-profile-first-name` | - |
| Last Name | `data-profile-last-name` | - |
| Full Name | `data-profile-full-name` | - |
| Email | `data-profile-email` | - |
| **Actions** |
| Reset Password | `data-action` | `reset-password` |
| Google Sign-In | `data-google-signin` | `[unique-id]` |
| **Purchase** |
| Regular Purchase | `data-purchase-type` | `regular` |
| Box Set Purchase | `data-purchase-type` | `boxset` |
| **Buttons** |
| Sign In Button | `data-button-type` | `sign-in` |
| Sign Out Button | `data-button-type` | `sign-out` |
| Rent Button | `data-button-type` | `rent` |
| Buy Button | `data-button-type` | `buy` |
| Watch Now Button | `data-button-type` | `watch-now` |
| **Content Visibility** |
| Auth Required | `data-auth-required` | `true` |
| Purchase Required | `data-purchase-required` | `true` |
| Box Set Required | `data-boxset-required` | `true` |
| Show Not Signed In | `data-show-not-signed-in` | `true` |
| Show Not Paid | `data-show-not-paid` | `true` |
| Upgrade Prompt | `data-upgrade-prompt` | `true` |
| **Feedback** |
| Error Container | `data-auth-error` | - |
| Success Container | `data-auth-success` | - |
| **Continue Watching & Progress** |
| Hero Title | `data-hero-title` | - |
| Hero Description | `data-hero-description` | - |
| Hero Progress Bar | `data-hero-progress-bar` | - |
| Hero Time Hours | `data-hero-time-hours` | - |
| Hero Time Minutes | `data-hero-time-mins` | - |
| Hero Play Button | `data-hero-play-button` | - |
| Hero Button Text | `data-hero-button-text` | - |
| Episode Progress Bar | `data-progress-bar` | (+ `data-video-id`) |

---

## 🔧 **14. Webflow Setup Steps**

### **Step 1: Add Custom Attributes**
1. Select any element in Webflow Designer
2. Click the **Settings** (gear icon)
3. Scroll to **Custom Attributes**
4. Click **Add Custom Attribute**
5. Enter the attribute name and value from the table above

### **Step 2: No IDs Needed!**
- You can ignore or remove element IDs
- The system works entirely through data attributes
- No conflicts with Webflow's auto-generated IDs

### **Step 3: Test**
1. Publish your Webflow site
2. Test authentication flows
3. Verify button states change correctly
4. Check content visibility rules

---

## ✅ **15. Testing Results**

The system has been thoroughly tested and verified:

1. **✅ Email/Password Sign-Up** - User creation working perfectly
2. **✅ Email/Password Sign-In** - Authentication flow complete
3. **✅ Google Sign-In** - OAuth flow functional (add domain to Google Console)
4. **✅ Session Persistence** - Users stay logged in after refresh
5. **✅ Sign Out** - Clean session termination
6. **✅ Content Access Control** - Visibility rules working correctly
7. **✅ Button State Management** - Dynamic states updating properly
8. **✅ Purchase Modal** - Opens and closes correctly
9. **✅ Error Handling** - Proper error messages displayed

---

## 🐛 **16. Troubleshooting**

### **Modal appearing at bottom of page instead of centered:**

**Problem:** The modal shows at the bottom of the page, not as an overlay.

**Solution:**
1. Ensure the modal has `data-modal="auth"` attribute (not a class)
2. Set inline style: `style="display: none;"`
3. Add the CSS from this guide to Webflow **Custom Code > Head Code**
4. The modal should NOT have any position settings in Webflow Designer
5. Remove any Webflow layout classes that might conflict (like flex/grid on the modal itself)

**CSS Check:**
```css
[data-modal="auth"] {
  position: fixed;  /* Must be fixed */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: none;  /* Hidden by default */
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
```

### **Google Sign-In not working:**
Add your Webflow domain to Google Cloud Console:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Select OAuth 2.0 Client ID
3. Add to **Authorized JavaScript origins**:
   - `https://timburton-dev.webflow.io`
   - `https://tim-burton-docuseries.pages.dev`

### **Modal not opening:**
- Check that `data-modal="auth"` attribute is set
- Verify button has `data-button-type="sign-in"`
- Check browser console for errors

### **Form not submitting:**
- Ensure form has `data-form="signin"` or `data-form="signup"`
- Check inputs have correct `data-field` attributes
- Verify Firebase scripts are loading

### **Content not showing/hiding:**
- Check visibility attributes are set correctly
- Verify user is actually authenticated (check console)
- Test button state to confirm auth status

---

## 🚀 **17. System Status**

**✅ PRODUCTION READY**

All core features are deployed and functional:
- ✅ Authentication System
- ✅ Session Management
- ✅ Content Access Control
- ✅ Button State Management
- ✅ Purchase Modal System
- ✅ Stripe Integration (backend ready)
- ✅ Attribute-based interactions

**Live URLs:**
- Frontend: https://tim-burton-docuseries.pages.dev/
- Backend API: https://us-central1-tim-burton-docuseries.cloudfunctions.net/api
- Webflow Site: https://timburton-dev.webflow.io/

---

## 📝 **18. Benefits of This System**

1. **🎯 No Conflicts** - Data attributes won't conflict with Webflow's auto-generated IDs
2. **🔄 Reusable** - Same attributes can be used on multiple pages
3. **📱 Flexible** - Easy to reorganize elements in Webflow Designer
4. **🧹 Clean Code** - No JavaScript relying on specific ID strings
5. **🚀 Maintainable** - Clear, semantic attribute names
6. **🔒 Secure** - Firebase Auth SDK handles all authentication
7. **⚡ Fast** - Optimized with single backend endpoint
8. **📊 Scalable** - Easy to add new features

---

## 👤 **14. Account Page Integration**

### **Overview**

The account page displays user profile information, purchase history, and allows profile updates. It automatically redirects non-authenticated users to the homepage.

**Features:**
- ✅ Auto-redirect for non-authenticated users
- ✅ Profile display (name, email, photo)
- ✅ Purchase history with receipt downloads
- ✅ Edit first name, email, and password
- ✅ Automatic event handler attachment

---

### **Required Script**

Add to your Webflow account page **Settings → Custom Code → Before `</body>`**:

```html
<script src="https://tim-burton-docuseries.pages.dev/js/account-page.js"></script>
```

**Important:** This script must load AFTER the auth scripts (client-auth.js).

---

### **Authentication Protection**

**✅ Automatic!** The account page automatically redirects non-authenticated users to the homepage after 1 second.

**Optional: Show Redirect Message**

```html
<div data-account-message style="display: none;">
  <!-- Message appears here before redirect -->
</div>
```

---

### **Profile Display**

**Profile Image:**
```html
<img data-profile-image src="" alt="Profile picture" />
```

**First Name (Display):**
```html
<div data-profile-first-name>User</div>
```

**First Name (Edit):**
```html
<input type="text" data-profile-first-name placeholder="First Name" />
```

**Email Display:**
```html
<div data-profile-email-display>email@example.com</div>
```

**Email Edit:**
```html
<input type="email" data-profile-email-input placeholder="New Email" />
```

---

### **Purchase History**

**Container (Auto-Populated):**
```html
<div data-purchase-history>
  <!-- Purchase items automatically inserted here -->
</div>
```

**What's Displayed:**

Each purchase item is automatically created with the following attributes for **flexible styling**:

| Attribute | Element | Content | Purpose |
|-----------|---------|---------|---------|
| `data-purchase-item` | `<div>` | Container | Wraps each purchase |
| `data-purchase-product-name` | `<div>` | Product name | E.g., "Tim Burton Docuseries - Regular Purchase" |
| `data-purchase-date` | `<div>` | Purchase date | E.g., "11/15/2025" |
| `data-purchase-amount` | `<div>` | Amount paid | E.g., "$39.99 USD" |
| `data-purchase-expiration` | `<div>` | Expiration info | For rentals only, e.g., "Expires: 11/19/2025" or "Expired" |
| `data-download-receipt` | `<button>` | Download button | Opens Stripe receipt in new tab |

**Example Generated HTML:**
```html
<div data-purchase-item>
  <div data-purchase-product-name>Tim Burton Docuseries - Regular Purchase</div>
  <div data-purchase-date>11/15/2025</div>
  <div data-purchase-amount>$39.99 USD</div>
  <button data-download-receipt data-purchase-id="abc123">Download Receipt</button>
</div>
```

**If no purchases:** Shows "No purchases yet."

---

### **Current Product Display**

The account page automatically determines the user's current product based on purchase hierarchy and displays it.

**Product Hierarchy (Highest to Lowest):**
1. **Box Set** (Tier 3) - Highest
2. **Regular Purchase** (Tier 2)
3. **Rental** (Tier 1) - Lowest

**If a user has purchased multiple products, only the highest tier is displayed as their "current product".**

**Attributes:**

```html
<!-- Product Name -->
<div data-current-product-name>Tim Burton Docuseries - Regular Purchase</div>

<!-- Product Description -->
<div data-current-product-description>Permanent access to 4 episodes</div>

<!-- Product Type (rental, regular, boxset, or "none") -->
<div data-current-product-type>regular</div>

<!-- Product Tier (0 = no product, 1 = rental, 2 = regular, 3 = boxset) -->
<div data-current-product-tier>2</div>

<!-- Expiration Date (only shown for active rentals) -->
<div data-current-product-expires style="display: none;">Expires: 12/25/2024</div>
```

**What Gets Displayed:**

| User Has | Displayed Product | Type | Tier |
|----------|------------------|------|------|
| Nothing | "No active product" | `none` | `0` |
| Active Rental | Tim Burton Docuseries - Rental | `rental` | `1` |
| Regular Purchase | Tim Burton Docuseries - Regular Purchase | `regular` | `2` |
| Box Set | Tim Burton Docuseries - Box Set | `boxset` | `3` |
| Rental + Regular | Regular Purchase (higher tier) | `regular` | `2` |
| Regular + Box Set | Box Set (highest tier) | `boxset` | `3` |

**Note:** Expired rentals are not considered "active" and won't be displayed as the current product.

---

### **Upgrade Prompts**

The system automatically determines which upgrade to offer based on the user's current product:

**Upgrade Logic:**

| Current Product | Upgrade Offered | Price | Savings |
|----------------|-----------------|-------|---------|
| **Rental** | Regular Purchase | $39.99 | $15 discount applied |
| **Regular** | Box Set | $49.99 | **$25 off** (regular price: $74.99) |
| **Box Set** | No upgrade (highest tier) | - | - |

**Container (Auto-Hidden if no upgrade available):**
```html
<div data-upgrade-prompt style="display: none;">
  <!-- Upgrade prompt content here -->
</div>
```

**Upgrade Prompt Attributes:**

```html
<div data-upgrade-prompt style="display: none;">
  <h3>Upgrade to <span data-upgrade-product-name>Box Set</span></h3>
  
  <p data-upgrade-description>
    Upgrade to get 40 hours of exclusive bonus content
  </p>
  
  <div class="pricing">
    <!-- Current upgrade price -->
    <span class="price" data-upgrade-price>$49.99</span>
    
    <!-- Original price (with strikethrough styling) -->
    <span class="original-price" data-upgrade-full-price style="display: none;">$74.99</span>
    
    <!-- Savings badge (hidden if no savings) -->
    <span class="savings" data-upgrade-savings style="display: none;">Save $25.00!</span>
  </div>
  
  <!-- CTA Button (data-product-type is automatically set) -->
  <button data-upgrade-cta data-product-type="boxset">
    Upgrade to Box Set
  </button>
</div>
```

**Automatic Behavior:**

1. **Container Visibility:** The `data-upgrade-prompt` container is automatically shown/hidden based on whether an upgrade is available.
2. **Product Type:** The CTA button (`data-upgrade-cta`) automatically gets the correct `data-product-type` attribute for Stripe integration.
3. **Pricing Display:**
   - For **Rental → Regular**: No savings shown (same price)
   - For **Regular → Box Set**: Shows original price ($74.99) with strikethrough and savings badge ("Save $25!")
4. **No Upgrade:** If user has Box Set (highest tier), the entire prompt is hidden.

**Example for Rental User:**
```html
<div data-upgrade-prompt style="display: block;">
  <h3>Upgrade to <span data-upgrade-product-name>Regular Purchase</span></h3>
  <p data-upgrade-description>Upgrade to permanent access for the same price you paid</p>
  <span data-upgrade-price>$39.99</span>
  <button data-upgrade-cta data-product-type="regular">Upgrade to Permanent Access</button>
</div>
```

**Example for Regular User:**
```html
<div data-upgrade-prompt style="display: block;">
  <h3>Upgrade to <span data-upgrade-product-name>Box Set</span></h3>
  <p data-upgrade-description>Upgrade to get 40 hours of exclusive bonus content</p>
  <span data-upgrade-price>$49.99</span>
  <span data-upgrade-full-price style="display: inline;">$74.99</span>
  <span data-upgrade-savings style="display: block;">Save $25.00!</span>
  <button data-upgrade-cta data-product-type="boxset">Upgrade to Box Set</button>
</div>
```

---

### **Profile Updates**

All update buttons automatically attach event handlers - no custom code needed!

**Update First Name:**
```html
<input type="text" data-profile-first-name />
<button data-update-first-name>Save Name</button>
```

**Update Email:**
```html
<input type="email" data-profile-email-input />
<button data-update-email>Update Email</button>
```

**Update Password:**
```html
<form data-form="update-password">
  <input type="password" data-current-password placeholder="Current Password" required />
  <input type="password" data-new-password placeholder="New Password" required />
  <input type="password" data-confirm-password placeholder="Confirm Password" required />
  <button type="submit" data-update-password>Update Password</button>
</form>
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

---

### **Feedback Messages**

**Loading State:**
```html
<div data-account-loading style="display: none;">Loading...</div>
```

**Success Messages:**
```html
<div data-account-success style="display: none;"></div>
```

**Error Messages:**
```html
<div data-account-error style="display: none;"></div>
```

---

### **Complete Account Page Example**

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Account</title>
  
  <!-- Firebase & Auth Scripts (in Project Settings → Head Code) -->
  <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
  <script src="https://tim-burton-docuseries.pages.dev/js/client-auth.js"></script>
</head>
<body>
  
  <!-- Feedback Messages -->
  <div data-account-loading style="display: none;">Loading...</div>
  <div data-account-success style="display: none;"></div>
  <div data-account-error style="display: none;"></div>
  
  <!-- Profile Section -->
  <section class="profile">
    <h2>Your Profile</h2>
    <img data-profile-image src="" alt="Profile" />
    
    <!-- Edit First Name -->
    <div class="form-group">
      <label>First Name</label>
      <input type="text" data-profile-first-name />
      <button data-update-first-name>Save</button>
    </div>
    
    <!-- Email Display -->
    <div class="form-group">
      <label>Current Email</label>
      <div data-profile-email-display></div>
    </div>
    
    <!-- Edit Email -->
    <div class="form-group">
      <label>New Email</label>
      <input type="email" data-profile-email-input />
      <button data-update-email>Update Email</button>
    </div>
  </section>
  
  <!-- Password Update -->
  <section class="password">
    <h2>Change Password</h2>
    <form data-form="update-password">
      <input type="password" data-current-password placeholder="Current Password" required />
      <input type="password" data-new-password placeholder="New Password" required />
      <input type="password" data-confirm-password placeholder="Confirm Password" required />
      <button type="submit" data-update-password>Update Password</button>
    </form>
  </section>
  
  <!-- Purchase History -->
  <section class="purchases">
    <h2>Purchase History</h2>
    <div data-purchase-history></div>
  </section>
  
  <!-- Account Page Script (Page Settings → Before </body>) -->
  <script src="https://tim-burton-docuseries.pages.dev/js/account-page.js"></script>
</body>
</html>
```

---

### **Account Page Attributes Reference**

| Attribute | Element | Purpose |
|-----------|---------|---------|
| **General** |||
| `data-account-message` | `<div>` | Redirect message |
| `data-account-loading` | `<div>` | Loading state |
| `data-account-success` | `<div>` | Success messages |
| `data-account-error` | `<div>` | Error messages |
| **Profile** |||
| `data-profile-image` | `<img>` | Profile photo |
| `data-profile-first-name` | `<input>` or `<div>` | First name (edit/display) |
| `data-profile-email-display` | `<div>` | Email display |
| `data-profile-email-input` | `<input>` | Email edit |
| `data-current-password` | `<input>` | Current password |
| `data-new-password` | `<input>` | New password |
| `data-confirm-password` | `<input>` | Confirm password |
| `data-update-first-name` | `<button>` | Save name button |
| `data-update-email` | `<button>` | Update email button |
| `data-update-password` | `<button>` | Update password button |
| **Current Product** |||
| `data-current-product-name` | `<div>` | Current product name |
| `data-current-product-description` | `<div>` | Current product description |
| `data-current-product-type` | `<div>` | Product type (rental/regular/boxset/none) |
| `data-current-product-tier` | `<div>` | Product tier (0-3) |
| `data-current-product-expires` | `<div>` | Expiration date (rentals only) |
| **Upgrade Prompt** |||
| `data-upgrade-prompt` | `<div>` | Upgrade prompt container |
| `data-upgrade-product-name` | `<span>` | Upgrade product name |
| `data-upgrade-description` | `<p>` | Upgrade description |
| `data-upgrade-price` | `<span>` | Upgrade price |
| `data-upgrade-full-price` | `<span>` | Original price (with strikethrough) |
| `data-upgrade-savings` | `<span>` | Savings amount |
| `data-upgrade-cta` | `<button>` | Upgrade CTA button |
| **Purchase History** |||
| `data-purchase-history` | `<div>` | Purchase container |
| `data-purchase-item` | `<div>` | Individual purchase wrapper |
| `data-purchase-product-name` | `<div>` | Product name |
| `data-purchase-date` | `<div>` | Purchase date |
| `data-purchase-amount` | `<div>` | Amount paid |
| `data-purchase-expiration` | `<div>` | Rental expiration (if applicable) |
| `data-download-receipt` | `<button>` | Download receipt button |

---

### **Testing the Account Page**

1. **Test Redirect:** Sign out → Visit `/account` → Should redirect to homepage
2. **Test Display:** Sign in → Visit `/account` → See profile and purchases
3. **Test Updates:** Edit name/email/password → Changes save successfully
4. **Test Receipts:** Click "Download Receipt" → Opens Stripe receipt

---

## 🎬 **15. Episodes Page Protection**

### **Overview**

The `/episodes` page is protected and requires authentication. If a visitor lands on the episodes page without being signed in, they are **immediately redirected to the homepage**.

This follows the same pattern as the `/account` page to ensure consistent security across the site.

---

### **Required Script**

Add to your Webflow **Episodes page** → **Settings → Custom Code → Before `</body>`**:

```html
<script src="https://tim-burton-docuseries.pages.dev/js/episodes-page.js"></script>
```

**Important:** This script must load AFTER the auth scripts (client-auth.js).

---

### **Authentication Protection**

**✅ Automatic!** The episodes page automatically redirects non-authenticated users to the homepage immediately.

**How It Works:**
1. Script loads when episodes page loads
2. Waits for authentication system to initialize (max 5 seconds)
3. Checks if user is signed in
4. If NOT signed in → **Immediate redirect to homepage** (`/`)
5. If signed in → User can access the episodes page

**No Configuration Needed:** Unlike the account page, there are no optional message elements. The redirect is instant and silent.

---

### **Testing the Episodes Page Protection**

1. **Test Redirect:** Sign out → Visit `/episodes` directly → Should redirect to homepage immediately
2. **Test Access:** Sign in → Visit `/episodes` → Should load normally
3. **Test Direct URL:** While signed out, try accessing `/episodes` via URL → Should redirect to homepage

---

### **Implementation Pattern**

This follows the **same clean pattern** as the account page:
- ✅ No band-aid solutions
- ✅ No patchwork code  
- ✅ Consistent with existing authentication flow
- ✅ Uses the same `window.timBurtonAuth.isSignedIn()` check
- ✅ Elegant integration between HTML, CSS, and JS

---

## 🎓 **16. Need Help?**

If you need to add a new interaction:
1. Choose a semantic attribute name (e.g., `data-my-feature`)
2. Add it to your HTML/Webflow element
3. The JavaScript automatically detects and handles it
4. Check the Quick Reference Table for existing patterns

**The system is production-ready and fully tested!** 🎉
