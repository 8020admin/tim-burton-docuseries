# 📋 Tim Burton Docuseries - Pending Tasks

**Last Updated:** December 2024

---

## 🔴 High Priority

### **1. Enable Stripe Automatic Receipt Emails**
**Status:** Pending  
**Effort:** 5 minutes  

**Action Required:**
1. Go to [Stripe Dashboard → Settings → Emails](https://dashboard.stripe.com/settings/emails)
2. Enable "Successful payments" emails
3. Customers will automatically receive receipt emails after purchase

**Why:** Users currently need to manually download receipts from the account page. Automatic emails provide better UX.

---

## 🟡 Medium Priority

### **2. Add New Product: Box Set Upgrade (Discounted Price)**
**Status:** Pending  
**Effort:** 2-3 hours  
**Reference:** `PRODUCT_MANAGEMENT_GUIDE.md`

**Description:**
Create an upgrade path for users who purchased the Regular edition to upgrade to Box Set at a discounted price ($49.99 instead of $74.99).

**Implementation Plan:**
1. **Create new Price in Stripe** for Box Set product:
   - Regular Price: $74.99 (existing)
   - Upgrade Price: $49.99 (new)
   
2. **Update Backend** (`src/backend/functions/src/stripe.ts`):
   - Add `upgrade` price ID to Box Set product
   - Create `getBoxSetPrice(userId)` function to check purchase history
   - Return upgrade price if user owns Regular edition
   
3. **Update Frontend** (purchase modal/page):
   - Display upgrade price for eligible users
   - Show "Save $25!" messaging
   - Update button text to "Upgrade to Box Set"

**Files to Update:**
- `src/backend/functions/src/stripe.ts`
- `public/js/stripe-integration.js` (or create new pricing display)
- `scripts/setup-stripe-products.js` (optional - to document new price)

**Testing:**
- Purchase Regular edition
- Verify Box Set shows discounted price
- Complete upgrade purchase
- Verify access to all content

---

### **3. Consider Initials Avatar for Email/Password Users**
**Status:** Optional/Nice-to-have  
**Effort:** 15-20 minutes  

**Description:**
Users who sign up with email/password don't have profile pictures. We can generate initials-based avatars using a free service.

**Implementation:**
Add fallback to `account-page.js`:
```javascript
generateInitialsAvatar(firstName, lastName) {
  const name = `${firstName || ''} ${lastName || ''}`.trim() || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=random&color=fff`;
}

// In populateProfile()
if (photoEl) {
  if (this.user.photoURL) {
    photoEl.src = this.user.photoURL;
  } else {
    photoEl.src = this.generateInitialsAvatar(this.user.firstName, this.user.lastName);
  }
}
```

**Why Optional:** Profile pictures aren't critical for a streaming platform. Google users already have photos, and email users can function without them.

---

## 🔵 Low Priority / Future Considerations

### **4. Email Update Functionality**
**Status:** Disabled (Firebase restriction)  
**Effort:** Investigation required  

**Current State:**
Email updates are currently disabled because Firebase returns `auth/operation-not-allowed` error.

**Options:**
1. **Keep disabled** - Most platforms don't allow email changes without support
2. **Contact Firebase support** - Investigate if there's a specific setting needed
3. **Implement workaround** - Create support contact form for email change requests

**Decision:** Keep disabled for now. Users get clear message if they try to change email.

---

### **5. Add More Products**
**Status:** As needed  
**Reference:** `PRODUCT_MANAGEMENT_GUIDE.md`

**When Adding New Products:**
Follow the comprehensive guide in `PRODUCT_MANAGEMENT_GUIDE.md`:
1. Create product in Stripe
2. Update `src/backend/functions/src/stripe.ts`
3. Update `public/js/account-page.js` (for display)
4. Test purchase flow
5. Verify receipt generation

---

## ✅ Recently Completed

### Account Page Improvements _(Dec 2024)_
- ✅ Fixed first name input prefill (multiple elements issue)
- ✅ Removed `data-purchase-product-description` from purchase items
- ✅ Eliminated all `alert()` calls (graceful error handling)
- ✅ Added button spinners with page refresh on profile updates
- ✅ Fixed receipt download with proper authorization
- ✅ Added sign-out redirect from account page

### Password Validation _(Dec 2024)_
- ✅ Implemented strong password requirements (8+ chars, uppercase, lowercase, number)
- ✅ Client-side validation in `client-auth.js`
- ✅ Server-side validation in `auth.ts`
- ✅ Updated documentation

---

## 🗂️ Documentation Files

| File | Purpose |
|------|---------|
| `PRODUCT_MANAGEMENT_GUIDE.md` | How to add/manage products in Stripe + codebase |
| `WEBFLOW_INTEGRATION.md` | Complete integration guide for Webflow |
| `STRIPE_GUIDE.md` | Stripe setup and configuration |
| `FIREBASE_GUIDE.md` | Firebase setup and deployment |
| `PROJECT_SPEC.md` | Original project requirements |

---

## 📝 Notes

- All code changes should follow the patterns in `always_applied_workspace_rules`
- Keep files under 200-300 lines (refactor if needed)
- Never use `alert()` - always use graceful inline error messages
- Test in Webflow staging before pushing to production
- Update this TODO file as tasks are completed or new ones are identified

---

## 🚀 Quick Links

- **Webflow Dev:** https://timburton-dev.webflow.io/
- **Cloudflare Pages:** https://tim-burton-docuseries.pages.dev/
- **Firebase Console:** https://console.firebase.google.com/project/tim-burton-docuseries
- **Stripe Dashboard:** https://dashboard.stripe.com/

---

_This file tracks pending work and design decisions. Update it as you complete tasks or identify new work._

