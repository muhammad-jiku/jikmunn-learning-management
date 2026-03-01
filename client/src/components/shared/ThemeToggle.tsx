'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';

// Subscribe to nothing - we just need to detect client-side
const emptySubscribe = () => () => {};

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  // Use useSyncExternalStore for hydration-safe mounting detection
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <button className='rounded-full p-2 transition-colors hover:bg-customgreys-dark-grey'>
        <Sun className='h-5 w-5 text-customgreys-dirty-grey' />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className='rounded-full p-2 transition-colors hover:bg-customgreys-dark-grey'
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className='h-5 w-5 text-customgreys-dirty-grey transition-colors hover:text-yellow-400' />
      ) : (
        <Moon className='h-5 w-5 text-gray-600 transition-colors hover:text-indigo-500' />
      )}
    </button>
  );
};

export default ThemeToggle;
