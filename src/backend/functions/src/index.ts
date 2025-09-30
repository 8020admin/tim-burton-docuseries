import * as admin from 'firebase-admin';
import * as cors from 'cors';
import * as express from 'express';

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  })
});

const app = express();
app.use(cors({origin: true}));

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
