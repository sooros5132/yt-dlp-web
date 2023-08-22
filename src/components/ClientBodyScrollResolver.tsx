'use client';

import { useSiteSettingStore } from '@/store/siteSetting';
import { useVideoPlayerStore } from '@/store/videoPlayer';
import { useEffect } from 'react';
import { shallow } from 'zustand/shallow';

export function ClientBodyScrollResolver() {
  const { enableTopSticky, isVideoPlayerOpen } = useVideoPlayerStore(
    (state) => ({
      isVideoPlayerOpen: state.isVideoPlayerOpen,
      enableTopSticky: state.enableTopSticky
    }),
    shallow
  );

  useEffect(() => {
    document.body.style.overflow = !enableTopSticky && isVideoPlayerOpen ? 'hidden' : '';
  }, [enableTopSticky, isVideoPlayerOpen]);

  return <></>;
}
