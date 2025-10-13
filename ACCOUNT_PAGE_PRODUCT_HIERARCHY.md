# 📦 Account Page Product Hierarchy & Upgrade Prompts

**Implementation Date:** December 2024  
**Status:** ✅ Complete & Deployed

---

## 🎯 Overview

The account page now automatically:
1. **Determines the user's current product** based on purchase hierarchy
2. **Displays the appropriate upgrade prompt** (if applicable)
3. **Handles all pricing logic** for upgrades (including discounts)

---

## 📊 Product Hierarchy

**Rule:** If a user purchases multiple products, only the **highest tier** is displayed as their "current product."

### **Tier System:**

```
┌─────────────────────────────────┐
│  Tier 3: Box Set ($74.99)      │  ← Highest
│  4 episodes + 40 hours bonus    │
└─────────────────────────────────┘
          ↑ Prevails over
┌─────────────────────────────────┐
│  Tier 2: Regular ($24.99)      │
│  Permanent access to 4 episodes │
└─────────────────────────────────┘
          ↑ Prevails over
┌─────────────────────────────────┐
│  Tier 1: Rental ($14.99)       │  ← Lowest
│  4-day access to 4 episodes     │
└─────────────────────────────────┘
```

### **Examples:**

| User Purchases | Current Product Shown |
|---------------|----------------------|
| Rental only | Rental (Tier 1) |
| Regular only | Regular (Tier 2) |
| Box Set only | Box Set (Tier 3) |
| Rental + Regular | **Regular** (Tier 2 prevails) |
| Regular + Box Set | **Box Set** (Tier 3 prevails) |
| All three | **Box Set** (highest tier) |

**Special Cases:**
- **Expired Rental:** Not counted as "current product"
- **Multiple Rentals:** The one expiring latest is used
- **No Purchases:** Shows "No active product"

---

## 🔄 Upgrade Prompts

### **Upgrade Logic:**

```
Rental User  →  Upgrade to Regular ($24.99)
                ✅ Same price they paid
                ✅ Permanent access

Regular User →  Upgrade to Box Set ($49.99)
                ✅ $25 OFF regular price ($74.99)
                ✅ 40 hours of bonus content

Box Set User →  No upgrade (highest tier)
                🎉 They have everything!
```

### **Pricing Breakdown:**

| From | To | Regular Price | Upgrade Price | Savings |
|------|-----|--------------|---------------|---------|
| **Rental** | Regular | $24.99 | **$24.99** | $0 (same price) |
| **Regular** | Box Set | $74.99 | **$49.99** | **$25.00** |
| **Box Set** | - | - | - | No upgrade |

---

## 🏷️ New Webflow Attributes

### **Current Product Display**

These attributes are automatically populated when the account page loads:

```html
<!-- Product Name -->
<div data-current-product-name>Tim Burton Docuseries - Regular Purchase</div>

<!-- Product Description -->
<div data-current-product-description>Permanent access to 4 episodes</div>

<!-- Product Type (rental, regular, boxset, or "none") -->
<div data-current-product-type>regular</div>

<!-- Product Tier (0 = no product, 1 = rental, 2 = regular, 3 = boxset) -->
<div data-current-product-tier>2</div>

<!-- Expiration Date (only visible for active rentals) -->
<div data-current-product-expires style="display: none;">Expires: 12/25/2024</div>
```

### **Upgrade Prompt**

The upgrade prompt container is automatically shown/hidden based on eligibility:

```html
<div data-upgrade-prompt style="display: none;">
  
  <!-- Product Name -->
  <span data-upgrade-product-name>Box Set</span>
  
  <!-- Description -->
  <p data-upgrade-description>
    Upgrade to get 40 hours of exclusive bonus content
  </p>
  
  <!-- Pricing -->
  <span data-upgrade-price>$49.99</span>
  <span data-upgrade-full-price style="display: none;">$74.99</span>
  <span data-upgrade-savings style="display: none;">Save $25.00!</span>
  
  <!-- CTA (data-product-type is automatically set) -->
  <button data-upgrade-cta data-product-type="boxset">
    Upgrade to Box Set
  </button>
  
</div>
```

---

## 🔧 Implementation Details

### **Files Modified:**

1. **`public/js/account-page.js`** (Lines 188-564)
   - Added `getCurrentProduct()` - determines highest tier product
   - Added `displayCurrentProduct()` - populates UI with current product
   - Added `getUpgradePrompt()` - determines upgrade offer
   - Added `displayUpgradePrompt()` - populates UI with upgrade details

2. **`WEBFLOW_INTEGRATION.md`** (Lines 1318-1608)
   - Added "Current Product Display" section
   - Added "Upgrade Prompts" section
   - Updated attribute reference table

### **Key Functions:**

**`getCurrentProduct()`**
```javascript
// Returns highest tier product with:
{
  type: 'regular',
  name: 'Tim Burton Docuseries - Regular Purchase',
  description: 'Permanent access to 4 episodes',
  tier: 2
}
```

**`getUpgradePrompt()`**
```javascript
// Returns upgrade details or null:
{
  from: 'regular',
  to: 'boxset',
  productName: 'Box Set',
  fullPrice: 74.99,
  upgradePrice: 49.99,
  savings: 25.00,
  description: 'Upgrade to get 40 hours of exclusive bonus content',
  ctaText: 'Upgrade to Box Set'
}
```

---

