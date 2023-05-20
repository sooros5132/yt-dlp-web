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
  const { openCookiesEditor } = useSiteSettingStore(
    ({ openCookiesEditor }) => ({ openCookiesEditor }),
    shallow
  );

  useEffect(() => {
    document.body.style.overflow =
      (!enableTopSticky && isVideoPlayerOpen) || openCookiesEditor ? 'hidden' : '';
  }, [enableTopSticky, isVideoPlayerOpen, openCookiesEditor]);

  return <></>;
}
