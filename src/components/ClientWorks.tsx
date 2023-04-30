'use client';

import { useLayoutEffect } from 'react';
import { useSiteSettingStore } from '@/store/siteSetting';
import { useVideoPlayerStore } from '@/store/videoPlayer';

export function ClientWorks() {
  useLayoutEffect(() => {
    useSiteSettingStore.getState().setHydrated();
    useVideoPlayerStore.getState().close();
  }, []);

  return <></>;
}
