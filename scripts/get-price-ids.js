#!/usr/bin/env node

/**
 * Get Stripe Price IDs Script
 * 
 * This script fetches the Price IDs for the products you created in Stripe.
 * 
 * Usage:
 *   node scripts/get-price-ids.js
 * 
 * Make sure to set your STRIPE_SECRET_KEY environment variable first.
 */

const Stripe = require('stripe');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Your Product IDs from Stripe
const PRODUCT_IDS = {
  rental: 'prod_TC4QfwGl48nNV0', // Tim Burton Docuseries - Rental
  regular: 'prod_TC2n3CqFP5Cct9', // Tim Burton Docuseries - Regular
  boxset: 'prod_TC4PDyQhTgSNYe', // Tim Burton Docuseries - Box Set
};

async function getPriceIds() {
  try {
    console.log('🔍 Fetching Price IDs for your Stripe products...\n');
    
    const results = {};
    
    for (const [type, productId] of Object.entries(PRODUCT_IDS)) {
      console.log(`Fetching prices for ${type} (${productId})...`);
      
      // Get all prices for this product
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 10
      });
      
      if (prices.data.length === 0) {
        console.log(`❌ No active prices found for ${type}`);
        continue;
      }
      
      // Find the price with the correct amount
      let targetPrice = null;
      const expectedAmounts = {
        rental: 2499, // $24.99
        regular: 3999, // $39.99
        boxset: 7499, // $74.99
      };
      
      targetPrice = prices.data.find(price => price.unit_amount === expectedAmounts[type]);
      
      if (!targetPrice) {
        // If no exact match, use the first active price
        targetPrice = prices.data[0];
        console.log(`⚠️  No exact price match for ${type}, using first available price`);
      }
      
      results[type] = {
        productId: productId,
        priceId: targetPrice.id,
        amount: targetPrice.unit_amount,
        currency: targetPrice.currency,
        name: type
      };
      
      console.log(`✅ ${type}: ${targetPrice.id} ($${(targetPrice.unit_amount / 100).toFixed(2)})`);
    }
    
    console.log('\n🎉 Price IDs fetched successfully!\n');
    
    // Display configuration
    console.log('📋 Configuration to update in your code:');
    console.log('const STRIPE_PRODUCTS = {');
    
    Object.entries(results).forEach(([type, data]) => {
      console.log(`  ${type}: {`);
      console.log(`    productId: '${data.productId}',`);
      console.log(`    priceId: '${data.priceId}',`);
      console.log(`    name: 'Tim Burton Docuseries - ${type.charAt(0).toUpperCase() + type.slice(1)}',`);
      console.log(`    description: '${type === 'rental' ? '4-day access to all 4 episodes' : type === 'regular' ? 'Permanent access to 4 episodes' : '4 episodes + 40 hours of bonus content'}',`);
      console.log(`    duration: ${type === 'rental' ? '4' : 'null'},`);
      console.log(`  },`);
    });
    
    console.log('};');
    
    console.log('\n🔧 Next steps:');
    console.log('1. Copy the configuration above');
    console.log('2. Update src/backend/functions/src/stripe.ts');
    console.log('3. Deploy your functions');
    console.log('4. Test the checkout flow\n');
    
    return {
      success: true,
      products: results
    };
    
  } catch (error) {
    console.error('❌ Error fetching Price IDs:', error);
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
  
  getPriceIds()
    .then(result => {
      if (result.success) {
        console.log('✅ Price IDs fetched successfully!');
        process.exit(0);
      } else {
        console.error('❌ Failed to fetch Price IDs:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { getPriceIds };


