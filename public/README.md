# Tim Burton Docuseries - Frontend

This directory contains the frontend files for the Tim Burton Docuseries streaming platform, ready for deployment to Cloudflare Pages.

## 🚀 Quick Start

1. **Test Locally:**
   ```bash
   python3 -m http.server 8000
   ```
   Then visit: `http://localhost:8000/test.html`

2. **Deploy to Cloudflare Pages:**
   - Connect your GitHub repository to Cloudflare Pages
   - Set build output directory to `public`
   - Deploy!

## 📁 File Structure

```
public/
├── index.html          # Landing page
├── test.html           # Complete test environment
├── js/                 # JavaScript files
│   ├── client-auth.js              # Core authentication system
│   ├── webflow-auth-handlers.js    # Webflow integration handlers
│   ├── content-access.js           # Content visibility control
│   ├── button-state-manager.js     # Interactive button states
│   ├── stripe-integration.js       # Payment processing
│   ├── account-page.js             # Account page with auth protection
│   ├── episodes-page.js            # Episodes page with auth protection
│   ├── password-reset-page.js      # Password reset page
│   ├── user-profile.js             # User profile management
│   ├── video-player.js             # Video player integration
│   ├── content-manager.js          # Content catalog management
│   └── init-video-player.js        # Video player initialization
└── package.json        # Project configuration
```

## 🧪 Testing

Visit `/test.html` to test:
- ✅ Authentication (Google Sign-In + Email/Password)
- ✅ Stripe Payment Integration
- ✅ Purchase Options Modal
- ✅ Content Access Control
- ✅ Session Persistence
- ✅ Loading Spinners
- ✅ Automatic Flow Continuation

## 🔧 Integration with Webflow

Add these scripts to your Webflow project:

```html
<script src="https://accounts.google.com/gsi/client"></script>
<script src="https://your-domain.pages.dev/js/client-auth.js"></script>
<script src="https://your-domain.pages.dev/js/webflow-auth-handlers.js"></script>
<script src="https://your-domain.pages.dev/js/content-access.js"></script>
<script src="https://your-domain.pages.dev/js/button-state-manager.js"></script>
<script src="https://your-domain.pages.dev/js/stripe-integration.js"></script>
```

## 🌐 Environment Variables

Set these in Cloudflare Pages:

- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_API_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_API_BASE_URL`

## 📊 Features

- **Authentication**: Google Sign-In + Email/Password
- **Payments**: Stripe integration with checkout sessions
- **Content Control**: Dynamic content visibility based on auth/purchase status
- **UI Management**: Dynamic button states and modals
- **Session Management**: Persistent login across page refreshes
- **Loading States**: Visual feedback during async operations
- **Responsive Design**: Works on all devices

## 🚀 Ready for Production!

This frontend is production-ready and can be deployed to Cloudflare Pages for global CDN distribution.
