'use client';

import { ChangeEvent, useEffect, useRef } from 'react';
import { LinkIcon } from 'lucide-react';
import { TiArrowLoop } from 'react-icons/ti';
import { TbPin, TbPinnedOff, TbViewportNarrow, TbViewportWide } from 'react-icons/tb';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
import { AiOutlineFullscreen } from 'react-icons/ai';
import { CgClose } from 'react-icons/cg';

import type { WithoutNullableKeys } from '@/types/types';
import type { VideoInfo } from '@/types/video';
import type { VideoPlayerStore } from '@/store/videoPlayer';

import { cn } from '@/lib/utils';
import { useVideoPlayerStore } from '@/store/videoPlayer';
import { Button } from '@/components/ui/button';

export type VideoPlayerVideoInfo = {
  uuid: string;
  title?: string | null;
  url: string;
  playlistVideoUuid?: string;
  size?: number;
  type: VideoInfo['type'];
};

export type VideoPlayerProps = {
  videoInfo: VideoPlayerVideoInfo;
} & Pick<
  VideoPlayerStore,
  'isNotSupportedCodec' | 'isWideScreen' | 'isTopSticky' | 'isLoopVideo' | 'volume'
>;

export function VideoPlayer({
  isLoopVideo,
  isNotSupportedCodec,
  isTopSticky: _isTopSticky,
  isWideScreen,
  videoInfo,
  volume
}: WithoutNullableKeys<VideoPlayerProps>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isTopSticky = _isTopSticky && videoInfo.type === 'video';
  const videoFileUrl =
    videoInfo.type === 'playlist' && videoInfo.playlistVideoUuid
      ? `/api/playlist/file?uuid=${videoInfo.uuid}${
          videoInfo.playlistVideoUuid ? `&itemUuid=${videoInfo.playlistVideoUuid}` : ''
        }`
      : `/api/file?uuid=${videoInfo.uuid}`;

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoInfo || !videoEl) {
      return;
    }
    (async function () {
      const { currentTime, volume, setNotSupportedCodec } = useVideoPlayerStore.getState();

      videoEl.volume = typeof volume === 'number' ? volume : 0.75;
      videoEl.currentTime = currentTime || 0;

      try {
        await videoEl?.play?.();
        setNotSupportedCodec(false);
      } catch (e) {
        setNotSupportedCodec(true);
      }
    })();

    const handlePlayingVideo = () => {
      setTimeout(() => {
        const { isNotSupportedCodec, setNotSupportedCodec } = useVideoPlayerStore.getState();

        if (isNotSupportedCodec) {
          setNotSupportedCodec(false);
        }
      }, 100);
    };

    const handleKeyPress = async (event: globalThis.KeyboardEvent) => {
      switch (event.code) {
        case 'Escape': {
          handleClose();
          break;
        }
        case 'Space': {
          const videoEl = videoRef.current;
          if (!videoEl || document.activeElement === videoEl) break;

          if (videoEl.paused) {
            await videoEl.play();
          } else {
            videoEl.pause();
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    videoEl.addEventListener('playing', handlePlayingVideo);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (videoEl) {
        const { setCurrentTime } = useVideoPlayerStore.getState();
        const currentTime = Number(videoEl.currentTime) || 0;
        if (currentTime) setCurrentTime(currentTime);
        videoEl.removeEventListener('playing', handlePlayingVideo);
      }
    };
  }, [videoInfo]);

  const handleClose = () => {
    const close = useVideoPlayerStore.getState().close;
    const videoEl = videoRef.current;
    if (videoEl) {
      const { setVolume, setCurrentTime } = useVideoPlayerStore.getState();
      const volume = videoEl.volume;
      setVolume(typeof volume === 'number' ? volume : 0.75);
      const currentTime = Number(videoEl.currentTime) || 0;
      if (currentTime) setCurrentTime(currentTime);
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

    videoEl.volume = typeof volume === 'number' ? volume : 0.75;
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
    const { setWideScreen, isWideScreen } = useVideoPlayerStore.getState();
    setWideScreen(!isWideScreen);
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
    const { setTopSticky, isTopSticky } = useVideoPlayerStore.getState();
    setTopSticky(!isTopSticky);
  };

  const handleClickLoopVideoButton = () => {
    const { isLoopVideo, setLoopVideo } = useVideoPlayerStore.getState();
    setLoopVideo(!isLoopVideo);
  };

  const handleVolumeChange = (event: ChangeEvent<HTMLVideoElement>) => {
    const { setVolume } = useVideoPlayerStore.getState();

    setVolume(event.target.volume);
  };

  return (
    <div className='group w-full h-full min-w-[var(--site-min-width)] flex flex-col items-center space-between overflow-hidden'>
      <div
        className={cn(
          'flex w-full min-h-14 max-h-30 p-2 grow-0 shrink-0 items-center justify-between bg-black/30 text-white transition-opacity duration-500',
          (isWideScreen || isTopSticky) && 'absolute top-0 left-0 z-10',
          isTopSticky && 'opacity-0 group-hover:opacity-100'
        )}
      >
        <div className='flex items-center gap-x-1.5 overflow-hidden break-words'>
          <Button
            variant='ghost'
            size='icon'
            className='grow-0 shrink-0 w-[1.5em] h-[1.5em] text-xl rounded-full hidden sm:flex'
            onClick={handleClose}
            title='Close video player'
          >
            <HiOutlineArrowLeft />
          </Button>
          <div className='pl-2 font-bold line-clamp-2' title={videoInfo.title || ''}>
            {videoInfo.title}
          </div>
        </div>
        <div className='flex gap-x-1 whitespace-nowrap'>
          <Button variant='ghost' size='icon' className='w-[1.5em] h-[1.5em] text-lg rounded-full'>
            <a
              className='flex w-full h-full justify-center items-center'
              href={videoInfo.url || ''}
              rel='noopener noreferrer'
              target='_blank'
              onClick={handleClickExternalLink}
              title='Open Original Link'
            >
              <LinkIcon className='text-base' size='1em' />
            </a>
          </Button>
          {videoInfo.type === 'video' && (
            <Button
              variant='ghost'
              size='icon'
              className='w-[1.5em] h-[1.5em] shrink-0 text-xl rounded-full'
              onClick={handleTopStickyButton}
              title={isTopSticky ? 'Not fixing on top' : 'Fixing on top'}
            >
              {isTopSticky ? <TbPinnedOff /> : <TbPin />}
            </Button>
          )}
          <Button
            variant='ghost'
            size='icon'
            className='w-[1.5em] h-[1.5em] shrink-0 text-xl rounded-full'
            onClick={handleClickWideButton}
          >
            {isWideScreen ? <TbViewportNarrow /> : <TbViewportWide />}
          </Button>
          {document && document.fullscreenEnabled && (
            <Button
              variant='ghost'
              size='icon'
              className='w-[1.5em] h-[1.5em] shrink-0 text-xl rounded-full'
              onClick={handleClickFullScreenButton}
              title='Full screen'
            >
              <AiOutlineFullscreen />
            </Button>
          )}
          <Button
            variant='ghost'
            size='icon'
            className={cn(
              'w-[1.5em] h-[1.5em] shrink-0 text-xl rounded-full',
              isLoopVideo && 'text-green-500 hover:text-green-500/80'
            )}
            onClick={handleClickLoopVideoButton}
            title='Loop video'
          >
            <TiArrowLoop />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='w-[1.5em] h-[1.5em] shrink-0 text-xl rounded-full'
            onClick={handleClose}
            title='Close player'
          >
            <CgClose />
          </Button>
        </div>
      </div>
      <div
        className='relative flex-auto flex flex-col items-center justify-center w-full h-full cursor-pointer overflow-hidden'
        onClick={handleClose}
      >
        <video
          ref={videoRef}
          className={cn(
            'max-w-full max-h-full object-contain outline-none',
            isWideScreen && 'w-full'
          )}
          src={videoFileUrl}
          controls
          playsInline
          onVolumeChange={handleVolumeChange}
          loop={isLoopVideo}
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
}
