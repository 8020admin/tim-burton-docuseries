# 📦 Product Management Guide

## Overview

Products are managed in **three places** that must stay synchronized:

1. **Stripe Dashboard/API** - Source of truth for pricing and checkout
2. **Backend Configuration** (`src/backend/functions/src/stripe.ts`) - Product IDs and metadata
3. **Frontend Display** (`public/js/account-page.js`) - Display names and descriptions for purchase history

---

## Current Products

| Product Type | Name | Price | Description | Duration |
|--------------|------|-------|-------------|----------|
| `rental` | Tim Burton Docuseries - Rental | $24.99 | 4-day access to all 4 episodes | 4 days |
| `regular` | Tim Burton Docuseries - Regular Purchase | $39.99 | Permanent access to 4 episodes | Permanent |
| `boxset` | Tim Burton Docuseries - Box Set | $74.99 | 4 episodes + 40 hours of bonus content | Permanent |

---

## How to Add a New Product

### Step 1: Create Product in Stripe

**Option A: Use the Setup Script** (Recommended)

1. Edit `scripts/setup-stripe-products.js`
2. Add your new product (follow the existing pattern):

```javascript
// Create New Product
console.log('Creating New Product...');
const newProduct = await stripe.products.create({
  name: 'Tim Burton Docuseries - Premium Edition',
  description: 'All episodes + exclusive director commentary',
  metadata: {
    type: 'premium',
    duration: 'permanent'
  }
});

const newPrice = await stripe.prices.create({
  product: newProduct.id,
  unit_amount: 9999, // $99.99 in cents
  currency: 'usd',
  metadata: {
    product_type: 'premium'
  }
});
```

3. Run the script:
```bash
cd scripts
export STRIPE_SECRET_KEY=sk_test_your_key_here
node setup-stripe-products.js
```

4. **Save the Product ID and Price ID** from the output

**Option B: Create Manually in Stripe Dashboard**

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Click **"+ Add product"**
3. Fill in:
   - **Name**: `Tim Burton Docuseries - Premium Edition`
   - **Description**: `All episodes + exclusive director commentary`
   - **Pricing**: One-time payment, $99.99 USD
   - **Metadata**: Add `type: premium`, `duration: permanent`
4. Click **"Save product"**
5. **Copy the Product ID** (e.g., `prod_ABC123`)
6. **Copy the Price ID** (e.g., `price_ABC123`)

---

### Step 2: Update Backend Configuration

Edit `src/backend/functions/src/stripe.ts`:

```typescript
// Line 15-37: Add to STRIPE_PRODUCTS
const STRIPE_PRODUCTS = {
  rental: { ... },
  regular: { ... },
  boxset: { ... },
  premium: {  // ← ADD THIS
    productId: 'prod_ABC123', // From Stripe
    priceId: 'price_ABC123',   // From Stripe
    name: 'Tim Burton Docuseries - Premium Edition',
    description: 'All episodes + exclusive director commentary',
    duration: null, // null = permanent, or number of days for rental
  },
};

// Line 40-62: Add to PRODUCTS (legacy compatibility)
const PRODUCTS = {
  rental: { ... },
  regular: { ... },
  boxset: { ... },
  premium: {  // ← ADD THIS
    name: STRIPE_PRODUCTS.premium.name,
    description: STRIPE_PRODUCTS.premium.description,
    price: 9999, // $99.99 in cents
    type: 'premium' as const,
    duration: STRIPE_PRODUCTS.premium.duration,
  },
};
```

**Update TypeScript types:**

Find the `productType` parameter types and add `'premium'`:

```typescript
// Example locations:
export async function canUserPurchase(
  userId: string, 
  productType: 'rental' | 'regular' | 'boxset' | 'premium'  // ← ADD 'premium'
) { ... }

export async function createCheckoutSession(
  userId: string,
  productType: 'rental' | 'regular' | 'boxset' | 'premium',  // ← ADD 'premium'
  ...
) { ... }
```

---

### Step 3: Update Frontend Display

Edit `public/js/account-page.js` (lines ~15-33):

