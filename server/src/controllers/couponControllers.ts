import { Request, Response } from 'express';
import logger from '../config/logger';
import Coupon from '../models/couponModel';
import Course from '../models/courseModel';

/**
 * Create a new coupon (teacher only)
 * POST /coupons
 */
export const createCoupon = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    code,
    discountType,
    discountValue,
    validFrom,
    validUntil,
    usageLimit,
    courseIds,
    minPurchase,
    createdBy,
  } = req.body;

  try {
    // Validate percentage doesn't exceed 100
    if (discountType === 'percentage' && discountValue > 100) {
      res.status(400).json({
        message: 'Percentage discount cannot exceed 100%',
      });
      return;
    }

    // Validate dates
    const fromDate = new Date(validFrom);
    const untilDate = new Date(validUntil);

    if (untilDate <= fromDate) {
      res.status(400).json({
        message: 'validUntil must be after validFrom',
      });
      return;
    }

    // Check for duplicate code
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      res.status(409).json({
        message: `Coupon code "${code.toUpperCase()}" already exists`,
      });
      return;
    }

    // If courseIds provided, validate they exist and belong to the teacher
    if (courseIds && courseIds.length > 0) {
      const courses = await Course.find({
        courseId: { $in: courseIds },
        teacherId: createdBy,
      });

      if (courses.length !== courseIds.length) {
        res.status(400).json({
          message: 'One or more courseIds are invalid or do not belong to you',
        });
        return;
      }
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      validFrom: fromDate,
      validUntil: untilDate,
      usageLimit,
      usedCount: 0,
      courseIds: courseIds || [],
      minPurchase: minPurchase || 0,
      createdBy,
      isActive: true,
    });

    await coupon.save();

    logger.info('AUDIT: Coupon created', {
      code: coupon.code,
      createdBy,
      discountType,
      discountValue,
    });

    res.status(201).json({
      message: 'Coupon created successfully',
      data: coupon,
    });
  } catch (error) {
    logger.error('Error creating coupon', { error });
    res.status(500).json({
      message: 'Error creating coupon',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Validate a coupon code
 * GET /coupons/validate/:code
 */
export const validateCoupon = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { code } = req.params as { code: string };
  const { courseId, amount } = req.query;

  try {
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      res.status(404).json({
        message: 'Coupon not found or inactive',
        data: { valid: false, reason: 'not_found' },
      });
      return;
    }

    const now = new Date();

    // Check if coupon has started
    if (now < coupon.validFrom) {
      res.status(400).json({
        message: 'Coupon is not yet active',
        data: { valid: false, reason: 'not_started' },
      });
      return;
    }

    // Check if coupon has expired
    if (now > coupon.validUntil) {
      res.status(400).json({
        message: 'Coupon has expired',
        data: { valid: false, reason: 'expired' },
      });
      return;
    }

    // Check usage limit
    if (
      coupon.usageLimit !== undefined &&
      coupon.usageLimit !== null &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      res.status(400).json({
        message: 'Coupon usage limit reached',
        data: { valid: false, reason: 'usage_limit' },
      });
      return;
    }

    // Check if coupon is valid for this course
    if (
      courseId &&
      coupon.courseIds.length > 0 &&
      !coupon.courseIds.includes(courseId as string)
    ) {
      res.status(400).json({
        message: 'Coupon is not valid for this course',
        data: { valid: false, reason: 'invalid_course' },
      });
      return;
    }

    // Check min purchase
    const purchaseAmount = amount ? Number(amount) : 0;
    if (coupon.minPurchase > 0 && purchaseAmount < coupon.minPurchase) {
      res.status(400).json({
        message: `Minimum purchase of ${coupon.minPurchase} cents required`,
        data: {
          valid: false,
          reason: 'min_purchase',
          minPurchase: coupon.minPurchase,
        },
      });
      return;
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round(
        purchaseAmount * (coupon.discountValue / 100)
      );
    } else {
      // Fixed discount (in cents)
      discountAmount = Math.min(coupon.discountValue, purchaseAmount);
    }

    const finalAmount = Math.max(0, purchaseAmount - discountAmount);

    res.status(200).json({
      message: 'Coupon is valid',
      data: {
        valid: true,
        coupon: {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minPurchase: coupon.minPurchase,
          courseIds: coupon.courseIds,
          validUntil: coupon.validUntil,
        },
        discountAmount,
        finalAmount,
        originalAmount: purchaseAmount,
      },
    });
  } catch (error) {
    logger.error('Error validating coupon', { code, error });
    res.status(500).json({
      message: 'Error validating coupon',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Get teacher's coupons
 * GET /coupons/teacher/:teacherId
 */
export const getTeacherCoupons = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { teacherId } = req.params;

  try {
    const coupons = await Coupon.find({ createdBy: teacherId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: 'Teacher coupons retrieved successfully',
      data: coupons,
    });
  } catch (error) {
    logger.error('Error fetching teacher coupons', { teacherId, error });
    res.status(500).json({
      message: 'Error fetching coupons',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Update a coupon
 * PUT /coupons/:couponId
 */
export const updateCoupon = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { couponId } = req.params;

  try {
    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      res.status(404).json({ message: 'Coupon not found' });
      return;
    }

    // Validate percentage if being updated
    if (
      req.body.discountType === 'percentage' &&
      req.body.discountValue > 100
    ) {
      res.status(400).json({
        message: 'Percentage discount cannot exceed 100%',
      });
      return;
    }

    // Validate dates if being updated
    if (req.body.validFrom && req.body.validUntil) {
      const fromDate = new Date(req.body.validFrom);
      const untilDate = new Date(req.body.validUntil);
      if (untilDate <= fromDate) {
        res.status(400).json({
          message: 'validUntil must be after validFrom',
        });
        return;
      }
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    logger.info('AUDIT: Coupon updated', {
      couponId,
      code: updatedCoupon?.code,
      updatedBy: req.body.updatedBy || 'unknown',
    });

    res.status(200).json({
      message: 'Coupon updated successfully',
      data: updatedCoupon,
    });
  } catch (error) {
    logger.error('Error updating coupon', { couponId, error });
    res.status(500).json({
      message: 'Error updating coupon',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Deactivate a coupon
 * DELETE /coupons/:couponId
 */
export const deactivateCoupon = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { couponId } = req.params;

  try {
    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      { isActive: false },
      { new: true }
    );

    if (!coupon) {
      res.status(404).json({ message: 'Coupon not found' });
      return;
    }

    logger.info('AUDIT: Coupon deactivated', {
      couponId,
      code: coupon.code,
    });

    res.status(200).json({
      message: 'Coupon deactivated successfully',
      data: coupon,
    });
  } catch (error) {
    logger.error('Error deactivating coupon', { couponId, error });
    res.status(500).json({
      message: 'Error deactivating coupon',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Apply coupon to a transaction (increment usedCount atomically)
 * Called internally during transaction creation
 */
export const applyCouponUsage = async (couponCode: string): Promise<void> => {
  await Coupon.findOneAndUpdate(
    { code: couponCode.toUpperCase(), isActive: true },
    { $inc: { usedCount: 1 } }
  );
};
