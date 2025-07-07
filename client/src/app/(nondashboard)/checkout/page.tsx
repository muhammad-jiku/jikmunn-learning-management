'use client';

import Loading from '@/components/shared/Loading';
import WizardStepper from '@/components/shared/WizardStepper';
import { useCheckoutNavigation } from '@/hooks/useCheckoutNavigation';
import { useUser } from '@clerk/nextjs';
import CompletionPage from './completion';
import CheckoutDetailsPage from './details';
import PaymentPage from './payment';

const CheckoutWizard = () => {
  const { isLoaded } = useUser();
  const { checkoutStep } = useCheckoutNavigation();

  if (!isLoaded) return <Loading />;

  const renderStep = () => {
    switch (checkoutStep) {
      case 1:
        return <CheckoutDetailsPage />;
      case 2:
        return <PaymentPage />;
      case 3:
        return <CompletionPage />;
      default:
        return <CheckoutDetailsPage />;
    }
  };

  return (
    <div className='checkout'>
      <WizardStepper currentStep={checkoutStep} />
      <div className='checkout__content'>{renderStep()}</div>
    </div>
  );
};

export default CheckoutWizard;
