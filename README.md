# Tim Burton Docuseries Streaming Platform

A production-ready streaming platform for the Tim Burton docuseries, built with clean architecture, Firebase, Stripe, and attribute-based Webflow integration.

## 🎯 Project Overview

**Live URLs:**
- **Webflow Site**: https://timburton-dev.webflow.io/
- **Frontend (Cloudflare Pages)**: https://tim-burton-docuseries.pages.dev/
- **Backend API**: https://us-central1-tim-burton-docuseries.cloudfunctions.net/api

**Tech Stack:**
- **Frontend**: Webflow + Cloudflare Pages
- **Authentication**: Firebase Auth (Google + Email/Password)
- **Backend**: Firebase Cloud Functions (Node.js + TypeScript)
- **Database**: Cloud Firestore
- **Payments**: Stripe
- **Video**: Mux (HLS.js streaming, signed URLs)

---

## 📋 Documentation

### **Integration Guides**
- **[Webflow Integration](WEBFLOW_INTEGRATION.md)** - Complete Webflow setup with attribute-based system
- **[Stripe Guide](STRIPE_GUIDE.md)** - Payment integration and setup
- **[Firebase Guide](FIREBASE_GUIDE.md)** - Firebase setup and security
- **[Cloudflare Deployment](CLOUDFLARE_DEPLOYMENT.md)** - Deployment instructions
- **[Mux Setup Guide](MUX_SETUP_GUIDE.md)** - Video streaming configuration

### **Product Setup**
- **[Stripe Products Setup](STRIPE_PRODUCTS_SETUP.md)** - Stripe product configuration
- **[Project Specification](PROJECT_SPEC.md)** - Full project requirements and features

---

## 🏗️ Architecture

### **Clean, Attribute-Based System**
- ✅ **No ID dependencies** - Uses `data-*` attributes for all interactions
- ✅ **No class selectors** - Classes only for styling
- ✅ **Webflow-friendly** - Easy integration with custom attributes
- ✅ **Maintainable** - Clear, semantic naming conventions

### **Security-First Design**
- ✅ **Client-side auth** - Firebase Auth SDK handles all authentication
- ✅ **Single backend endpoint** - `/auth/session` for token verification
- ✅ **No sensitive data** - All API keys server-side only
- ✅ **Production-ready** - Deployed and tested

### **Authentication Flow**
```
1. User Action (Sign In/Sign Up)
   ↓
2. Firebase Auth SDK (client-side)
   ↓
3. Get ID Token
   ↓
4. Sync with Backend (/auth/session)
   ↓
5. Fetch Purchase Status
   ↓
6. Update UI
```

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+
- Firebase CLI
- Git

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd tim-burton-docuseries/prototype
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase Functions**
   ```bash
   cd src/backend/functions
   npm install
   ```

4. **Configure environment variables**
   ```bash
   # Create .env file in src/backend/functions/
   echo "STRIPE_SECRET_KEY=sk_test_..." > .env
   ```

5. **Deploy Firebase Functions**
   ```bash
   npm run deploy
   ```

6. **Test locally**
   ```bash
   # In project root
   python3 -m http.server 8000
   # Open http://localhost:8000/test-server.html
   ```

---

## 📁 Project Structure

