'use client';

import Header from '@/components/shared/Header';
import Loading from '@/components/shared/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatPrice } from '@/lib/utils';
import {
  useCreateCouponMutation,
  useDeactivateCouponMutation,
  useGetTeacherCouponsQuery,
} from '@/state/api';
import { useUser } from '@clerk/nextjs';
import {
  Calendar,
  Check,
  Copy,
  DollarSign,
  Hash,
  Percent,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const TeacherCouponsPage = () => {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? '';

  const {
    data: coupons,
    isLoading,
    isError,
  } = useGetTeacherCouponsQuery(userId, { skip: !userId });

  const [createCoupon, { isLoading: isCreating }] = useCreateCouponMutation();
  const [deactivateCoupon] = useDeactivateCouponMutation();

  const [showForm, setShowForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(
    'percentage'
  );
  const [discountValue, setDiscountValue] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [minPurchase, setMinPurchase] = useState('');

  if (!isLoaded) return <Loading />;

  const handleCreateCoupon = async () => {
    if (!code || !discountValue || !validFrom || !validUntil) {
      toast.error('Please fill in all required fields');
      return;
    }

    const numValue = parseFloat(discountValue);
    if (isNaN(numValue) || numValue <= 0) {
      toast.error('Discount value must be a positive number');
      return;
    }

    if (discountType === 'percentage' && numValue > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    try {
      await createCoupon({
        code,
        discountType,
        discountValue: numValue,
        validFrom,
        validUntil,
        usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
        minPurchase: minPurchase
          ? Math.round(parseFloat(minPurchase) * 100)
          : 0,
        createdBy: userId,
      }).unwrap();

      // Reset form
      setCode('');
      setDiscountValue('');
      setValidFrom('');
      setValidUntil('');
      setUsageLimit('');
      setMinPurchase('');
      setShowForm(false);
    } catch {
      // Error toast handled by RTK query middleware
    }
  };

  const handleDeactivate = async (couponId: string) => {
    try {
      await deactivateCoupon(couponId).unwrap();
    } catch {
      // Error toast handled by RTK query middleware
    }
  };

  const handleCopyCode = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCode(couponCode);
    toast.success(`Copied "${couponCode}" to clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`;
    }
    return formatPrice(coupon.discountValue);
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.isActive) return { label: 'Inactive', color: 'text-gray-400' };
    const now = new Date();
    if (now < new Date(coupon.validFrom))
      return { label: 'Scheduled', color: 'text-blue-400' };
    if (now > new Date(coupon.validUntil))
      return { label: 'Expired', color: 'text-red-400' };
    if (
      coupon.usageLimit !== undefined &&
      coupon.usageLimit !== null &&
      coupon.usedCount >= coupon.usageLimit
    )
      return { label: 'Limit Reached', color: 'text-orange-400' };
    return { label: 'Active', color: 'text-green-400' };
  };

  if (isLoading) return <Loading />;
  if (isError) return <div>Error loading coupons</div>;

  const activeCoupons = coupons?.filter((c) => c.isActive) || [];
  const inactiveCoupons = coupons?.filter((c) => !c.isActive) || [];

  return (
    <div className='coupon-management'>
      <Header
        title='Coupon Management'
        subtitle='Create and manage discount coupons for your courses'
        rightElement={
          <Button
            onClick={() => setShowForm(!showForm)}
            className='bg-primary-700 hover:bg-primary-600'
          >
            <Plus className='mr-2 h-4 w-4' />
            {showForm ? 'Cancel' : 'New Coupon'}
          </Button>
        }
      />

      {/* Create Coupon Form */}
      {showForm && (
        <div className='coupon-management__form'>
          <h3 className='text-lg font-semibold text-white-50 mb-4'>
            Create New Coupon
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Code */}
            <div className='space-y-1'>
              <label className='text-sm text-customgreys-dirty-grey'>
                Coupon Code *
              </label>
              <div className='relative'>
                <Tag className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder='e.g., SUMMER2026'
                  className='pl-10 bg-customgreys-primarybg border-customgreys-dirty-grey text-white-50'
                  maxLength={20}
                />
              </div>
            </div>

            {/* Discount Type */}
            <div className='space-y-1'>
              <label className='text-sm text-customgreys-dirty-grey'>
                Discount Type *
              </label>
              <Select
                value={discountType}
                onValueChange={(val) =>
                  setDiscountType(val as 'percentage' | 'fixed')
                }
              >
                <SelectTrigger className='bg-customgreys-primarybg border-customgreys-dirty-grey text-white-50'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='bg-customgreys-primarybg border-customgreys-dirty-grey'>
                  <SelectItem value='percentage'>Percentage (%)</SelectItem>
                  <SelectItem value='fixed'>Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discount Value */}
            <div className='space-y-1'>
              <label className='text-sm text-customgreys-dirty-grey'>
                Discount Value *
              </label>
              <div className='relative'>
                {discountType === 'percentage' ? (
                  <Percent className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                ) : (
                  <DollarSign className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                )}
                <Input
                  type='number'
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={
                    discountType === 'percentage'
                      ? 'e.g., 20'
                      : 'e.g., 999 (cents)'
                  }
                  className='pl-10 bg-customgreys-primarybg border-customgreys-dirty-grey text-white-50'
                  min='0'
                  max={discountType === 'percentage' ? '100' : undefined}
                />
              </div>
            </div>

            {/* Usage Limit */}
            <div className='space-y-1'>
              <label className='text-sm text-customgreys-dirty-grey'>
                Usage Limit (optional)
              </label>
              <div className='relative'>
                <Hash className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  type='number'
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder='Unlimited'
                  className='pl-10 bg-customgreys-primarybg border-customgreys-dirty-grey text-white-50'
                  min='1'
                />
              </div>
            </div>

            {/* Valid From */}
            <div className='space-y-1'>
              <label className='text-sm text-customgreys-dirty-grey'>
                Valid From *
              </label>
              <div className='relative'>
                <Calendar className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  type='datetime-local'
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className='pl-10 bg-customgreys-primarybg border-customgreys-dirty-grey text-white-50'
                />
              </div>
            </div>

            {/* Valid Until */}
            <div className='space-y-1'>
              <label className='text-sm text-customgreys-dirty-grey'>
                Valid Until *
              </label>
              <div className='relative'>
                <Calendar className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  type='datetime-local'
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className='pl-10 bg-customgreys-primarybg border-customgreys-dirty-grey text-white-50'
                />
              </div>
            </div>

            {/* Min Purchase */}
            <div className='space-y-1'>
              <label className='text-sm text-customgreys-dirty-grey'>
                Min Purchase $ (optional)
              </label>
              <div className='relative'>
                <DollarSign className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  type='number'
                  value={minPurchase}
                  onChange={(e) => setMinPurchase(e.target.value)}
                  placeholder='0.00'
                  className='pl-10 bg-customgreys-primarybg border-customgreys-dirty-grey text-white-50'
                  min='0'
                  step='0.01'
                />
              </div>
            </div>
          </div>

          <div className='mt-4 flex gap-3'>
            <Button
              onClick={handleCreateCoupon}
              disabled={isCreating}
              className='bg-primary-700 hover:bg-primary-600'
            >
              {isCreating ? 'Creating...' : 'Create Coupon'}
            </Button>
            <Button
              variant='outline'
              onClick={() => setShowForm(false)}
              className='border-customgreys-dirty-grey text-white-50 hover:bg-customgreys-secondarybg'
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Active Coupons */}
      <div className='mt-6'>
        <h3 className='text-lg font-semibold text-white-50 mb-3'>
          Active Coupons ({activeCoupons.length})
        </h3>
        {activeCoupons.length === 0 ? (
          <div className='text-customgreys-dirty-grey text-center py-8'>
            No active coupons. Create one to get started!
          </div>
        ) : (
          <div className='grid gap-3'>
            {activeCoupons.map((coupon) => {
              const status = getCouponStatus(coupon);
              return (
                <div key={coupon._id} className='coupon-management__card'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='coupon-management__code-badge'>
                        <span className='font-mono font-bold text-sm'>
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          className='ml-2 text-gray-400 hover:text-white-50 transition-colors'
                          title='Copy code'
                        >
                          {copiedCode === coupon.code ? (
                            <Check className='h-3.5 w-3.5 text-green-400' />
                          ) : (
                            <Copy className='h-3.5 w-3.5' />
                          )}
                        </button>
                      </div>
                      <div>
                        <span className='text-white-50 font-semibold'>
                          {formatDiscount(coupon)} off
                        </span>
                        <span className={`ml-3 text-xs ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleDeactivate(coupon._id)}
                      className='text-red-400 hover:text-red-300 hover:bg-red-400/10'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                  <div className='mt-2 flex flex-wrap gap-4 text-xs text-customgreys-dirty-grey'>
                    <span>
                      Valid: {new Date(coupon.validFrom).toLocaleDateString()} -{' '}
                      {new Date(coupon.validUntil).toLocaleDateString()}
                    </span>
                    <span>
                      Used: {coupon.usedCount}
                      {coupon.usageLimit
                        ? ` / ${coupon.usageLimit}`
                        : ' (unlimited)'}
                    </span>
                    {coupon.minPurchase > 0 && (
                      <span>Min: {formatPrice(coupon.minPurchase)}</span>
                    )}
                    {coupon.courseIds.length > 0 && (
                      <span>Specific courses: {coupon.courseIds.length}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inactive Coupons */}
      {inactiveCoupons.length > 0 && (
        <div className='mt-8'>
          <h3 className='text-lg font-semibold text-customgreys-dirty-grey mb-3'>
            Inactive Coupons ({inactiveCoupons.length})
          </h3>
          <div className='grid gap-3 opacity-60'>
            {inactiveCoupons.map((coupon) => (
              <div key={coupon._id} className='coupon-management__card'>
                <div className='flex items-center gap-3'>
                  <div className='coupon-management__code-badge'>
                    <span className='font-mono font-bold text-sm'>
                      {coupon.code}
                    </span>
                  </div>
                  <span className='text-customgreys-dirty-grey'>
                    {formatDiscount(coupon)} off
                  </span>
                  <span className='text-xs text-gray-500'>Deactivated</span>
                </div>
                <div className='mt-2 text-xs text-gray-500'>
                  Used {coupon.usedCount} times
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherCouponsPage;
