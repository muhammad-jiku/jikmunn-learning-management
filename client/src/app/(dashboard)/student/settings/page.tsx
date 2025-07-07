import SharedNotificationSettings from '@/components/shared/SharedNotificationSettings';

const UserSettings = () => {
  return (
    <div className='w-3/5'>
      <SharedNotificationSettings
        title='User Settings'
        subtitle='Manage your user notification settings'
      />
    </div>
  );
};

export default UserSettings;