```javascript
this.products = {
  rental: {
    name: 'Tim Burton Docuseries - Rental',
    description: '4-day access to all 4 episodes',
    price: 14.99,
    duration: '4 days'
  },
  regular: {
    name: 'Tim Burton Docuseries - Regular Purchase',
    description: 'Permanent access to 4 episodes',
    price: 24.99,
    duration: 'Permanent'
  },
  boxset: {
    name: 'Tim Burton Docuseries - Box Set',
    description: '4 episodes + 40 hours of bonus content',
    price: 74.99,
    duration: 'Permanent'
  },
  premium: {  // ← ADD THIS
    name: 'Tim Burton Docuseries - Premium Edition',
    description: 'All episodes + <strong>exclusive director commentary</strong>',
    price: 99.99,
    duration: 'Permanent'
  }
};
```

**Note:** The `description` field supports HTML for styling!

---

### Step 4: Build & Deploy Backend

```bash
cd src/backend/functions
npm run build
cd ../../..
firebase deploy --only functions
```

---

### Step 5: Deploy Frontend (Automatic)

Commit and push your changes to trigger Cloudflare Pages auto-deploy:

```bash
git add .
git commit -m "Add premium product"
git push origin main
```

Cloudflare Pages will automatically deploy the updated `account-page.js`.

---

## Keeping Products in Sync

### ✅ Checklist for Adding/Updating Products

- [ ] Create/update product in Stripe Dashboard
- [ ] Copy Product ID and Price ID
- [ ] Update `STRIPE_PRODUCTS` in `stripe.ts`
- [ ] Update `PRODUCTS` in `stripe.ts`
- [ ] Add product type to TypeScript type definitions
- [ ] Update `this.products` in `account-page.js`
- [ ] Build and deploy backend functions
- [ ] Commit and push frontend changes
- [ ] Test checkout flow with new product
- [ ] Verify purchase appears correctly on `/account` page

---

## Testing New Products

1. **Create a test purchase:**
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any CVC

2. **Verify purchase appears on `/account` page:**
   - Product name displays correctly
   - Description renders (with HTML if used)
   - Price shows correctly
   - Receipt download works

3. **Check Stripe Dashboard:**
   - Payment appears in [Payments](https://dashboard.stripe.com/payments)
   - Product metadata is correct

---

## Important Notes

### Product Type Naming
- Use **lowercase, single-word** product types: `rental`, `regular`, `boxset`, `premium`
- This ensures consistency across Stripe metadata, backend code, and frontend

### Pricing
- Backend uses **cents** (e.g., `9999` = $99.99)
- Frontend uses **dollars** (e.g., `99.99`)
- Always keep these in sync!

### HTML in Descriptions
The `description` field in `account-page.js` supports HTML:
```javascript
description: '<strong>Permanent</strong> access to <em>all episodes</em>'
```

### Stripe Receipt Emails
Enable automatic receipt emails in [Stripe Dashboard → Settings → Emails](https://dashboard.stripe.com/settings/emails):
- ✅ Enable "Successful payments"
- Customers will receive receipts automatically
- The `/account` page "Download Receipt" button provides quick access to the same receipt

---

## Troubleshooting

### "Product not found" error
- Verify Product ID and Price ID are correct in `stripe.ts`
- Check Stripe Dashboard to confirm product exists
- Ensure you're using the correct Stripe account (test vs. live)

### Purchase doesn't appear on account page
- Check browser console for errors
- Verify product type in `account-page.js` matches Stripe metadata
- Ensure backend deployed successfully

### Receipt download fails
- Verify Stripe webhook is working (check Firebase Functions logs)
- Ensure purchase has a `stripePaymentIntentId` in Firestore
- Check that receipt emails are enabled in Stripe

---

## Questions?

If you're unsure about any step, check:
1. `STRIPE_PRODUCTS_SETUP.md` - Detailed Stripe setup guide
2. `STRIPE_GUIDE.md` - General Stripe integration overview
3. Firebase Functions logs - `firebase functions:log`
4. Stripe Dashboard logs - [Stripe Logs](https://dashboard.stripe.com/logs)

