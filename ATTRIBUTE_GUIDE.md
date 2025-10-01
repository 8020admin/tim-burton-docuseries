# Attribute-Based Interaction Guide

## 🎯 Overview

Our system uses **data attributes** for all interactions instead of IDs or classes. This provides maximum flexibility and makes it easy to integrate with Webflow without worrying about conflicting IDs or class names.

## 📋 Core Principles

1. **✅ No IDs required** - Use `data-*` attributes instead
2. **✅ No class-based selectors** - Classes only for styling
3. **✅ Semantic attributes** - Clear, readable attribute names
4. **✅ Webflow-friendly** - Easy to add attributes in Webflow's custom attributes panel

---

## 🔐 Authentication Modal

### **Modal Container**
```html
<div data-modal="auth" style="display: none;">
  <!-- Modal content -->
</div>
```

### **Close Button**
```html
<button data-modal-action="close">×</button>
```

### **Tab Buttons**
```html
<button data-auth-tab="signin" class="active">Sign In</button>
<button data-auth-tab="signup">Sign Up</button>
```

### **Tab Content**
```html
<div data-auth-tab-content="signin" class="active">
  <!-- Sign in form -->
</div>

<div data-auth-tab-content="signup">
  <!-- Sign up form -->
</div>
```

---

## 📝 Authentication Forms

### **Sign In Form**
```html
<form data-form="signin">
  <input type="email" data-field="email" placeholder="Email" required>
  <input type="password" data-field="password" placeholder="Password" required>
  <button type="submit">Sign In</button>
</form>
```

### **Sign Up Form**
```html
<form data-form="signup">
  <input type="text" data-field="name" placeholder="Full Name" required>
  <input type="email" data-field="email" placeholder="Email" required>
  <input type="password" data-field="password" placeholder="Password" required>
  <button type="submit">Sign Up</button>
</form>
```

### **Password Reset Link**
```html
<a href="#" data-action="reset-password">Forgot Password?</a>
```

---

## 🔵 Google Sign-In

### **Google Sign-In Container**
The attribute value should match a unique container ID:

```html
<div data-google-signin="google-signin-container-1"></div>
```

For sign-up tab:
```html
<div data-google-signin="google-signup-container-1"></div>
```

---

## 🛒 Purchase Modal

### **Modal Container**
```html
<div data-modal="purchase" style="display: none;">
  <!-- Purchase options -->
</div>
```

### **Close Button**
```html
<button data-modal-action="close">×</button>
```

### **Purchase Option Buttons**
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

---

## 🔘 Interactive Buttons

### **Sign In/Out Buttons**
```html
<button data-button-type="sign-in">Sign In</button>
<button data-button-type="sign-out">Sign Out</button>
```

### **Purchase Buttons**
```html
<button data-button-type="rent">Rent</button>
<button data-button-type="buy">Buy</button>
<button data-button-type="watch-now">Watch Now</button>
```

### **User Profile Button**
```html
<button data-button-type="user-profile">
  <img src="" data-user-avatar>
  <span data-user-name></span>
</button>
```

---

## 🎬 Content Visibility

### **Authentication Required**
```html
<div data-auth-required="true">
  This content only shows when user is authenticated
</div>
```

### **Purchase Required**
```html
<div data-purchase-required="true">
  This content only shows when user has purchased
</div>
```

### **Box Set Required**
```html
<div data-boxset-required="true">
  This content only shows for box set purchasers
</div>
```

### **Show for Non-Authenticated Users**
```html
<div data-show-not-signed-in="true">
  Sign up to watch!
</div>
```

### **Show for Non-Paid Users**
```html
<div data-show-not-paid="true">
  Purchase to unlock all content
</div>
```

### **Upgrade Prompt** (for regular purchasers)
```html
<div data-upgrade-prompt="true">
  Upgrade to Box Set for extras!
</div>
```

---

## 💬 Feedback Messages

### **Error Container**
```html
<div data-auth-error style="display: none;"></div>
```

### **Success Container**
```html
<div data-auth-success style="display: none;"></div>
```

---

## 🎨 Complete Modal Example