```
prototype/
├── public/                      # 🌐 Production Frontend (Cloudflare Pages)
│   ├── js/                     # Client-side JavaScript
│   │   ├── client-auth.js     # Firebase Auth integration
│   │   ├── webflow-auth-handlers.js
│   │   ├── content-access.js  # Visibility control
│   │   ├── button-state-manager.js
│   │   ├── stripe-integration.js
│   │   ├── video-player.js    # Mux video player
│   │   ├── content-manager.js # Continue watching, progress
│   │   ├── user-profile.js    # Profile management
│   │   └── init-video-player.js # Player initialization
│   ├── css/
│   │   └── tim-burton-styles.css # Critical CSS
│   ├── index.html             # Landing page
│   └── README.md              # Public folder docs
│
├── src/backend/functions/      # 🔥 Firebase Cloud Functions
│   ├── src/                   # TypeScript source
│   │   ├── index.ts          # Main entry point
│   │   ├── auth.ts           # Authentication endpoints
│   │   ├── payments.ts       # Payment processing
│   │   ├── stripe.ts         # Stripe integration
│   │   ├── content.ts        # Content delivery & watch progress
│   │   ├── mux.ts            # Mux video integration
│   │   ├── users.ts          # User management
│   │   ├── validation.ts     # Input validation
│   │   └── logger.ts         # Logging utilities
│   ├── lib/                  # Compiled JavaScript
│   ├── package.json          # Dependencies
│   └── tsconfig.json         # TypeScript config
│
├── 📚 Documentation
│   ├── README.md             # This file (start here!)
│   ├── WEBFLOW_INTEGRATION.md # Complete integration guide
│   ├── MUX_SETUP_GUIDE.md    # Video streaming setup
│   ├── STRIPE_GUIDE.md       # Payment setup
│   ├── FIREBASE_GUIDE.md     # Firebase setup & security
│   ├── CLOUDFLARE_DEPLOYMENT.md # Deployment guide
│   └── PROJECT_SPEC.md       # Full project specification
│
├── ⚙️ Configuration
│   ├── firebase.json         # Firebase config
│   ├── firestore.rules       # Firestore security rules
│   ├── firestore.indexes.json
│   ├── wrangler.toml         # Cloudflare Pages config
│   └── package.json          # Root dependencies
```

**Clean & Organized:**
- ✅ No duplicate code
- ✅ Clear separation: Frontend (`public/`) vs Backend (`src/backend/`)
- ✅ Single source of truth for each module
- ✅ No test files or clutter in production codebase

---

## 💳 Payment System

### **Purchase Options**
- **Rental**: $14.99 - 4-day access to 4 episodes
- **Regular**: $24.99 - Permanent access to 4 episodes
- **Box Set**: $74.99 - 4 episodes + 40 hours of bonus content

### **Features**
- ✅ Secure Stripe Checkout
- ✅ Webhook verification
- ✅ Content access control
- ✅ Purchase history
- ✅ Rental expiration
- ✅ Receipt downloads

---

## 🔐 Authentication

### **Supported Methods**
- ✅ Google Sign-In (OAuth 2.0)
- ✅ Email/Password
- ✅ Password Reset

### **Features**
- ✅ Session persistence
- ✅ Token refresh
- ✅ Secure backend sync
- ✅ Loading states
- ✅ Error handling

---

## 🎬 Content Access Control

### **Visibility Attributes**
```html
<!-- Authentication Required -->
<div data-auth-required="true">Authenticated content</div>

<!-- Purchase Required -->
<div data-purchase-required="true">Paid content</div>

<!-- Box Set Required -->
<div data-boxset-required="true">Box set content</div>

<!-- Show for Non-Authenticated -->
<div data-show-not-signed-in="true">Public content</div>

<!-- Show for Non-Paid Users -->
<div data-show-not-paid="true">Sign up prompt</div>

<!-- Show After Skeleton Load -->
<div data-show-after-load="true">Hero content to reveal after data loads</div>
```

---

## 🔘 Button States

### **Dynamic Button Management**
```html
<!-- Sign In/Out -->
<button data-button-type="sign-in">Sign In</button>
<button data-button-type="sign-out">Sign Out</button>

<!-- Purchase Actions -->
<button data-button-type="rent">Rent Now</button>
<button data-button-type="buy">Buy Now</button>
<button data-button-type="watch-now">Watch Now</button>
```

**Button States:**
- **Not signed in**: Sign In + Rent Now + Buy Now
- **Signed in, not paid**: Sign Out + Rent Now + Buy Now
- **Signed in, paid**: Sign Out + Watch Now (buy/rent hidden)

---

## 🧪 Testing

### **Test Locally**
```bash
# Start local server
python3 -m http.server 8000

# Test pages available:
# - http://localhost:8000/test-server.html
# - http://localhost:8000/public/test.html
```

