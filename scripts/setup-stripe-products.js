#!/usr/bin/env node

/**
 * Setup Stripe Products Script
 * 
 * This script creates the necessary products and prices in Stripe
 * for the Tim Burton Docuseries platform.
 * 
 * Usage:
 *   node scripts/setup-stripe-products.js
 * 
 * Make sure to set your STRIPE_SECRET_KEY environment variable first.
 */

const Stripe = require('stripe');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function createStripeProducts() {
  try {
    console.log('🛠️ Creating Stripe products for Tim Burton Docuseries...\n');
    
    const products = [];
    
    // Create Rental Product
    console.log('Creating Rental product...');
    const rentalProduct = await stripe.products.create({
      name: 'Tim Burton Docuseries - Rental',
      description: '4-day access to all 4 episodes',
      metadata: {
        type: 'rental',
        duration_days: '4'
      }
    });
    
    const rentalPrice = await stripe.prices.create({
      product: rentalProduct.id,
      unit_amount: 1499, // $14.99
      currency: 'usd',
      metadata: {
        product_type: 'rental'
      }
    });
    
    products.push({
      type: 'rental',
      productId: rentalProduct.id,
      priceId: rentalPrice.id,
      name: rentalProduct.name,
      amount: '$14.99'
    });
    
    console.log(`✅ Rental: ${rentalProduct.name}`);
    console.log(`   Product ID: ${rentalProduct.id}`);
    console.log(`   Price ID: ${rentalPrice.id}\n`);
    
    // Create Regular Product
    console.log('Creating Regular product...');
    const regularProduct = await stripe.products.create({
      name: 'Tim Burton Docuseries - Regular Purchase',
      description: 'Permanent access to 4 episodes',
      metadata: {
        type: 'regular',
        duration: 'permanent'
      }
    });
    
    const regularPrice = await stripe.prices.create({
      product: regularProduct.id,
      unit_amount: 2499, // $24.99
      currency: 'usd',
      metadata: {
        product_type: 'regular'
      }
    });
    
    products.push({
      type: 'regular',
      productId: regularProduct.id,
      priceId: regularPrice.id,
      name: regularProduct.name,
      amount: '$24.99'
    });
    
    console.log(`✅ Regular: ${regularProduct.name}`);
    console.log(`   Product ID: ${regularProduct.id}`);
    console.log(`   Price ID: ${regularPrice.id}\n`);
    
    // Create Box Set Product
    console.log('Creating Box Set product...');
    const boxsetProduct = await stripe.products.create({
      name: 'Tim Burton Docuseries - Box Set',
      description: '4 episodes + 40 hours of bonus content',
      metadata: {
        type: 'boxset',
        duration: 'permanent'
      }
    });
    
    const boxsetPrice = await stripe.prices.create({
      product: boxsetProduct.id,
      unit_amount: 7499, // $74.99
      currency: 'usd',
      metadata: {
        product_type: 'boxset'
      }
    });
    
    products.push({
      type: 'boxset',
      productId: boxsetProduct.id,
      priceId: boxsetPrice.id,
      name: boxsetProduct.name,
      amount: '$74.99'
    });
    
    console.log(`✅ Box Set: ${boxsetProduct.name}`);
    console.log(`   Product ID: ${boxsetProduct.id}`);
    console.log(`   Price ID: ${boxsetPrice.id}\n`);
    
    // Summary
    console.log('🎉 All Stripe products created successfully!\n');
    console.log('📋 Summary:');
    console.log('┌─────────────┬─────────────────────────────────┬─────────────────────┬─────────────────────┐');
    console.log('│ Type        │ Name                            │ Product ID          │ Price ID            │');
    console.log('├─────────────┼─────────────────────────────────┼─────────────────────┼─────────────────────┤');
    
    products.forEach(p => {
      const type = p.type.padEnd(11);
      const name = p.name.length > 31 ? p.name.substring(0, 28) + '...' : p.name.padEnd(31);
      const productId = p.productId.padEnd(19);
      const priceId = p.priceId.padEnd(19);
      console.log(`│ ${type} │ ${name} │ ${productId} │ ${priceId} │`);
    });
    
    console.log('└─────────────┴─────────────────────────────────┴─────────────────────┴─────────────────────┘\n');
    
    console.log('🔧 Next steps:');
    console.log('1. Update your STRIPE_PRODUCTS configuration in src/backend/functions/src/stripe.ts');
    console.log('2. Replace the placeholder price IDs with the actual ones above');
    console.log('3. Deploy your updated functions');
    console.log('4. Test the checkout flow\n');
    
    console.log('📝 Configuration to update:');
    console.log('const STRIPE_PRODUCTS = {');
    products.forEach(p => {
      console.log(`  ${p.type}: {`);
      console.log(`    priceId: '${p.priceId}',`);
      console.log(`    name: '${p.name}',`);
      console.log(`    description: '${p.description || 'N/A'}',`);
      console.log(`    duration: ${p.type === 'rental' ? '4' : 'null'},`);
      console.log(`  },`);
    });
    console.log('};');
    
    return {
      success: true,
      products: products
    };
    
  } catch (error) {
    console.error('❌ Error creating Stripe products:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the script
if (require.main === module) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Error: STRIPE_SECRET_KEY environment variable is required');
    console.log('Set it with: export STRIPE_SECRET_KEY=sk_test_...');
    process.exit(1);
  }
  
  createStripeProducts()
    .then(result => {
      if (result.success) {
        console.log('✅ Setup completed successfully!');
        process.exit(0);
      } else {
        console.error('❌ Setup failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { createStripeProducts };


