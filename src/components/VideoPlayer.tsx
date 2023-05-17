'use client';

import { useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import classNames from 'classnames';
import { useSiteSettingStore } from '@/store/siteSetting';
import { useVideoPlayerStore } from '@/store/videoPlayer';
import {
  TbExternalLink,
  TbPin,
  TbPinnedOff,
  TbViewportNarrow,
  TbViewportWide
} from 'react-icons/tb';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
import { AiOutlineFullscreen } from 'react-icons/ai';

export const VideoPlayer = () => {
  const { video, isVideoPlayerOpen, isNotSupportedCodec, enableWideScreen, enableTopSticky } =
    useVideoPlayerStore(
      (state) => ({
        video: state.video,
        isVideoPlayerOpen: state.isVideoPlayerOpen,
        isNotSupportedCodec: state.isNotSupportedCodec,
        enableWideScreen: state.enableWideScreen,
        enableTopSticky: state.enableTopSticky
      }),
      shallow
    );
  const hydrated = useSiteSettingStore((state) => state.hydrated, shallow);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!isVideoPlayerOpen || !video || !videoEl) {
      return;
    }
    (async function () {
      const { currentTime, volume, setNotSupportedCodec } = useVideoPlayerStore.getState();

      videoEl.volume = volume || 0.75;
      videoEl.currentTime = currentTime || 0;

      try {
        await videoEl?.play?.();
        setNotSupportedCodec(false);
      } catch (e) {
        setNotSupportedCodec(true);
      }
    })();

    const handleKeyPress = (event: globalThis.KeyboardEvent) => {
      if (event.key == 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isVideoPlayerOpen, video]);

  if (!hydrated || !isVideoPlayerOpen || !video) {
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

  const handleClickWideButton = () => {
    const { setEnableWideScreen, enableWideScreen } = useVideoPlayerStore.getState();
    setEnableWideScreen(!enableWideScreen);
  };

  const handleClickFullScreenButton = async () => {
    const videoEl = videoRef.current as any;
    if (!videoEl) {
      return;
    }
    try {
      if (videoEl?.requestFullscreen) return videoEl?.requestFullscreen?.();
    } catch (e) {}
  };
  const handleTopStickyButton = () => {
    const { setEnableTopSticky, enableTopSticky } = useVideoPlayerStore.getState();
    setEnableTopSticky(!enableTopSticky);
  };

  return (
    <div
      className={classNames(
        'group top-0 left-0 w-full min-w-[var(--site-min-width)] flex flex-col items-center space-between bg-black/90 dark:bg-black/70 backdrop-blur-lg z-10 overflow-hidden',
        enableTopSticky ? 'sticky min-h-[200px] h-[35vh] md:h-[30vh]' : 'fixed h-full'
      )}
    >
      <div
        className={classNames(
          'flex w-full min-h-14 max-h-30 p-2 grow-0 shrink-0 items-center justify-between bg-black/30 text-white transition-opacity duration-500',
          (enableWideScreen || enableTopSticky) && 'absolute top-0 left-0 z-10',
          enableTopSticky && 'opacity-0 group-hover:opacity-100'
        )}
      >
        <div className='flex items-center gap-x-1.5'>
          <button
            className='btn btn-circle btn-sm btn-ghost grow-0 shrink-0 text-xl'
            onClick={handleClose}
            title='Close video player'
          >
            <HiOutlineArrowLeft />
          </button>
          <div className='pl-2 font-bold line-clamp-2' title={video.title || ''}>
            {video.title}
          </div>
        </div>
        <div className='flex gap-x-1.5 whitespace-nowrap'>
          <a
            className='btn btn-sm btn-circle btn-ghost text-lg'
            href={video.url || ''}
            rel='noopener noreferrer'
            target='_blank'
            onClick={handleClickExternalLink}
            title='Open Original Link'
          >
            <TbExternalLink />
          </a>
          <button
            className='btn btn-circle btn-sm btn-ghost shrink-0 text-xl'
            onClick={handleTopStickyButton}
            title={enableTopSticky ? 'Not fixing on top' : 'Fixing on top'}
          >
            {enableTopSticky ? <TbPinnedOff /> : <TbPin />}
          </button>
          <button
            className='btn btn-circle btn-sm btn-ghost shrink-0 text-xl'
            onClick={handleClickWideButton}
          >
            {enableWideScreen ? <TbViewportNarrow /> : <TbViewportWide />}
          </button>
          {document && document.fullscreenEnabled && (
            <button
              className='btn btn-circle btn-sm btn-ghost shrink-0 text-xl'
              onClick={handleClickFullScreenButton}
              title='Full screen'
            >
              <AiOutlineFullscreen />
            </button>
          )}
        </div>
      </div>
      <div
        className='relative flex-auto flex flex-col items-center justify-center w-full h-full cursor-pointer overflow-hidden'
        onClick={handleClose}
      >
        <video
          ref={videoRef}
          className={classNames(
            'max-w-full max-h-full object-contain outline-none',
            enableWideScreen && 'w-full'
          )}
          src={`/api/file?uuid=${video.uuid}`}
          controls
          playsInline
          onClick={handleClickVideo}
        />
        {isNotSupportedCodec && (
          <div
            className='absolute flex top-0 left-0 items-center text-center w-full h-full pointer-events-none cursor-auto'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='w-full bg-black/70 text-white text-sm md:text-base py-2'>
              {`The file does not exist or cannot be played.`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
