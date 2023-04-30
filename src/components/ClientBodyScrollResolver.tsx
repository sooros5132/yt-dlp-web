'use client';

import { useVideoPlayerStore } from '@/store/videoPlayer';
import { useEffect } from 'react';
import { shallow } from 'zustand/shallow';

export function ClientBodyScrollResolver() {
  const isVideoPlayerOpen = useVideoPlayerStore((state) => state.isVideoPlayerOpen, shallow);

  useEffect(() => {
    document.body.style.overflow = isVideoPlayerOpen ? 'hidden' : '';
  }, [isVideoPlayerOpen]);

  return <></>;
}
