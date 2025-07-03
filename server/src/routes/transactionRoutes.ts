import express from 'express';
import {
  createTransaction,
  listTransactions,
} from '../controllers/transactionControllers';

const router = express.Router();

router.route('/').get(listTransactions).post(createTransaction);

export default router;
