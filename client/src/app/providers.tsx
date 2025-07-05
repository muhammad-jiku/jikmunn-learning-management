'use client';

import StoreProvider from '@/state/redux';
import React from 'react';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return <StoreProvider>{children}</StoreProvider>;
};

export default Providers;
