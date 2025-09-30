/**
 * Configuration file for Tim Burton Docuseries Platform
 * All service configurations and environment variables
 */

const CONFIG = {
  // Firebase Configuration
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
    projectId: "YOUR_FIREBASE_PROJECT_ID",
    storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
    appId: "YOUR_FIREBASE_APP_ID"
  },

  // Stripe Configuration
  stripe: {
    publishableKey: "YOUR_STRIPE_PUBLISHABLE_KEY",
    priceIds: {
      rental: "price_rental_4_days",
      regular: "price_regular_purchase", 
      boxSet: "price_box_set_purchase"
    }
  },

  // Mux Configuration
  mux: {
    playerToken: "YOUR_MUX_PLAYER_TOKEN",
    environmentKey: "YOUR_MUX_ENVIRONMENT_KEY"
  },

  // SendGrid Configuration
  sendgrid: {
    apiKey: "YOUR_SENDGRID_API_KEY",
    fromEmail: "noreply@timburtondocuseries.com"
  },

  // Cloudflare Configuration
  cloudflare: {
    zoneId: "YOUR_CLOUDFLARE_ZONE_ID",
    apiToken: "YOUR_CLOUDFLARE_API_TOKEN"
  },

  // Google Analytics
  googleAnalytics: {
    measurementId: "G-XXXXXXXXXX"
  },

  // App Configuration
  app: {
    name: "Tim Burton Docuseries",
    version: "1.0.0",
    environment: "development", // development, staging, production
    debug: true
  },

  // Content Configuration
  content: {
    episodes: [
      { id: "episode-1", title: "Episode 1", duration: "45:00" },
      { id: "episode-2", title: "Episode 2", duration: "45:00" },
      { id: "episode-3", title: "Episode 3", duration: "45:00" },
      { id: "episode-4", title: "Episode 4", duration: "45:00" }
    ],
    extras: [
      { id: "extra-1", title: "Behind the Scenes", duration: "30:00" },
      { id: "extra-2", title: "Director Commentary", duration: "45:00" }
      // Add more extras as needed
    ]
  },

  // Pricing Configuration
  pricing: {
    rental: {
      price: 14.99,
      currency: "USD",
      duration: 4, // days
      description: "4-day rental access to all episodes"
    },
    regular: {
      price: 24.99,
      currency: "USD", 
      description: "Permanent access to all 4 episodes"
    },
    boxSet: {
      price: 74.99,
      currency: "USD",
      description: "All 4 episodes + 40 hours of extras"
    }
  },

  // Regional Configuration
  regions: {
    blocked: ["LATAM"], // Initially blocked regions
    allowed: ["US", "CA", "UK", "AU", "DE", "FR", "ES", "IT", "NL", "SE", "NO", "DK", "FI"]
  },

  // API Endpoints
  api: {
    baseUrl: "https://your-api-domain.com/api",
    endpoints: {
      auth: "/auth",
      payments: "/payments", 
      content: "/content",
      users: "/users"
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}
