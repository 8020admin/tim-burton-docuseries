# Stripe Products Setup Guide

This guide explains how to set up Stripe products for better reporting and management.

## 🎯 Why Use Stripe Products?

### Benefits:
- **Better Reporting**: Product-level metrics in Stripe Dashboard
- **Easier Management**: Update prices without code changes
- **Better Analytics**: Revenue tracking per product
- **Professional Integration**: Proper product names in invoices

### Current vs. New Approach:

**Current (Price Data):**
```typescript
price_data: {
  currency: 'usd',
  product_data: {
    name: product.name,
    description: product.description,
  },
  unit_amount: product.price,
}
```

**New (Stripe Products):**
```typescript
line_items: [{
  price: 'price_1234567890', // Stripe Price ID
  quantity: 1,
}]
```

## 🛠️ Setup Process

### Step 1: Create Products in Stripe

Run the setup script to create products automatically:

```bash
# Set your Stripe secret key
export STRIPE_SECRET_KEY=sk_test_...

# Run the setup script
node scripts/setup-stripe-products.js
```

### Step 2: Update Configuration

The script will output the Product IDs and Price IDs. Update your configuration:

```typescript
// In src/backend/functions/src/stripe.ts
const STRIPE_PRODUCTS = {
  rental: {
    priceId: 'price_rental_4day', // Replace with actual Price ID
    name: 'Tim Burton Docuseries - Rental',
    description: '4-day access to all 4 episodes',
    duration: 4, // days
  },
  regular: {
    priceId: 'price_regular_access', // Replace with actual Price ID
    name: 'Tim Burton Docuseries - Regular Purchase',
    description: 'Permanent access to 4 episodes',
    duration: null, // permanent
  },
  boxset: {
    priceId: 'price_boxset_complete', // Replace with actual Price ID
    name: 'Tim Burton Docuseries - Box Set',
    description: '4 episodes + 40 hours of bonus content',
    duration: null, // permanent
  },
};
```

### Step 3: Deploy Updated Functions

```bash
cd src/backend/functions
firebase deploy --only functions
```

### Step 4: Test the Integration

1. Test each product type (rental, regular, boxset)
2. Verify products appear correctly in Stripe Dashboard
3. Check that webhook events include product information

## 📊 What You'll Get

### Stripe Dashboard Benefits:
- **Products Tab**: See all your products with metrics
- **Revenue by Product**: Track which products sell best
- **Customer Portal**: Customers see proper product names
- **Invoicing**: Professional invoices with product details

### Webhook Events:
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "line_items": {
        "data": [{
          "price": {
            "id": "price_1234567890",
            "product": "prod_1234567890",
            "unit_amount": 2499
          }
        }]
      }
    }
  }
}
```

## 🔧 Manual Setup (Alternative)

If you prefer to create products manually in the Stripe Dashboard:

1. **Go to Stripe Dashboard** → Products
2. **Create each product** with the details below
3. **Copy the Price IDs** and update your configuration

### Product Details:

| Product | Name | Description | Price |
|---------|------|-------------|-------|
| Rental | Tim Burton Docuseries - Rental | 4-day access to all 4 episodes | $14.99 |
| Regular | Tim Burton Docuseries - Regular Purchase | Permanent access to 4 episodes | $24.99 |
| Box Set | Tim Burton Docuseries - Box Set | 4 episodes + 40 hours of bonus content | $74.99 |

## 🚀 Production Considerations

### Environment Variables:
```bash
# Development
STRIPE_SECRET_KEY=sk_test_...

# Production
STRIPE_SECRET_KEY=sk_live_...
```

### Price Updates:
- **Development**: Update prices in Stripe Dashboard
- **Production**: Use Stripe's price update features
- **A/B Testing**: Create multiple prices for the same product

### Monitoring:
- Set up Stripe webhooks for product events
- Monitor product performance in Stripe Dashboard
- Track conversion rates per product

## 🎉 Next Steps

After setting up products:

1. **Test thoroughly** with different product types
2. **Monitor performance** in Stripe Dashboard
3. **Set up alerts** for failed payments
4. **Consider promotions** using Stripe coupons
5. **Plan inventory management** if applicable

## 📚 Additional Resources

- [Stripe Products Documentation](https://stripe.com/docs/products)
- [Stripe Prices Documentation](https://stripe.com/docs/prices)
- [Stripe Reporting Documentation](https://stripe.com/docs/reporting)
- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)


