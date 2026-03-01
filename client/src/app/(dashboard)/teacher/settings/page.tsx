'use client';

import SharedNotificationSettings from '@/components/shared/SharedNotificationSettings';
import { Button } from '@/components/ui/button';
import { useUpdateUserMutation } from '@/state/api';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { toast } from 'sonner';

const TeacherSettings = () => {
  const { user } = useUser();
  const [updateUser] = useUpdateUserMutation();
  const currentBio = (user?.publicMetadata as { bio?: string })?.bio || '';
  const [bio, setBio] = useState(currentBio);

  const handleBioSave = async () => {
    if (!user) return;

    try {
      await updateUser({
        userId: user.id,
        publicMetadata: {
          ...user.publicMetadata,
          bio,
        },
      });
      toast.success('Bio updated successfully');
    } catch {
      toast.error('Failed to update bio');
    }
  };

  return (
    <div className='w-3/5'>
      {/* Teacher Bio Section */}
      <div className='mb-8'>
        <h2 className='text-xl font-semibold text-white-50 mb-1'>
          Teacher Profile
        </h2>
        <p className='text-sm text-customgreys-dirty-grey mb-4'>
          This bio is displayed on your course pages
        </p>
        <div className='space-y-3'>
          <label className='text-sm text-customgreys-dirty-grey'>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder='Tell students about yourself, your experience, and teaching style...'
            className='w-full rounded-md border border-gray-600 bg-customgreys-darkGrey px-3 py-2 text-sm text-white-100 placeholder:text-gray-500 focus:border-primary-700 focus:outline-none min-h-[120px] resize-y'
            maxLength={500}
          />
          <div className='flex items-center justify-between'>
            <span className='text-xs text-customgreys-dirty-grey'>
              {bio.length}/500 characters
            </span>
            <Button
              onClick={handleBioSave}
              className='bg-primary-700 hover:bg-primary-600'
              size='sm'
            >
              Save Bio
            </Button>
          </div>
        </div>
      </div>

      <SharedNotificationSettings
        title='Teacher Settings'
        subtitle='Manage your teacher notification settings'
      />
    </div>
  );
};

export default TeacherSettings;
