'use client';

import React, { useLayoutEffect } from 'react';
import { useSiteSettingStore } from '@/store/siteSetting';

export function ClientWorks() {
  useLayoutEffect(() => {
    const { setHydrated } = useSiteSettingStore.getState();
    setHydrated();
  }, []);

  return <></>;
}
