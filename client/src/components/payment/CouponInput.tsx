'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { useLazyValidateCouponQuery } from '@/state/api';
import { Check, Loader2, Tag, X } from 'lucide-react';
import { useState } from 'react';

interface CouponInputProps {
  courseId: string;
  originalAmount: number;
  onCouponApplied: (
    result: {
      couponCode: string;
      discountAmount: number;
      finalAmount: number;
    } | null
  ) => void;
}

const CouponInput = ({
  courseId,
  originalAmount,
  onCouponApplied,
}: CouponInputProps) => {
  const [code, setCode] = useState('');
  const [triggerValidate, { isFetching }] = useLazyValidateCouponQuery();
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    finalAmount: number;
    discountDisplay: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!code.trim()) return;
    setError(null);

    try {
      const result = await triggerValidate({
        code: code.trim(),
        courseId,
        amount: originalAmount,
      }).unwrap();

      if (result.valid && result.discountAmount !== undefined) {
        const couponData = {
          code: result.coupon?.code || code.toUpperCase(),
          discountAmount: result.discountAmount,
          finalAmount: result.finalAmount || 0,
          discountDisplay:
            result.coupon?.discountType === 'percentage'
              ? `${result.coupon.discountValue}%`
              : formatPrice(result.coupon?.discountValue || 0),
        };
        setAppliedCoupon(couponData);
        onCouponApplied({
          couponCode: couponData.code,
          discountAmount: couponData.discountAmount,
          finalAmount: couponData.finalAmount,
        });
      } else {
        setError(getErrorMessage(result.reason));
      }
    } catch {
      setError('Invalid or expired coupon code');
    }
  };

  const handleRemove = () => {
    setAppliedCoupon(null);
    setCode('');
    setError(null);
    onCouponApplied(null);
  };

  const getErrorMessage = (reason?: string): string => {
    switch (reason) {
      case 'not_found':
        return 'Coupon code not found';
      case 'expired':
        return 'This coupon has expired';
      case 'not_started':
        return 'This coupon is not yet active';
      case 'usage_limit':
        return 'This coupon has reached its usage limit';
      case 'invalid_course':
        return 'This coupon is not valid for this course';
      case 'min_purchase':
        return 'Purchase amount does not meet the minimum requirement';
      default:
        return 'Invalid coupon code';
    }
  };

  if (appliedCoupon) {
    return (
      <div className='coupon-input__applied'>
        <div className='flex items-center gap-2'>
          <Check className='h-4 w-4 text-green-400' />
          <span className='font-mono font-semibold text-green-400'>
            {appliedCoupon.code}
          </span>
          <span className='text-sm text-customgreys-dirty-grey'>
            ({appliedCoupon.discountDisplay} off)
          </span>
        </div>
        <div className='flex items-center gap-3'>
          <span className='text-sm text-green-400'>
            -{formatPrice(appliedCoupon.discountAmount)}
          </span>
          <button
            onClick={handleRemove}
            className='text-gray-400 hover:text-red-400 transition-colors'
            title='Remove coupon'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='coupon-input'>
      <div className='coupon-input__row'>
        <div className='relative flex-1'>
          <Tag className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (error) setError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            placeholder='Enter coupon code'
            className='pl-10 bg-customgreys-primarybg border-customgreys-dirty-grey text-white-50 text-sm'
            maxLength={20}
          />
        </div>
        <Button
          onClick={handleApply}
          disabled={!code.trim() || isFetching}
          variant='outline'
          size='sm'
          className='border-primary-700 text-primary-500 hover:bg-primary-700/20'
        >
          {isFetching ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Apply'}
        </Button>
      </div>
      {error && <p className='text-xs text-red-400 mt-1'>{error}</p>}
    </div>
  );
};

export default CouponInput;
