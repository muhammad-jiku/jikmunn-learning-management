import express from 'express';
import {
  createStripePaymentIntent,
  createTransaction,
  listTransactions,
} from '../controllers/transactionControllers';
import {
  createTransactionBody,
  listTransactionsQuery,
  stripePaymentIntentBody,
} from '../validators/schemas';
import { validateRequest } from '../validators/validateRequest';

const router = express.Router();

router
  .route('/')
  .get(validateRequest({ query: listTransactionsQuery }), listTransactions)
  .post(validateRequest({ body: createTransactionBody }), createTransaction);

router
  .route('/stripe/payment-intent')
  .post(
    validateRequest({ body: stripePaymentIntentBody }),
    createStripePaymentIntent
  );

export default router;
