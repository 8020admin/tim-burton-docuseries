# Password Reset Implementation Guide

## ✅ What's Already Done

Your project already has **everything needed** for custom password reset:

- ✅ Backend endpoints (`password-reset.ts`)
- ✅ SendGrid email template configured
- ✅ Frontend methods (`resetPassword()`, `confirmPasswordReset()`)
- ✅ Password recovery modal handlers
- ✅ Email sending via SendGrid with custom branding

---

## 🎯 What You Need to Do

### 1. Disable Firebase's Default Password Page (5 minutes)

**Option A: Firebase Console** (Recommended)

1. Go to [Firebase Console → Authentication → Templates](https://console.firebase.google.com/project/tim-burton-docuseries/authentication/emails)
2. Click **"Email Templates"** → **"Password reset"**
3. Click **"Customize action URL"**
4. Enter: `https://timburton-dev.webflow.io/reset-password`
5. Click **"Save"**

**Option B: Environment Variable** (Already configured)

Your backend already has this in `password-reset.ts`:
```typescript
url: process.env.PASSWORD_RESET_URL || 'https://timburton-dev.webflow.io/reset-password'
```

Just make sure your `.env` has:
```bash
PASSWORD_RESET_URL=https://timburton-dev.webflow.io/reset-password
```

---

### 2. Build Password Recovery Modal in Webflow (15 minutes)

This modal opens when users click "Forgot Password?" in your sign-in form.

#### HTML Structure

```html
<div data-modal="password-recovery" style="display: none;">
  <div class="modal-content">
    <!-- Header -->
    <h2>Reset Password</h2>
    <button data-modal-action="close">×</button>
    
    <!-- Form -->
    <form data-form="password-recovery">
      <input 
        type="email" 
        data-field="email" 
        placeholder="Enter your email"
        required
      />
      
      <button type="submit" data-button="submit">
        Send Reset Email
      </button>
      
      <!-- Messages -->
      <div data-auth-error style="display: none;"></div>
      <div data-auth-success style="display: none;"></div>
    </form>
    
    <!-- Footer -->
    <button data-action="back-to-signin">Back to Sign In</button>
  </div>
</div>
```

#### Webflow Attributes to Add

| Element | Attribute | Value |
|---------|-----------|-------|
| Modal Container | `data-modal` | `password-recovery` |
| Modal Container | `style` | `display: none;` |
| Close Button | `data-modal-action` | `close` |
| Form | `data-form` | `password-recovery` |
| Email Input | `data-field` | `email` |
| Submit Button | `data-button` | `submit` |
| Error Container | `data-auth-error` | (no value) |
| Success Container | `data-auth-success` | (no value) |
| Back Button | `data-action` | `back-to-signin` |

---

### 3. Build Password Reset Page in Webflow (30 minutes)

Create a new **dedicated Webflow page** (NOT a modal) where users will land when they click the link in their email. This is a standalone page with a simple form.

#### Page Setup
- **Page Slug:** `reset-password`
- **Full URL:** `https://timburton-dev.webflow.io/reset-password`
- **Type:** Regular page (not a modal or popup)

#### HTML Structure

This is a simple centered form on a dedicated page:

```html
<!-- This is the ENTIRE page content - no modal wrapper -->
<div class="reset-password-container">
  
  <!-- Header -->
  <div class="reset-password-header">
    <h1>Create New Password</h1>
    <p>Enter your new password below.</p>
  </div>
  
  <!-- Form -->
  <form data-form="reset-password" class="reset-password-form">
    
    <!-- New Password Field -->
    <div class="form-field">
      <label for="new-password">New Password</label>
      <input 
        type="password" 
        id="new-password"
        data-field="new-password" 
        placeholder="Enter new password"
        required
      />
      <small class="help-text">
        Must be 8+ characters with uppercase, lowercase, and a number
      </small>
    </div>
    
    <!-- Confirm Password Field -->
    <div class="form-field">
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
    <button type="submit" data-button="reset-password-submit" class="submit-button">
      Reset Password
    </button>
    
    <!-- Feedback Messages -->
    <div data-reset-error class="error-message" style="display: none;"></div>
    <div data-reset-success class="success-message" style="display: none;"></div>
  </form>
  
  <!-- Back to Home Link -->
  <div class="reset-password-footer">
    <a href="/" class="back-link">Back to Home</a>
  </div>
  
</div>
```

**Key Points:**
- This is a **standalone page**, not wrapped in any modal
- Style it like a normal page with centered content
- The form will submit, show success message, and redirect to homepage
- No modal overlay or popup behavior needed

#### Webflow Attributes to Add

| Element | Attribute | Value |
|---------|-----------|-------|
| Form | `data-form` | `reset-password` |
| New Password Input | `data-field` | `new-password` |
| Confirm Password Input | `data-field` | `confirm-password` |
| Submit Button | `data-button` | `reset-password-submit` |
| Error Container | `data-reset-error` | (no value) |
| Success Container | `data-reset-success` | (no value) |

#### JavaScript Handler

The password reset page requires the external script. This is already included in your **Project Settings → Custom Code → Head Code** with all other scripts, but if you need to add it separately to this page:

**Add to Page Settings → Custom Code → Before `</body>`**:

```html
<script src="https://tim-burton-docuseries.pages.dev/js/password-reset-page.js"></script>
```

**What this script does:**
- Extracts the `oobCode` from the URL parameters
- Validates that passwords match
- Calls Firebase Auth to confirm the password reset
- Shows success/error messages with proper styling
- Redirects to homepage on success

**Note:** Make sure the Firebase Auth scripts are loaded first (they should be in your Project Settings → Head Code).

---

## 📧 SendGrid Email Already Configured ✅

Your SendGrid template is ready! It sends emails with:

**Variables:**
```json
{
  "firstName": "User",
  "resetLink": "https://timburton-dev.webflow.io/reset-password?oobCode=abc123..."
}
```

**Template should contain:**
```html
<h1>Reset Your Password</h1>
<p>Hi {{firstName}},</p>
<p>Click the button below to reset your password:</p>
<a href="{{resetLink}}">Reset Password</a>
<p>This link expires in 1 hour.</p>
```

---

## 🔄 How It Works

1. **User clicks "Forgot Password?"** → Password Recovery Modal opens (popup)
2. **User enters email in modal** → System sends reset email via SendGrid
3. **User clicks link in email** → Opens dedicated `/reset-password` page (standalone page, NOT a modal)
4. **User enters new password on page** → System validates and updates password
5. **Success!** → Page shows success message and redirects to homepage after 2 seconds

---

## 🚀 Deployment

### Deploy the New JavaScript File

Since you're using Cloudflare Pages for your frontend assets, the new password reset script needs to be deployed:

```bash
# From project root
git add public/js/password-reset-page.js
git commit -m "Add password reset page handler"
git push origin main
```

Cloudflare Pages will automatically deploy the new file to:
`https://tim-burton-docuseries.pages.dev/js/password-reset-page.js`

**Wait 1-2 minutes** for deployment, then the script will be available for your Webflow page.

---

## ✅ Testing Checklist

- [ ] **Deploy:** Commit and push `password-reset-page.js` to trigger Cloudflare deployment
- [ ] **Firebase Console:** Customize action URL to your Webflow site
- [ ] **Webflow:** Build password recovery modal with correct attributes
- [ ] **Webflow:** Create `/reset-password` page with form and script reference
- [ ] **Test Modal:** Click "Forgot Password?" → Enter email → See success message
- [ ] **Test Email:** Check inbox → Verify SendGrid email arrives with custom link
- [ ] **Test Reset Page:** Click link → Enter new password → See success message
- [ ] **Test Sign In:** Use new password to sign in successfully

---

## 📚 Full Documentation

For complete details, see:
- **WEBFLOW_INTEGRATION.md** - Section 11: Password Recovery System
- **FIREBASE_GUIDE.md** - Email Templates configuration
- **SENDGRID_GUIDE.md** - Email template setup

---

## 🆘 Troubleshooting

**Modal not opening:**
- Check `data-action="reset-password"` on "Forgot Password?" link
- Verify `webflow-auth-handlers.js` is loaded

**Email not sending:**
- Check Firebase Functions logs: `firebase functions:log`
- Verify `SENDGRID_TEMPLATE_PASSWORD_RESET` in `.env`

**Reset page not working:**
- Verify page slug is exactly `reset-password`
- Check `oobCode` parameter in URL
- Ensure Firebase scripts loaded in project head code

**Password validation fails:**
- Minimum 8 characters
- Must have uppercase, lowercase, and number

---

_Quick reference guide for implementing custom password reset. See WEBFLOW_INTEGRATION.md for detailed instructions._

