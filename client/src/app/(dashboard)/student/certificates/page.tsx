'use client';

import CertificateCard from '@/components/certificate/CertificateCard';
import Header from '@/components/shared/Header';
import Loading from '@/components/shared/Loading';
import { useGetUserCertificatesQuery } from '@/state/api';
import { useUser } from '@clerk/nextjs';
import { Award } from 'lucide-react';

const CertificatesPage = () => {
  const { user, isLoaded } = useUser();

  const {
    data: certificates,
    isLoading,
    isError,
  } = useGetUserCertificatesQuery(user?.id ?? '', {
    skip: !isLoaded || !user,
  });

  if (!isLoaded || isLoading) return <Loading />;
  if (!user) return <div>Please sign in to view your certificates.</div>;
  if (isError)
    return <div className='text-red-500'>Error loading certificates.</div>;

  return (
    <div className='certificates-page w-full'>
      <Header
        title='My Certificates'
        subtitle='View and download your course completion certificates'
      />

      {!certificates || certificates.length === 0 ? (
        <div className='certificates-page__empty mt-10 flex flex-col items-center justify-center gap-4'>
          <div className='rounded-full bg-customgreys-secondarybg p-6'>
            <Award className='h-16 w-16 text-customgreys-dirtyGrey' />
          </div>
          <h3 className='text-lg font-semibold text-white-100'>
            No certificates yet
          </h3>
          <p className='max-w-md text-center text-sm text-customgreys-dirtyGrey'>
            Complete your enrolled courses to earn certificates. Certificates
            are automatically generated when you reach 100% progress.
          </p>
        </div>
      ) : (
        <div className='certificates-page__grid mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {certificates.map((cert) => (
            <CertificateCard key={cert.certificateId} certificate={cert} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificatesPage;
