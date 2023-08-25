'use client';

import { useEffect } from 'react';
import { useVideoPlayerStore } from '@/store/videoPlayer';
import { useDownloadFormStore } from '@/store/downloadForm';

export function RehydrateProvider() {
  useEffect(() => {
    useDownloadFormStore.persist.rehydrate();
    useVideoPlayerStore.persist.rehydrate();
  }, []);

  return null;
}
