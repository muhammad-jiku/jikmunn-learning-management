'use client';

import Loading from '@/components/shared/Loading';
import { useVerifyCertificateQuery } from '@/state/api';
import { format } from 'date-fns';
import { Award, CheckCircle, XCircle } from 'lucide-react';
import { useParams } from 'next/navigation';

const VerifyCertificatePage = () => {
  const { certificateId } = useParams();

  const { data, isLoading, isError } = useVerifyCertificateQuery(
    (certificateId as string) ?? '',
    {
      skip: !certificateId,
    }
  );

  if (isLoading) return <Loading />;

  if (isError || !data?.valid) {
    return (
      <div className='certificate-verify flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4'>
        <div className='rounded-full bg-red-500/10 p-6'>
          <XCircle className='h-16 w-16 text-red-500' />
        </div>
        <h1 className='text-2xl font-bold text-white-100'>
          Certificate Not Found
        </h1>
        <p className='max-w-md text-center text-customgreys-dirtyGrey'>
          This certificate could not be verified. It may be invalid or no longer
          exists.
        </p>
      </div>
    );
  }

  const cert = data.data!;

  return (
    <div className='certificate-verify flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-10'>
      <div className='rounded-full bg-green-500/10 p-6'>
        <CheckCircle className='h-16 w-16 text-green-500' />
      </div>

      <h1 className='text-2xl font-bold text-white-100'>
        Certificate Verified
      </h1>

      <div className='w-full max-w-lg rounded-xl border border-customgreys-dirtyGrey/30 bg-customgreys-secondarybg p-8'>
        <div className='flex flex-col items-center gap-4'>
          <Award className='h-12 w-12 text-primary-700' />

          <div className='text-center'>
            <p className='text-sm text-customgreys-dirtyGrey'>
              This certifies that
            </p>
            <h2 className='mt-1 text-2xl font-bold text-white-100'>
              {cert.userName}
            </h2>
          </div>

          <div className='text-center'>
            <p className='text-sm text-customgreys-dirtyGrey'>
              has successfully completed
            </p>
            <h3 className='mt-1 text-xl font-semibold text-primary-700'>
              {cert.courseName}
            </h3>
          </div>

          <div className='text-center'>
            <p className='text-sm text-customgreys-dirtyGrey'>Issued on</p>
            <p className='font-medium text-white-100'>
              {format(new Date(cert.issuedAt), 'MMMM d, yyyy')}
            </p>
          </div>

          <div className='mt-2 w-full border-t border-customgreys-dirtyGrey/30 pt-4'>
            <p className='text-center text-xs text-customgreys-dirtyGrey'>
              Certificate ID: {cert.certificateId}
            </p>
            <p className='mt-1 text-center text-xs text-customgreys-dirtyGrey'>
              Issued by Learn Now - Learning Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificatePage;
