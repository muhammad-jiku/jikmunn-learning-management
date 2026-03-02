import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import CouponInput from '../payment/CouponInput';
import AccordionSections from '../shared/AccordionSections';

interface CoursePreviewExtendedProps extends CoursePreviewProps {
  showCouponInput?: boolean;
  onCouponApplied?: (
    result: {
      couponCode: string;
      discountAmount: number;
      finalAmount: number;
    } | null
  ) => void;
  appliedDiscount?: number;
}

const CoursePreview = ({
  course,
  showCouponInput,
  onCouponApplied,
  appliedDiscount,
}: CoursePreviewExtendedProps) => {
  const price = formatPrice(course.price);
  const finalPrice = appliedDiscount
    ? formatPrice((course.price || 0) - appliedDiscount)
    : price;

  return (
    <div className='course-preview'>
      <div className='course-preview__container'>
        <div className='course-preview__image-wrapper'>
          <Image
            src={course.image || '/placeholder.png'}
            alt='Course Preview'
            width={640}
            height={360}
            className='w-full'
          />
        </div>
        <div>
          <h2 className='course-preview__title'>{course.title}</h2>
          <p className='text-gray-400 text-md mb-4'>by {course.teacherName}</p>
          <p className='text-sm text-customgreys-dirty-grey'>
            {course.description}
          </p>
        </div>

        <div>
          <h4 className='text-white-50/90 font-semibold mb-2'>
            Course Content
          </h4>
          <AccordionSections sections={course.sections} />
        </div>
      </div>

      <div className='course-preview__container'>
        <h3 className='text-xl mb-4'>Price Details (1 item)</h3>
        <div className='flex justify-between mb-4 text-customgreys-dirty-grey text-base'>
          <span className='font-bold'>1x {course.title}</span>
          <span className='font-bold'>{price}</span>
        </div>

        {showCouponInput && onCouponApplied && (
          <div className='mb-4'>
            <CouponInput
              courseId={course.courseId}
              originalAmount={course.price || 0}
              onCouponApplied={onCouponApplied}
            />
          </div>
        )}

        {appliedDiscount && appliedDiscount > 0 ? (
          <>
            <div className='flex justify-between mb-2 text-green-400 text-sm'>
              <span>Coupon Discount</span>
              <span>-{formatPrice(appliedDiscount)}</span>
            </div>
            <div className='flex justify-between border-t border-customgreys-dirty-grey pt-4'>
              <span className='font-bold text-lg'>Total Amount</span>
              <div className='text-right'>
                <span className='font-bold text-lg'>{finalPrice}</span>
                <span className='ml-2 text-sm text-customgreys-dirty-grey line-through'>
                  {price}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className='flex justify-between border-t border-customgreys-dirty-grey pt-4'>
            <span className='font-bold text-lg'>Total Amount</span>
            <span className='font-bold text-lg'>{price}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePreview;