### **Authentication Modal**
```html
<div data-modal="auth" style="display: none;">
  <div class="modal-content">
    <!-- Header -->
    <div class="modal-header">
      <h2>Sign In to Watch</h2>
      <button data-modal-action="close">×</button>
    </div>
    
    <!-- Tabs -->
    <div class="tabs">
      <button data-auth-tab="signin" class="active">Sign In</button>
      <button data-auth-tab="signup">Sign Up</button>
    </div>
    
    <!-- Sign In Tab -->
    <div data-auth-tab-content="signin" class="active">
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
        <input type="text" data-field="name" placeholder="Full Name" required>
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

### **Purchase Modal**
```html
<div data-modal="purchase" style="display: none;">
  <div class="modal-content">
    <!-- Header -->
    <div class="modal-header">
      <h2>Choose Your Purchase</h2>
      <button data-modal-action="close">×</button>
    </div>
    
    <!-- Options -->
    <div class="purchase-options">
      <!-- Regular -->
      <div class="option">
        <h3>Regular Purchase</h3>
        <p class="price">$24.99</p>
        <p>4 episodes of the docuseries</p>
        <button data-purchase-type="regular">Purchase</button>
      </div>
      
      <!-- Box Set -->
      <div class="option">
        <h3>Box Set</h3>
        <p class="price">$74.99</p>
        <p>4 episodes + 40 hours of extras</p>
        <button data-purchase-type="boxset">Purchase</button>
      </div>
    </div>
  </div>
</div>
```

---

## 🔧 Webflow Integration Steps

### **Step 1: Add Attributes in Webflow**
1. Select any element in Webflow
2. Go to **Element Settings** (gear icon)
3. Scroll to **Custom Attributes**
4. Add the appropriate `data-*` attribute

### **Step 2: Common Patterns**

**For a Sign In button:**
- Attribute: `data-button-type`
- Value: `sign-in`

**For the auth modal:**
- Attribute: `data-modal`
- Value: `auth`

**For modal close button:**
- Attribute: `data-modal-action`
- Value: `close`

**For auth form fields:**
- Email input: `data-field="email"`
- Password input: `data-field="password"`
- Name input: `data-field="name"`

### **Step 3: No IDs Needed!**
You can remove or ignore all element IDs. The system works entirely through data attributes.

---

## ✨ Benefits

1. **🎯 No Conflicts** - Data attributes won't conflict with Webflow's auto-generated IDs
2. **🔄 Reusable** - Same attributes can be used on multiple pages
3. **📱 Flexible** - Easy to reorganize elements in Webflow Designer
4. **🧹 Clean Code** - No JavaScript relying on specific ID strings
5. **🚀 Maintainable** - Clear, semantic attribute names

---

## 🆚 Old vs New Approach

### **❌ Old Way (ID-based)**
```html
<div id="auth-modal">
  <button id="auth-close">×</button>
  <form id="email-signin-form">
    <input id="signin-email">
    <input id="signin-password">
  </form>
</div>
```

**Problems:**
- IDs must be unique across entire page
- Hard to duplicate elements
- Conflicts with Webflow's auto-generated IDs

### **✅ New Way (Attribute-based)**
```html
<div data-modal="auth">
  <button data-modal-action="close">×</button>
  <form data-form="signin">
    <input data-field="email">
    <input data-field="password">
  </form>
</div>
```

**Benefits:**
- No ID conflicts
- Easy to duplicate
- Works anywhere on the page
- Clear, semantic naming

---

## 📚 Quick Reference

| Element Type | Attribute | Value |
|--------------|-----------|-------|
| Auth Modal | `data-modal` | `auth` |
| Purchase Modal | `data-modal` | `purchase` |
| Close Button | `data-modal-action` | `close` |
| Sign In Tab | `data-auth-tab` | `signin` |
| Sign Up Tab | `data-auth-tab` | `signup` |
| Sign In Content | `data-auth-tab-content` | `signin` |
| Sign Up Content | `data-auth-tab-content` | `signup` |
| Sign In Form | `data-form` | `signin` |
| Sign Up Form | `data-form` | `signup` |
| Email Field | `data-field` | `email` |
| Password Field | `data-field` | `password` |
| Name Field | `data-field` | `name` |
| Reset Password | `data-action` | `reset-password` |
| Google Sign-In | `data-google-signin` | `[unique-id]` |
| Regular Purchase | `data-purchase-type` | `regular` |
| Box Set Purchase | `data-purchase-type` | `boxset` |
| Sign In Button | `data-button-type` | `sign-in` |
| Sign Out Button | `data-button-type` | `sign-out` |
| Rent Button | `data-button-type` | `rent` |
| Buy Button | `data-button-type` | `buy` |
| Watch Now Button | `data-button-type` | `watch-now` |
| Auth Required | `data-auth-required` | `true` |
| Purchase Required | `data-purchase-required` | `true` |
| Box Set Required | `data-boxset-required` | `true` |
| Show Not Signed In | `data-show-not-signed-in` | `true` |
| Show Not Paid | `data-show-not-paid` | `true` |
| Upgrade Prompt | `data-upgrade-prompt` | `true` |
| Error Container | `data-auth-error` | - |
| Success Container | `data-auth-success` | - |

---

## 🎓 Need Help?

If you need to add a new interaction:
1. Choose a semantic attribute name (e.g., `data-my-feature`)
2. Add it to your HTML/Webflow element
3. Update the JavaScript to query `[data-my-feature]`
4. Document it in this guide!

