'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Award, Download, ExternalLink, Share2 } from 'lucide-react';

interface CertificateCardProps {
  certificate: Certificate;
}

const CertificateCard = ({ certificate }: CertificateCardProps) => {
  const handleDownload = () => {
    window.open(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/certificates/${certificate.certificateId}/download`,
      '_blank'
    );
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(certificate.verificationUrl);
    const title = encodeURIComponent(
      `I completed "${certificate.courseName}" on Learn Now!`
    );
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`,
      '_blank'
    );
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `🎓 I completed "${certificate.courseName}" on Learn Now!`
    );
    const url = encodeURIComponent(certificate.verificationUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank'
    );
  };

  const handleVerify = () => {
    window.open(certificate.verificationUrl, '_blank');
  };

  return (
    <Card className='certificate-card group overflow-hidden border-customgreys-dirtyGrey/30 bg-customgreys-secondarybg transition-all hover:border-primary-700/50'>
      <CardContent className='p-0'>
        {/* Certificate Preview Header */}
        <div className='certificate-card__header relative flex flex-col items-center justify-center bg-gradient-to-br from-customgreys-primarybg to-customgreys-secondarybg p-6'>
          <div className='rounded-full bg-primary-700/20 p-3'>
            <Award className='h-10 w-10 text-primary-700' />
          </div>
          <h3 className='mt-3 text-center text-lg font-bold text-white-100'>
            {certificate.courseName}
          </h3>
          <p className='mt-1 text-sm text-customgreys-dirtyGrey'>
            Issued to {certificate.userName}
          </p>
          <p className='text-xs text-customgreys-dirtyGrey'>
            {format(new Date(certificate.issuedAt), 'MMMM d, yyyy')}
          </p>
        </div>

        {/* Actions */}
        <div className='flex flex-col gap-2 p-4'>
          <Button
            onClick={handleDownload}
            className='w-full gap-2 bg-primary-700 hover:bg-primary-600'
            size='sm'
          >
            <Download className='h-4 w-4' />
            Download PDF
          </Button>

          <div className='flex gap-2'>
            <Button
              onClick={handleVerify}
              variant='outline'
              className='flex-1 gap-1 border-customgreys-dirtyGrey text-xs text-white-100 hover:bg-customgreys-primarybg'
              size='sm'
            >
              <ExternalLink className='h-3 w-3' />
              Verify
            </Button>
            <Button
              onClick={handleShareLinkedIn}
              variant='outline'
              className='flex-1 gap-1 border-customgreys-dirtyGrey text-xs text-white-100 hover:bg-customgreys-primarybg'
              size='sm'
            >
              <Share2 className='h-3 w-3' />
              LinkedIn
            </Button>
            <Button
              onClick={handleShareTwitter}
              variant='outline'
              className='flex-1 gap-1 border-customgreys-dirtyGrey text-xs text-white-100 hover:bg-customgreys-primarybg'
              size='sm'
            >
              <Share2 className='h-3 w-3' />
              Twitter
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificateCard;
