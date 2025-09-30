# Tim Burton Docuseries Streaming Platform

A modern streaming platform for the Tim Burton docuseries, built with clean, maintainable code and integrated with Firebase, Stripe, Mux, and other services.

## 🏗️ Project Structure

```
prototype/
├── src/
│   ├── js/
│   │   ├── client-config.js     # Safe client configuration
│   │   └── client-app.js        # Safe client application
│   ├── html/
│   │   └── index.html           # HTML reference for Webflow
│   └── backend/                 # Backend API (Firebase Functions)
│       ├── functions/
│       │   ├── src/
│       │   │   ├── auth.js      # Authentication endpoints
│       │   │   ├── payments.js  # Payment processing
│       │   │   ├── content.js   # Video content management
│       │   │   └── users.js     # User management
│       │   └── package.json     # Backend dependencies
│       └── firebase.json        # Firebase configuration
├── public/
│   ├── images/                  # Image assets
│   └── icons/                   # Icon assets
├── docs/
│   ├── setup/                   # Setup documentation
│   ├── api/                     # API documentation
│   └── testing/                 # Testing documentation
├── PROJECT_SPEC.md              # Project specification
├── BUILD_PLAN.md                # Development plan
├── backend-api-structure.md     # Backend architecture
├── package.json                 # Dependencies
└── README.md                    # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (for package management)
- Firebase CLI (`npm install -g firebase-tools`)
- Python (for local development server)
- Modern web browser

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   This will start a local server at `http://localhost:8000`

3. **Open in browser:**
   Navigate to `http://localhost:8000/src/html/index.html`

## 🔧 Configuration

### **IMPORTANT: Security Architecture**

This project uses a **secure client-server architecture**:

- **Frontend (Webflow)**: Safe client-side code with NO sensitive data
- **Backend (Firebase Functions)**: Secure API handling all sensitive operations
- **No API keys** are exposed in the client-side code

### 1. Backend Configuration (Firebase Functions)
All sensitive configuration is handled server-side:

```bash
# Environment variables (backend only)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
STRIPE_SECRET_KEY=sk_live_...
MUX_TOKEN_ID=your-token-id
SENDGRID_API_KEY=SG...
```

### 2. Client Configuration (Webflow)
Only safe, public data in `src/js/client-config.js`:

```javascript
const CLIENT_CONFIG = {
  app: { name: "Tim Burton Docuseries" },
  pricing: { /* public pricing info */ },
  api: { baseUrl: "https://your-api-domain.com/api" }
  // NO sensitive API keys here!
}
```

## 📋 Features

### ✅ Implemented
- **Secure Architecture**: Client-server separation for security
- **Project Structure**: Clean, modular architecture
- **Client-Side Code**: Safe JavaScript for Webflow integration
- **Backend API Structure**: Firebase Functions framework
- **HTML Reference**: Complete Webflow-ready HTML
- **Configuration System**: Secure environment variable management

### 🚧 Next Steps
- **Firebase project setup** and configuration
- **Backend API development** (Firebase Functions)
- **Stripe integration** with webhooks
- **Mux video setup** and signed URLs
- **Service integration** and testing
- **Webflow deployment** with secure client code

## 🛠️ Development

### Code Standards
- **Clean Code**: Readable, maintainable code
- **Modular Architecture**: Separated concerns
- **Error Handling**: Comprehensive error management
- **Documentation**: Well-commented code
- **Responsive Design**: Mobile-first approach

### File Organization
- **Modules**: Separate files for each major feature
- **Configuration**: Centralized config management
- **Assets**: Organized public assets
- **Documentation**: Comprehensive docs for each step

## 📚 Documentation

- **Project Specification**: `PROJECT_SPEC.md`
- **Build Plan**: `BUILD_PLAN.md`
- **Setup Guides**: `docs/setup/`
- **API Documentation**: `docs/api/`
- **Testing Guides**: `docs/testing/`

## 🔒 Security

- **Client-Server Separation**: No sensitive data in frontend
- **Environment Variables**: Secure backend configuration
- **Signed URLs**: Time-limited video access
- **Authentication**: Firebase auth with Google Sign-In
- **Payment Security**: Stripe secure payment processing
- **Regional Blocking**: Cloudflare-based access control
- **GDPR Compliance**: Privacy controls and data export
- **API Security**: CORS protection, rate limiting, input validation

## 🌐 Services Integration

- **Firebase**: Authentication and database
- **Stripe**: Payment processing
- **Mux**: Video streaming
- **SendGrid**: Email notifications
- **Cloudflare**: Regional blocking and security
- **Google Analytics**: Usage tracking

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

This is a private project. Please follow the established code standards and document any changes.

## 📄 License

Private project - All rights reserved.

---

## 🚀 **Next Step**: Firebase Project Setup

Ready to begin with Firebase configuration and backend API development.

**Current Phase**: Service Setup Guidance
