'use client';

import SignInComponent from '@/components/auth/SignIn';
import SignUpComponent from '@/components/auth/SignUp';
import CoursePreview from '@/components/course/CoursePreview';
import { CustomFormField } from '@/components/custom/CustomFormField';
import Loading from '@/components/shared/Loading';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useCheckoutNavigation } from '@/hooks/useCheckoutNavigation';
import { useCurrentCourse } from '@/hooks/useCurrentCourse';
import { GuestFormData, guestSchema } from '@/lib/schemas';
import { useSignUp, useUser } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

const CheckoutDetailsPage = () => {
  const { course: selectedCourse, isLoading, isError } = useCurrentCourse();
  const searchParams = useSearchParams();
  const showSignUp = searchParams.get('showSignUp') === 'true';
  const { isSignedIn } = useUser();
  const { navigateToStep } = useCheckoutNavigation();
  const { signUp } = useSignUp();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      email: '',
    },
  });

  // If user is already signed in, redirect to payment step
  useEffect(() => {
    if (isSignedIn) {
      navigateToStep(2);
    }
  }, [isSignedIn, navigateToStep]);

  if (isLoading) return <Loading />;
  if (isError) return <div>Failed to fetch course data</div>;
  if (!selectedCourse) return <div>Course not found</div>;

  const handleGuestCheckout = async (data: GuestFormData) => {
    setIsSubmitting(true);
    try {
      // Start sign-up flow with guest email
      if (!signUp) {
        toast.error('Authentication service unavailable');
        return;
      }

      await signUp.create({
        emailAddress: data.email,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      toast.success(
        'Verification code sent! Check your email to complete signup.'
      );

      // Store guest intent in sessionStorage for post-verification redirect
      sessionStorage.setItem(
        'guestCheckout',
        JSON.stringify({
          email: data.email,
          courseId: selectedCourse.courseId,
        })
      );

      // Navigate to sign-up view so user can enter verification code
      const courseId = searchParams.get('id') || selectedCourse.courseId;
      window.location.href = `/checkout?step=1&id=${courseId}&showSignUp=true`;
    } catch (error: unknown) {
      const clerkError = error as {
        errors?: Array<{ code: string; message: string }>;
      };
      if (clerkError.errors?.[0]?.code === 'form_identifier_exists') {
        toast.info('Account already exists. Please sign in instead.');
      } else {
        toast.error(
          clerkError.errors?.[0]?.message || 'Failed to create account'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='checkout-details'>
      <div className='checkout-details__container'>
        <div className='checkout-details__preview'>
          <CoursePreview course={selectedCourse} />
        </div>

        <div className='checkout-details__options'>
          <div className='checkout-details__guest'>
            <h2 className='checkout-details__title'>Guest Checkout</h2>
            <p className='checkout-details__subtitle'>
              Enter email to receive course access details and order
              confirmation. You can set a password after purchase.
            </p>
            <Form {...methods}>
              <form
                onSubmit={methods.handleSubmit(handleGuestCheckout)}
                className='checkout-details__form'
              >
                <CustomFormField
                  name='email'
                  label='Email address'
                  type='email'
                  className='w-full rounded mt-4'
                  labelClassName='font-normal text-white-50'
                  inputClassName='py-3'
                />
                <Button
                  type='submit'
                  className='checkout-details__submit'
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Sending verification...'
                    : 'Continue as Guest'}
                </Button>
              </form>
            </Form>
          </div>

          <div className='checkout-details__divider'>
            <hr className='checkout-details__divider-line' />
            <span className='checkout-details__divider-text'>Or</span>
            <hr className='checkout-details__divider-line' />
          </div>

          <div className='checkout-details__auth'>
            {showSignUp ? <SignUpComponent /> : <SignInComponent />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutDetailsPage;
