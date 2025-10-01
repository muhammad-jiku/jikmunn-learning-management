import Header from '@/components/shared/Header';
import { UserProfile } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

const TeacherProfilePage = () => {
  return (
    <>
      <Header title='Profile' subtitle='View your profile' />
      <UserProfile
        path='/teacher/profile'
        routing='path'
        appearance={{
          baseTheme: dark,
          elements: {
            scrollBox: 'bg-customgreys-dark-grey',
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

export default TeacherProfilePage;
