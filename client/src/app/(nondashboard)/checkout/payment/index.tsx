/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import CoursePreview from '@/components/course/CoursePreview';
import StripeProvider from '@/components/payment/StripeProvider';
import { Button } from '@/components/ui/button';
import { useCheckoutNavigation } from '@/hooks/useCheckoutNavigation';
import { useCurrentCourse } from '@/hooks/useCurrentCourse';
import { useCreateTransactionMutation } from '@/state/api';
import { useClerk, useUser } from '@clerk/nextjs';
import {
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { CreditCard } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { toast } from 'sonner';

const PaymentPageContent = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [createTransaction] = useCreateTransactionMutation();
  const { navigateToStep } = useCheckoutNavigation();
  const { course, courseId } = useCurrentCourse();
  const { user } = useUser();
  const { signOut } = useClerk();

  const [couponData, setCouponData] = useState<{
    couponCode: string;
    discountAmount: number;
    finalAmount: number;
  } | null>(null);

  const handleCouponApplied = useCallback(
    (
      result: {
        couponCode: string;
        discountAmount: number;
        finalAmount: number;
      } | null
    ) => {
      setCouponData(result);
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error('Stripe service is not available');
      return;
    }

    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    if (!course) {
      toast.error('Course information not available');
      return;
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_STRIPE_REDIRECT_URL ||
      process.env.NEXT_PUBLIC_AMPLIFY_URL ||
      process.env.NEXT_PUBLIC_VERCEL_URL ||
      process.env.NEXT_PUBLIC_LOCAL_URL;

    if (!baseUrl) {
      toast.error('Payment configuration error');
      return;
    }

    const cleanBaseUrl = baseUrl.replace(/(https?:\/\/)+/, 'https://');

    const returnUrl = `${cleanBaseUrl}/checkout?step=3&id=${courseId}`;

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        toast.error(`Payment failed: ${result.error.message}`);
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        const finalAmount = couponData
          ? couponData.finalAmount
          : course.price || 0;

        const transactionData: any = {
          transactionId: result.paymentIntent.id,
          userId: user.id,
          courseId: courseId,
          paymentProvider: 'stripe' as const,
          amount: finalAmount,
          dateTime: new Date().toISOString(),
        };

        if (couponData?.couponCode) {
          transactionData.couponCode = couponData.couponCode;
        }

        try {
          await createTransaction(transactionData).unwrap();
          toast.success('Payment successful! Course enrolled.');
          navigateToStep(3);
        } catch (transactionError: any) {
          console.error('Transaction creation failed:', transactionError);
          const errorMessage =
            transactionError?.data?.message || 'Enrollment failed';
          toast.error(
            `Payment successful but ${errorMessage}. Contact support.`
          );
          navigateToStep(3);
        }
      } else {
        toast.error('Payment not completed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment processing failed');
    }
  };

  const handleSignOutAndNavigate = async () => {
    await signOut();
    navigateToStep(1);
  };

  if (!course) return null;

  return (
    <div className='payment'>
      <div className='payment__container'>
        <div className='payment__preview'>
          <CoursePreview
            course={course}
            showCouponInput
            onCouponApplied={handleCouponApplied}
            appliedDiscount={couponData?.discountAmount}
          />
        </div>

        <div className='payment__form-container'>
          <form
            id='payment-form'
            onSubmit={handleSubmit}
            className='payment__form'
          >
            <div className='payment__content'>
              <h1 className='payment__title'>Checkout</h1>
              <p className='payment__subtitle'>
                Fill out the payment details below to complete your purchase.
              </p>

              <div className='payment__method'>
                <h3 className='payment__method-title'>Payment Method</h3>

                <div className='payment__card-container'>
                  <div className='payment__card-header'>
                    <CreditCard size={24} />
                    <span>Credit/Debit Card</span>
                  </div>
                  <div className='payment__card-element'>
                    <PaymentElement />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className='payment__actions'>
        <Button
          className='bg-white text-customgreys-dark-grey hover:bg-customgreys-dark-grey hover:text-white border-white-50 hover:border-customgreys-dark-grey'
          onClick={handleSignOutAndNavigate}
          variant='outline'
          type='button'
        >
          Switch Account
        </Button>

        <Button
          form='payment-form'
          type='submit'
          className='payment__submit'
          disabled={!stripe || !elements}
        >
          Pay with Credit Card
        </Button>
      </div>
    </div>
  );
};

const PaymentPage = () => (
  <StripeProvider>
    <PaymentPageContent />
  </StripeProvider>
);

export default PaymentPage;
