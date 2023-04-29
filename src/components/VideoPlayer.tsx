'use client';

import { useVideoPlayerStore } from '@/store/videoPlayer';
import { AiOutlineClose } from 'react-icons/ai';
import { useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import { useSiteSettingStore } from '@/store/siteSetting';
import { TbExternalLink } from 'react-icons/tb';

export const VideoPlayer = () => {
  const { video } = useVideoPlayerStore((state) => ({ video: state.video }), shallow);
  const hydrated = useSiteSettingStore((state) => state.hydrated, shallow);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!video || !videoEl) {
      return;
    }
    (async function () {
      try {
        const { currentTime, volume } = useVideoPlayerStore.getState();

        videoEl.volume = volume || 0.75;
        videoEl.currentTime = currentTime || 0;

        await videoEl?.play?.();
      } catch (e) {
        return;
      }
    })();
  }, [video]);

  if (!video || !hydrated) {
    return null;
  }

  const handleClose = () => {
    const close = useVideoPlayerStore.getState().close;
    const videoEl = videoRef.current;
    if (videoEl) {
      const { setVolume, setCurrentTime } = useVideoPlayerStore.getState();
      setVolume(Number(videoEl.volume) || 0.75);
      setCurrentTime(Number(videoEl.currentTime) || 0);
    }

    close();
  };

  const handleClickVideo = (event: React.MouseEvent<HTMLVideoElement>) => {
    event.stopPropagation();
    const volume = useVideoPlayerStore.getState().volume;

    const videoEl = videoRef.current;
    if (!videoEl) {
      return;
    }

    videoEl.volume = volume || 0.75;
  };

  const handleClickExternalLink = () => {
    const videoEl = videoRef.current;
    if (!videoEl) {
      return;
    }
    try {
      videoEl?.pause?.();
    } catch (e) {}
  };

  return (
    <div className='fixed top-0 left-0 w-full h-full flex flex-col items-center space-between bg-black/80 dark:bg-black/70 backdrop-blur-lg z-10 overflow-hidden'>
      <div className='flex w-full min-h-14 max-h-30 p-2 grow-0 shrink-0 items-center justify-between bg-black/70 dark:bg-black/30 text-white'>
        <div className='pl-2 font-bold line-clamp-2'>{video.title}</div>
        <div className='flex gap-x-1.5 whitespace-nowrap'>
          <a
            className='btn btn-sm btn-circle btn-ghost text-lg'
            href={video.url || ''}
            rel='noopener noreferrer'
            target='_blank'
            onClick={handleClickExternalLink}
          >
            <TbExternalLink />
          </a>
          <button
            className='btn btn-circle btn-sm btn-ghost shrink-0 text-xl'
            onClick={handleClose}
          >
            <AiOutlineClose />
          </button>
        </div>
      </div>
      <div
        className='flex-auto flex flex-col items-center justify-center w-full h-full cursor-pointer overflow-hidden'
        onClick={handleClose}
      >
        <video
          ref={videoRef}
          className='max-w-full max-h-full object-contain outline-none'
          src={`/api/file?uuid=${video.uuid}`}
          controls
          onClick={handleClickVideo}
        />
      </div>
    </div>
  );
};
