/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  clerkMiddleware,
  createClerkClient,
  requireAuth,
} from '@clerk/express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/database';
import logger from './config/logger';
import courseRoutes from './routes/courseRoutes';
import reviewRoutes from './routes/reviewRoutes';
import transactionRoutes from './routes/transactionRoutes';
import userClerkRoutes from './routes/userClerkRoutes';
import userCourseProgressRoutes from './routes/userCourseProgressRoutes';

/* CONFIGURATIONS */
dotenv.config();

// Connect to MongoDB
connectDB();

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = isProduction
  ? [process.env.CLIENT_URL || 'https://learn-now.vercel.app']
  : ['http://localhost:3000', 'http://localhost:3001'];

const app = express();
app.use(express.json());

/* SECURITY MIDDLEWARE */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: [
          "'self'",
          'data:',
          'https://res.cloudinary.com',
          'https://img.clerk.com',
        ],
        connectSrc: [
          "'self'",
          ...allowedOrigins,
          'https://api.clerk.com',
          'https://api.stripe.com',
        ],
        frameSrc: [
          "'self'",
          'https://www.youtube.com',
          'https://js.stripe.com',
        ],
        mediaSrc: ["'self'", 'https://www.youtube.com'],
      },
    },
  })
);
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000, // stricter in production
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 20 : 200, // stricter for auth-related routes
  message: {
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(apiLimiter);

// NoSQL injection sanitization
app.use(mongoSanitize());

app.use(
  morgan('combined', {
    stream: { write: (message: string) => logger.http(message.trim()) },
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(clerkMiddleware());

/* ROUTES */
app.get('/', (req, res) => {
  res.send('Hola Amigos! Welcome to Jikmunn Learning Management System API!');
});

app.get('/health', (req, res) => {
  res
    .status(200)
    .json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/courses', courseRoutes);
app.use('/reviews', reviewRoutes);
app.use('/users/clerk', authLimiter, requireAuth(), userClerkRoutes);
app.use('/transactions', authLimiter, requireAuth(), transactionRoutes);
app.use('/users/course-progress', requireAuth(), userCourseProgressRoutes);

/* ERROR HANDLING MIDDLEWARE */
app.use((error: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error', {
    error: error?.message || error,
    stack: error?.stack,
  });
  res.status(500).json({
    message: 'Internal server error',
    error: isProduction ? undefined : error.message,
  });
});

/* SERVER */
const port = process.env.PORT || 3001;

// For local development
if (!isProduction) {
  app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
  });
}

// Export for Vercel Serverless
export default app;
