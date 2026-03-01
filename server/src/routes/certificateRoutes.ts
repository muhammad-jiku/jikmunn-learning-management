import { requireAuth } from '@clerk/express';
import express from 'express';
import {
  downloadCertificate,
  generateCertificate,
  getCertificate,
  getUserCertificates,
  verifyCertificate,
} from '../controllers/certificateControllers';
import {
  certificateIdParam,
  generateCertificateBody,
  userIdParam,
} from '../validators/schemas';
import { validateRequest } from '../validators/validateRequest';

const router = express.Router();

// Generate certificate (authenticated)
router
  .route('/generate')
  .post(
    requireAuth(),
    validateRequest({ body: generateCertificateBody }),
    generateCertificate
  );

// Public verification endpoint (no auth required)
router
  .route('/verify/:certificateId')
  .get(validateRequest({ params: certificateIdParam }), verifyCertificate);

// Get certificate by ID (authenticated)
router
  .route('/:certificateId')
  .get(
    requireAuth(),
    validateRequest({ params: certificateIdParam }),
    getCertificate
  );

// Download certificate PDF (authenticated)
router
  .route('/:certificateId/download')
  .get(
    requireAuth(),
    validateRequest({ params: certificateIdParam }),
    downloadCertificate
  );

// Get all certificates for a user (authenticated)
router
  .route('/users/:userId')
  .get(
    requireAuth(),
    validateRequest({ params: userIdParam }),
    getUserCertificates
  );

export default router;
