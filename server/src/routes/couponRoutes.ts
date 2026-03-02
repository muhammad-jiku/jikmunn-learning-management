import { requireAuth } from '@clerk/express';
import express from 'express';
import {
  createCoupon,
  deactivateCoupon,
  getTeacherCoupons,
  updateCoupon,
  validateCoupon,
} from '../controllers/couponControllers';
import {
  couponIdParam,
  createCouponBody,
  teacherIdParam,
  updateCouponBody,
  validateCouponParams,
  validateCouponQuery,
} from '../validators/schemas';
import { validateRequest } from '../validators/validateRequest';

const router = express.Router();

// Public: validate a coupon code
router.route('/validate/:code').get(
  validateRequest({
    params: validateCouponParams,
    query: validateCouponQuery,
  }),
  validateCoupon
);

// Authenticated routes
router
  .route('/')
  .post(
    requireAuth(),
    validateRequest({ body: createCouponBody }),
    createCoupon
  );

router
  .route('/teacher/:teacherId')
  .get(
    requireAuth(),
    validateRequest({ params: teacherIdParam }),
    getTeacherCoupons
  );

router
  .route('/:couponId')
  .put(
    requireAuth(),
    validateRequest({ params: couponIdParam, body: updateCouponBody }),
    updateCoupon
  )
  .delete(
    requireAuth(),
    validateRequest({ params: couponIdParam }),
    deactivateCoupon
  );

export default router;
