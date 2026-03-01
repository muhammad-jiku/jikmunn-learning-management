'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGenerateCertificateMutation } from '@/state/api';
import {
  Award,
  Download,
  ExternalLink,
  PartyPopper,
  Share2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface CompletionCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
}

const CompletionCelebrationModal = ({
  isOpen,
  onClose,
  courseId,
  courseName,
}: CompletionCelebrationModalProps) => {
  const router = useRouter();
  const [generateCertificate, { data: certificate, isLoading }] =
    useGenerateCertificateMutation();
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    if (isOpen && !generated) {
      generateCertificate({ courseId })
        .unwrap()
        .then(() => setGenerated(true))
        .catch(() => {});
    }
  }, [isOpen, courseId, generateCertificate, generated]);

  const handleDownload = () => {
    if (certificate?.certificateId) {
      window.open(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/certificates/${certificate.certificateId}/download`,
        '_blank'
      );
    }
  };

  const handleShareLinkedIn = () => {
    if (certificate) {
      const url = encodeURIComponent(certificate.verificationUrl);
      const title = encodeURIComponent(
        `I just completed "${courseName}" on Learn Now!`
      );
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`,
        '_blank'
      );
    }
  };

  const handleShareTwitter = () => {
    if (certificate) {
      const text = encodeURIComponent(
        `🎓 I just completed "${courseName}" on Learn Now! Check out my certificate:`
      );
      const url = encodeURIComponent(certificate.verificationUrl);
      window.open(
        `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
        '_blank'
      );
    }
  };

  const handleViewCertificate = () => {
    if (certificate?.certificateId) {
      router.push(`/student/certificates`);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='completion-celebration-modal sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center justify-center gap-2 text-2xl'>
            <PartyPopper className='h-7 w-7 text-yellow-500' />
            Congratulations!
            <PartyPopper className='h-7 w-7 text-yellow-500' />
          </DialogTitle>
        </DialogHeader>

        <div className='flex flex-col items-center gap-4 py-4'>
          <div className='rounded-full bg-primary-700/20 p-6'>
            <Award className='h-16 w-16 text-primary-700' />
          </div>

          <div className='text-center'>
            <p className='text-lg font-semibold text-white-100'>
              You&apos;ve completed
            </p>
            <p className='text-xl font-bold text-primary-700'>{courseName}</p>
            <p className='mt-2 text-sm text-customgreys-dirtyGrey'>
              Your certificate has been generated and is ready to download.
            </p>
          </div>

          {isLoading ? (
            <p className='text-sm text-customgreys-dirtyGrey'>
              Generating your certificate...
            </p>
          ) : certificate ? (
            <div className='flex w-full flex-col gap-3'>
              <Button
                onClick={handleDownload}
                className='w-full gap-2 bg-primary-700 hover:bg-primary-600'
              >
                <Download className='h-4 w-4' />
                Download Certificate PDF
              </Button>

              <Button
                onClick={handleViewCertificate}
                variant='outline'
                className='w-full gap-2 border-customgreys-dirtyGrey text-white-100 hover:bg-customgreys-secondarybg'
              >
                <ExternalLink className='h-4 w-4' />
                View in My Certificates
              </Button>

              <div className='flex gap-2'>
                <Button
                  onClick={handleShareLinkedIn}
                  variant='outline'
                  className='flex-1 gap-2 border-customgreys-dirtyGrey text-white-100 hover:bg-customgreys-secondarybg'
                >
                  <Share2 className='h-4 w-4' />
                  LinkedIn
                </Button>
                <Button
                  onClick={handleShareTwitter}
                  variant='outline'
                  className='flex-1 gap-2 border-customgreys-dirtyGrey text-white-100 hover:bg-customgreys-secondarybg'
                >
                  <Share2 className='h-4 w-4' />
                  Twitter
                </Button>
              </div>
            </div>
          ) : (
            <p className='text-sm text-red-500'>
              Could not generate certificate. Please try again later.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompletionCelebrationModal;
