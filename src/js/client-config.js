/**
 * Client-Side Configuration
 * ONLY public/safe configuration data for Webflow
 * NO sensitive API keys or secrets
 */

const CLIENT_CONFIG = {
  // App Configuration (safe to expose)
  app: {
    name: "Tim Burton Docuseries",
    version: "1.0.0",
    environment: "production",
    debug: false
  },

  // Content Configuration (safe to expose)
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
    ]
  },

  // Pricing Configuration (safe to expose)
  pricing: {
    rental: {
      price: 14.99,
      currency: "USD",
      duration: 4,
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

  // Regional Configuration (safe to expose)
  regions: {
    blocked: ["LATAM"],
    allowed: ["US", "CA", "UK", "AU", "DE", "FR", "ES", "IT", "NL", "SE", "NO", "DK", "FI"]
  },

  // API Endpoints (safe to expose)
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
  module.exports = CLIENT_CONFIG;
} else {
  window.CLIENT_CONFIG = CLIENT_CONFIG;
}
