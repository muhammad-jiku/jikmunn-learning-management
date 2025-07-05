import express from 'express';
import { updateUser } from '../controllers/userClerkControllers';

const router = express.Router();

router.route('/:userId').put(updateUser);

export default router;
