import express from 'express';
import {
  createStripePaymentIntent,
  createTransaction,
  listTransactions,
} from '../controllers/transactionControllers';

const router = express.Router();

router.route('/').get(listTransactions).post(createTransaction);

router.route('/stripe/payment-intent').post(createStripePaymentIntent);

export default router;