### **Test on Webflow**
Visit: https://timburton-dev.webflow.io/

### **Stripe Test Cards**
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

---

## 📊 API Endpoints

### **Authentication**
- `POST /auth/session` - Verify ID token and sync user
- (Deprecated endpoints kept for backwards compatibility)

### **Payments**
- `POST /stripe/create-checkout-session` - Create checkout
- `POST /stripe/webhook` - Handle Stripe webhooks
- `GET /payments/status` - Get purchase status

### **Content** (Planned)
- `POST /content/secure-url` - Get signed video URL
- `GET /content/list` - List available content

---

## 🛡️ Security

### **Client-Side (Safe)**
- Firebase Web API Key (restricted)
- Google OAuth Client ID
- Stripe Publishable Key
- Public configuration

### **Server-Side (Secure)**
- Firebase Admin SDK
- Stripe Secret Key
- Mux API Keys
- SendGrid API Key
- Service Account Credentials

---

## 🚀 Deployment

### **Frontend (Cloudflare Pages)**
- Auto-deploys on git push to main
- URL: https://tim-burton-docuseries.pages.dev/

### **Backend (Firebase Functions)**
```bash
cd src/backend/functions
npm run deploy
```

### **Webflow**
- JavaScript hosted on Cloudflare Pages
- Scripts loaded via Project Settings > Custom Code

---

## ✅ Production Status

**All Core Features Deployed:**
- ✅ Authentication System (Google + Email/Password)
- ✅ Session Management & Persistence
- ✅ Content Access Control (Attribute-based)
- ✅ Button State Management (Buy Now/Rent Now/Watch Now)
- ✅ Stripe Integration (Checkout + Webhooks + Duplicate Purchase Prevention)
- ✅ Customer Management (Proper Stripe Customers)
- ✅ Purchase Processing (End-to-end)
- ✅ Attribute-based Interactions
- ✅ Error Handling & Loading States
- ✅ User Profile Management (firstName, lastName, photoURL)
- ✅ Mux Video Streaming (HLS.js, signed URLs, access control)
- ✅ Watch Progress Tracking (Firestore, resume playback, auto-refresh on close)
- ✅ Continue Watching System (Smart episode sequencing, skeleton loading)
- ✅ Full-viewport Video Player (Fullscreen, keyboard shortcuts, Chromecast, iOS auto-fullscreen)
- ✅ Progress Bars (Per-episode progress, auto-update after watching)
- ✅ Hero Section (Dynamic episode display, skeleton loader, visibility control)
- ✅ Clean UX (No upgrade prompts for existing customers, hidden buy buttons)

**Future Enhancements:**
- [ ] Webflow CMS integration for episode content (webhooks)
- [ ] Admin dashboard for content management
- [ ] Analytics integration (Mux Data, Google Analytics)
- [ ] Email notifications (rental expiration, new content)
- [ ] Box set upgrade flow for existing customers

---

## 🎓 Key Features

### **Attribute-Based System**
- **No IDs required** - Use `data-*` attributes
- **No conflicts** - Works with any Webflow setup
- **Reusable** - Same attributes on multiple pages
- **Maintainable** - Clear, semantic naming

### **Clean Architecture**
- **Single source of truth** - Firebase Auth
- **One backend endpoint** - `/auth/session`
- **Unified localStorage** - `timBurtonSession`
- **Proper separation** - Auth → Sync → Purchase → UI

---

## 📝 Contributing

Follow the established patterns:
1. Use data attributes for interactions
2. Keep JavaScript modular and clean
3. Document all new features
4. Test before deploying
5. Update relevant guides

---

## 📄 License

Private project - All rights reserved.

---

## 🆘 Support

Check the documentation:
- [Webflow Integration Guide](WEBFLOW_INTEGRATION.md)
- [Stripe Setup Guide](STRIPE_GUIDE.md)
- [Firebase Configuration Guide](FIREBASE_GUIDE.md)
- [Deployment Guide](CLOUDFLARE_DEPLOYMENT.md)

For issues, check the troubleshooting sections in each guide.
