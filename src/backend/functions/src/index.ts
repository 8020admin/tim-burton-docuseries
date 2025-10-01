import * as admin from 'firebase-admin';
import * as cors from 'cors';
import * as express from 'express';

// Initialize Firebase Admin with default credentials
// When deployed to Firebase, it will automatically use the correct credentials
admin.initializeApp();

const app = express();

// Configure CORS to allow Cloudflare Pages and Webflow domains
const allowedOrigins = [
  'https://tim-burton-docuseries.pages.dev',
  'https://tim-burton-docuseries-26d403.webflow.io',
  'http://localhost:8000', // For local testing
  'http://localhost:8001'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Import route handlers
import { authRoutes } from './auth';
import { paymentRoutes } from './payments';
import { contentRoutes } from './content';
import { userRoutes } from './users';

// Mount routes
app.use('/auth', authRoutes);
app.use('/payments', paymentRoutes);
app.use('/content', contentRoutes);
app.use('/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export the Express app as a Firebase Function
export const api = require('firebase-functions').https.onRequest(app);
