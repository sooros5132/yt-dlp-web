'use client';

import { useVideoPlayerStore } from '@/store/videoPlayer';
import { useEffect } from 'react';

export function BodyScrollControl() {
  const { enableTopSticky, openVideoPlayer } = useVideoPlayerStore((state) => ({
    openVideoPlayer: state.openVideoPlayer,
    enableTopSticky: state.enableTopSticky
  }));

  useEffect(() => {
    document.body.style.overflow = !enableTopSticky && openVideoPlayer ? 'hidden' : '';
  }, [enableTopSticky, openVideoPlayer]);

  return <></>;
}
