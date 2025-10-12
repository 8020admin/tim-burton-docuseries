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

```html
<form data-form="signup">
  <input type="text" data-field="name" placeholder="First Name" required>
  <input type="email" data-field="email" placeholder="Email" required>
  <input type="password" data-field="password" placeholder="Password" required>
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
  Purchase - $24.99
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
        <div class="price">$24.99</div>
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

## 🔐 **11. Password Recovery Modal**

### **Modal Container**
**Webflow Settings:**
- Custom Attribute: `data-modal` = `password-recovery`
- Set initial style: `display: none`

```html
<div data-modal="password-recovery" style="display: none;">
  <div class="modal-content">
    <h2>Reset Password</h2>
    <button data-action="close-modal">×</button>
    
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
        <span class="tb-spinner" style="display: none;"></span>
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

### **Form Elements**
**Webflow Settings:**
- Form: Custom Attribute `data-form` = `password-recovery`
- Email Input: Custom Attribute `data-field` = `email`
- Submit Button: Custom Attribute `data-button` = `submit`
- Error Container: Custom Attribute `data-auth-error`
- Success Container: Custom Attribute `data-auth-success`
- Back Button: Custom Attribute `data-action` = `back-to-signin`

### **Trigger Link**
**Webflow Settings:**
- Custom Attribute: `data-action` = `reset-password`

```html
<a href="#" data-action="reset-password">Forgot Password?</a>
```

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

## 🎓 **19. Need Help?**

If you need to add a new interaction:
1. Choose a semantic attribute name (e.g., `data-my-feature`)
2. Add it to your HTML/Webflow element
3. The JavaScript automatically detects and handles it
4. Check the Quick Reference Table for existing patterns

**The system is production-ready and fully tested!** 🎉
