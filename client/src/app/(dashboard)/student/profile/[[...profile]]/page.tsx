import Header from '@/components/shared/Header';
import { UserProfile } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

const UserProfilePage = () => {
  return (
    <>
      <Header title='Profile' subtitle='View your profile' />
      <UserProfile
        path='/student/profile'
        routing='path'
        appearance={{
          baseTheme: dark,
          elements: {
            scrollBox: 'bg-customgreys-darkGrey',
            navbar: {
              '& > div:nth-child(1)': {
                background: 'none',
              },
            },
          },
        }}
      />
    </>
  );
};

export default UserProfilePage;