## 📋 Webflow Setup Checklist

To use these features in Webflow:

### **1. Current Product Section**

```html
<section class="current-product">
  <h2>Your Current Plan</h2>
  
  <div class="product-card">
    <h3 data-current-product-name>Loading...</h3>
    <p data-current-product-description>Loading...</p>
    <span data-current-product-expires style="display: none;"></span>
  </div>
  
  <!-- Hidden elements for conditional logic -->
  <div data-current-product-type style="display: none;">none</div>
  <div data-current-product-tier style="display: none;">0</div>
</section>
```

### **2. Upgrade Prompt Section**

```html
<section data-upgrade-prompt style="display: none;">
  <h2>Upgrade Your Plan</h2>
  
  <div class="upgrade-card">
    <h3>
      Upgrade to <span data-upgrade-product-name></span>
    </h3>
    
    <p data-upgrade-description></p>
    
    <div class="pricing">
      <span class="current-price" data-upgrade-price></span>
      <span class="original-price strikethrough" data-upgrade-full-price></span>
    </div>
    
    <span class="savings-badge" data-upgrade-savings></span>
    
    <button class="cta-button" data-upgrade-cta data-product-type="">
      Upgrade Now
    </button>
  </div>
</section>
```

### **3. CSS Styling (Optional)**

```css
/* Original price with strikethrough */
.original-price.strikethrough {
  text-decoration: line-through;
  opacity: 0.6;
  margin-left: 8px;
}

/* Savings badge */
.savings-badge {
  background-color: #22c55e;
  color: white;
  padding: 4px 12px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 14px;
}
```

---

## 🧪 Testing Scenarios

### **Test 1: Rental User**
1. Purchase Rental ($14.99)
2. Visit `/account`
3. **Expected:**
   - Current Product: "Tim Burton Docuseries - Rental"
   - Expiration date visible
   - Upgrade prompt shows "Regular Purchase" at $24.99
   - No savings badge

### **Test 2: Regular User**
1. Purchase Regular ($24.99)
2. Visit `/account`
3. **Expected:**
   - Current Product: "Tim Burton Docuseries - Regular Purchase"
   - No expiration date
   - Upgrade prompt shows "Box Set" at $49.99
   - Original price $74.99 with strikethrough
   - "Save $25.00!" badge visible

### **Test 3: Box Set User**
1. Purchase Box Set ($74.99)
2. Visit `/account`
3. **Expected:**
   - Current Product: "Tim Burton Docuseries - Box Set"
   - No expiration date
   - **No upgrade prompt** (hidden)

### **Test 4: Multi-Purchase User**
1. Purchase Rental ($14.99)
2. Purchase Regular ($24.99)
3. Visit `/account`
4. **Expected:**
   - Current Product: "Regular Purchase" (Tier 2 prevails)
   - Purchase history shows both purchases
   - Upgrade prompt shows "Box Set" at $49.99 (not Regular, since they already have it)

### **Test 5: Expired Rental**
1. Purchase Rental (now expired)
2. Visit `/account`
3. **Expected:**
   - Current Product: "No active product"
   - Purchase history shows expired rental
   - No upgrade prompt

---

## 🔒 Security Notes

All product hierarchy logic runs **client-side** using data from authenticated backend endpoints:

- ✅ Purchase data fetched from `/payments/history` (requires auth token)
- ✅ User can only see their own purchases
- ✅ Upgrade prices are informational only (actual checkout uses backend pricing)
- ✅ No sensitive data exposed in JavaScript

**Important:** The upgrade pricing shown on the account page is **for display purposes only**. When the user clicks "Upgrade," they are directed through Stripe Checkout, which uses the **backend's authoritative pricing** from `src/backend/functions/src/stripe.ts`.

---

## 🚀 Future Enhancements

### **Possible Next Steps:**

1. **Apply Upgrade Discount Automatically**
   - Detect user's current product during Stripe checkout
   - Apply Box Set upgrade discount ($49.99) for Regular users
   - Requires backend changes to `createCheckoutSession()`

2. **Email Upgrade Offers**
   - Send targeted emails to Rental users (upgrade to permanent)
   - Send targeted emails to Regular users (Box Set discount)
   - Requires email integration (Mailgun, SendGrid, etc.)

3. **Limited-Time Upgrade Offers**
   - Add countdown timer for Box Set discount
   - "Upgrade by [date] to save $25!"
   - Store offer expiration in Firestore

4. **Bundle Discounts**
   - If user buys Rental, offer immediate discount for Regular
   - "Complete your purchase now and save 20%"

---

## 📖 Documentation

Full integration guide: **`WEBFLOW_INTEGRATION.md`** (Section 14: Account Page Integration)

- Current Product Display: Lines 1318-1360
- Upgrade Prompts: Lines 1363-1439
- Attributes Reference: Lines 1567-1608

---

## ✅ Completion Checklist

- [x] Implemented product hierarchy logic
- [x] Created current product display
- [x] Created upgrade prompt system
- [x] Added all 13 new data attributes
- [x] Updated WEBFLOW_INTEGRATION.md
- [x] Tested with all product combinations
- [x] Deployed to Cloudflare Pages
- [x] Security review completed

---

**Status:** ✅ **Ready for Production**

All features are live and available at:
- **Dev:** https://timburton-dev.webflow.io/account
- **Production:** https://tim-burton-docuseries.pages.dev/account

