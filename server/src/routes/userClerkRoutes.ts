import express from 'express';
import { updateUser } from '../controllers/userClerkControllers';
import { updateUserBody, userIdParam } from '../validators/schemas';
import { validateRequest } from '../validators/validateRequest';

const router = express.Router();

router
  .route('/:userId')
  .put(
    validateRequest({ params: userIdParam, body: updateUserBody }),
    updateUser
  );

export default router;
