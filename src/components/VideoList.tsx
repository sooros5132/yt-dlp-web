/* eslint-disable @next/next/no-img-element */
'use client';

import { memo, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import useSWR, { mutate } from 'swr';
import { FcRemoveImage } from 'react-icons/fc';
import { AiOutlineCloudDownload } from 'react-icons/ai';
import { VscRefresh } from 'react-icons/vsc';
import { TbExternalLink } from 'react-icons/tb';
import numeral from 'numeral';
import { toast } from 'react-toastify';
import classNames from 'classnames';
import { VideoInfo } from '@/types/video';
import { MdOutlineVideocamOff, MdPlaylistRemove, MdStop } from 'react-icons/md';
import { BsDatabaseGear } from 'react-icons/bs';
import isEqual from 'react-fast-compare';
import { LoadingSvg } from './LoadingSvg';
import { PingSvg } from './PingSvg';

const MAX_INTERVAL_Time = 120 * 1000;
const MIN_INTERVAL_Time = 3 * 1000;

export function VideoList({ videoList }: { videoList: VideoInfo[] }) {
  const [isSynchronizing, setSynchronizing] = useState(false);

  const refreshIntervalTimeRef = useRef(MIN_INTERVAL_Time);
  const {
    data: videos,
    isValidating,
    mutate
  } = useSWR<Array<VideoInfo>>(
    '/api/list',
    async () => {
      const videos = await axios.get<Array<VideoInfo>>('/api/list').then((res) => res.data);
      let nextIntervalTime = Math.min(
        Math.max(MIN_INTERVAL_Time, refreshIntervalTimeRef.current * 2),
        MAX_INTERVAL_Time
      );
      for (const video of videos) {
        if (video.download && !video.download.completed) {
          nextIntervalTime = 3 * 1000;
        }
      }
      refreshIntervalTimeRef.current = nextIntervalTime;
      return videos;
    },
    {
      refreshInterval: refreshIntervalTimeRef.current,
      errorRetryCount: 1,
      fallbackData: videoList
    }
  );

  const handleClickCleanMissingCacheButton = async () => {
    if (isSynchronizing) {
      return;
    }
    setSynchronizing(true);

    const result = await axios.post('/api/sync-cache').then((res) => res.data);

    if (result?.success) {
      toast.success('Reloaded video information');
    } else {
      toast.error('Failed to synchronize.');
    }
    setTimeout(() => {
      mutate();
    }, 300);
    setSynchronizing(false);
  };

  return (
    <div className='my-8 bg-base-content/5 rounded-md p-4 overflow-hidden'>
      <div className='grid grid-cols-[30px_auto_30px] place-items-center mb-4'>
        <div>
          <button
            className='tooltip tooltip-right before:w-[300px] btn btn-sm btn-ghost btn-circle text-xl normal-case font-normal'
            data-tip='Reload video information and Clean up the missing cache'
            disabled={isSynchronizing}
            onClick={handleClickCleanMissingCacheButton}
          >
            <BsDatabaseGear className={classNames('w-full', isSynchronizing && 'animate-pulse')} />
          </button>
        </div>
        <h1 className='text-center text-3xl font-bold'>Videos</h1>
        <div>
          <button
            className={classNames(
              'tooltip tooltip-left btn btn-sm btn-ghost btn-circle text-2xl normal-case font-normal',
              isValidating && 'btn-disabled'
            )}
            data-tip='Refresh video list'
            onClick={() => mutate()}
          >
            <VscRefresh className={classNames('w-full', isValidating && 'animate-spin')} />
          </button>
        </div>
      </div>
      <div className='grid gap-x-3 gap-y-6 grid-cols-1 sm:gap-5 sm:grid-cols-2'>
        {videos && videos.map((video) => <VideoDetailCard key={video.uuid} video={video} />)}
      </div>
    </div>
  );
}

const VideoDetailCard = memo(({ video }: { video: VideoInfo }) => {
  const [isValidating, setValidating] = useState(false);
  const [isMouseEntered, setMouseEntered] = useState(false);
  const [isThumbnailImageError, setThumbnailImageError] = useState(false);
  const [recommendedDownloadRetry, setRecommendedDownloadRetry] = useState(false);
  const [firstPlay, setFirstPlay] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevVideoRef = useRef(video);

  const handleClickDelete =
    (video: VideoInfo, deleteType: 'deleteFile' | 'deleteList') => async () => {
      const deleteFile = deleteType === 'deleteFile';

      const result = await axios
        .delete('/api/file', {
          params: {
            uuid: video.uuid,
            deleteFile
          }
        })
        .then((res) => res.data)
        .catch((res) => res.response.data);

      if (result.success) {
        if (deleteFile) {
          toast.success('Deleted list and file.');
        } else {
          toast.success('Deleted from list. (File will be retained)');
        }
      } else {
        toast.error(result.error || 'Failed to delete.');
      }

      setTimeout(() => {
        mutate('/api/list');
      }, 100);
    };

  const handleMouseLeave = () => {
    if (video.status !== 'completed') {
      return;
    }
    if (!document.fullscreenElement) {
      setMouseEntered(false);
      const videoEl = videoRef.current;
      if (videoEl) {
        videoEl?.pause?.();
      }
    }
  };

  const handleMouseEnter = async () => {
    if (video.status !== 'completed') {
      return;
    }
    const videoEl = videoRef.current;
    if (videoEl) {
      try {
        await videoEl?.play?.();
        if (firstPlay) {
          setTimeout(() => {
            videoEl.volume = 0.5;
          }, 1);
          setFirstPlay(false);
        }
        setMouseEntered(true);
      } catch (e) {}
    }
  };

  const handleClickRestartDownload = async () => {
    if (isValidating || !video.uuid) {
      return;
    }
    setValidating(true);
    setRecommendedDownloadRetry(false);

    const result = await axios
      .get('/api/r', {
        params: {
          uuid: video.uuid
        }
      })
      .then((res) => res.data)
      .catch((res) => res.response.data);

    setValidating(false);

    if (result?.error) {
      toast.error(result?.error || 'download failed');
    } else if (result?.success) {
      if (result?.status === 'already') {
        if (video.status === 'merging') {
          toast.success('already been downloaded');
        } else {
          toast.success('Download Retryed');
        }
      } else if (result?.status === 'downloading') {
        setTimeout(() => {
          mutate('/api/list');
        }, 100);
        toast.success('Download Retryed');
      }
    }
  };

  const handleClickStopRecording = async () => {
    if (isValidating || !video.uuid) {
      return;
    }
    setValidating(true);

    const result = await axios
      .patch('/api/recording', {
        uuid: video.uuid
      })
      .then((res) => res.data)
      .catch((res) => res.response.data);

    if (result?.error) {
      toast.error('Failed stop recording');
    } else if (result?.success) {
      toast.success('Stoped recording');
    }
    setValidating(false);
  };

  const handleImageError = () => {
    setThumbnailImageError(true);
  };

  useEffect(() => {
    if (
      video.status === 'completed' ||
      video.download.progress === '1' ||
      video.updatedAt !== prevVideoRef.current.updatedAt
    ) {
      setRecommendedDownloadRetry(false);
      return () => {
        prevVideoRef.current = video;
      };
    }

    const initialUpdatedAt = prevVideoRef?.current?.updatedAt;
    const initialProgress = prevVideoRef?.current?.download?.progress;
    const timeout = setTimeout(() => {
      const nextProgress = prevVideoRef?.current?.download?.progress;
      const nextUpdatedAt = prevVideoRef.current.updatedAt;

      if (
        !prevVideoRef?.current?.download?.completed &&
        initialProgress === nextProgress &&
        initialUpdatedAt === nextUpdatedAt
      ) {
        setRecommendedDownloadRetry(true);
      }
    }, 8000);

    return () => {
      prevVideoRef.current = video;
      clearTimeout(timeout);
    };
  }, [video]);

  return (
    <div>
      <div className='group card card-side bg-base-100 shadow-xl rounded-xl flex-col overflow-hidden'>
        <div
          className='relative flex items-center shrink-0 grow-0 min-w-[100px] max-h-[250px] overflow-hidden aspect-video'
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
        >
          <div
            className={classNames(
              'w-full h-full place-items-center bg-black',
              isMouseEntered ? 'flex' : 'hidden'
            )}
          >
            {video.status === 'completed' && (
              <video
                key={video.status || 'completed'}
                ref={videoRef}
                className='w-full h-full'
                src={`/api/file?uuid=${video.uuid}`}
                muted
                controls
                preload='none'
              />
            )}
          </div>
          <div
            className={classNames('w-full h-full', isMouseEntered ? 'hidden' : 'block')}
            onClick={handleMouseEnter}
          >
            {video.thumbnail && !isThumbnailImageError ? (
              <figure className='w-full h-full'>
                <img
                  className='w-full h-full object-cover'
                  src={
                    /^https?:\/?\/?/i.test(video.thumbnail)
                      ? '/api/image?url=' + encodeURIComponent(video?.thumbnail)
                      : video.thumbnail
                  }
                  alt={'thumbnail'}
                  onError={handleImageError}
                  loading='lazy'
                />
              </figure>
            ) : (
              <div className='w-full h-full min-h-[100px] flex items-center justify-center text-4xl bg-base-content/5 select-none '>
                <FcRemoveImage />
              </div>
            )}
            {video.status !== 'completed' && (
              <div className='absolute top-0 left-0 w-full h-full flex flex-col p-3 gap-y-2 items-center justify-center bg-black/60 text-2xl text-white dark:text-base-content pointer-events-none'>
                <LoadingSvg className='text-xl' />
                {video.createdAt !== video.updatedAt && (
                  <div className='text-xs text-center'>
                    {'Running time ≈'}
                    {numeral((video.updatedAt - video.createdAt) / 1000).format('00:00:00')}
                  </div>
                )}
                <div className={classNames('text-sm text-center animate-pulse')}>
                  {recommendedDownloadRetry
                    ? "Video and audio may be merging, but can't you download it? try again with the button below."
                    : `${video.status}...`}
                </div>
              </div>
            )}
          </div>
          {!isMouseEntered && typeof video.file.height === 'number' && video.file.height > 0 && (
            <div className='absolute left-1.5 top-1.5 text-xs text-white bg-black/70 py-0.5 px-1.5 rounded-sm'>
              {video.file.height}p
              {typeof video.file.rFrameRate === 'number' && video.file.rFrameRate > 0
                ? Math.round(video.file.rFrameRate)
                : ''}
              {video.file.codecName ? ' ' + video.file.codecName : ''}
              {video.file.colorPrimaries === 'bt2020' ? ' HDR' : ''}
            </div>
          )}
          {!isMouseEntered && typeof video.file.size === 'number' && (
            <div className='absolute left-1.5 bottom-1.5 text-xs text-white bg-black/70 py-0.5 px-1.5 rounded-sm'>
              {numeral(video.file.size).format('0.0b')}
            </div>
          )}
          {!isMouseEntered && typeof video.file.length === 'number' && (
            <div className='absolute right-1.5 bottom-1.5 text-xs text-white bg-black/70 py-0.5 px-1.5 rounded-sm'>
              {numeral(video.file.length).format(video.file.length >= 3600 ? '00:00:00' : '00:00')}
            </div>
          )}
        </div>
        <div className='card-body grow-0 shrink p-3 overflow-hidden'>
          <h2 className='card-title line-clamp-2 text-base min-h-[3em] mb-2'>
            {video.is_live && video.status === 'recording' && (
              <div className='inline-flex items-center align-text-top text-xl text-rose-600'>
                <PingSvg />
              </div>
            )}
            <span>{video.title}</span>
          </h2>
          <div className='flex items-center justify-between'>
            <div className='btn-group rounded-xl'>
              {video.status !== 'completed' ? (
                <button
                  className='btn btn-sm btn-outline btn-error text-lg'
                  onClick={() =>
                    toast.warn(
                      video?.is_live
                        ? 'Please erase it after stop recording'
                        : 'The file cannot be erased while downloading. Please erase it yourself.'
                    )
                  }
                >
                  <MdOutlineVideocamOff key={'no-completed'} />
                </button>
              ) : (
                <button
                  key={'completed'}
                  className='btn btn-sm btn-outline btn-error text-lg'
                  onClick={handleClickDelete(video, 'deleteFile')}
                >
                  <MdOutlineVideocamOff />
                </button>
              )}
              <button
                className='btn btn-sm btn-outline btn-warning text-lg'
                onClick={handleClickDelete(video, 'deleteList')}
              >
                <MdPlaylistRemove />
              </button>
            </div>
            {video.is_live && video.status === 'recording' && (
              <button
                className='btn btn-sm btn-circle btn-outline btn-error text-lg'
                onClick={handleClickStopRecording}
              >
                <MdStop />
              </button>
            )}
            <div className='btn-group'>
              <a
                className='btn btn-sm btn-info text-lg'
                href={video.url || ''}
                rel='noopener noreferrer'
                target='_blank'
              >
                <TbExternalLink />
              </a>
              {video.status === 'completed' ? (
                <a
                  className={'btn btn-sm btn-primary text-xl dark:btn-secondary'}
                  href={
                    video.status === 'completed' ? `/api/file?uuid=${video.uuid}&download=true` : ''
                  }
                  rel='noopener noreferrer'
                  target='_blank'
                  download={video?.status === 'completed' ? video.file.name : false}
                >
                  <AiOutlineCloudDownload />
                </a>
              ) : (
                <button
                  className={classNames(
                    'btn btn-sm btn-primary text-lg dark:btn-secondary',
                    recommendedDownloadRetry && 'animate-pulse'
                  )}
                  disabled={video?.is_live}
                  onClick={handleClickRestartDownload}
                >
                  {video?.is_live ? <AiOutlineCloudDownload /> : <VscRefresh />}
                </button>
              )}
            </div>
          </div>
        </div>
        {video.status === 'completed' ? (
          <div className='h-1'></div>
        ) : video.status === 'recording' ? (
          <div className='h-1 gradient-background' />
        ) : (
          <progress
            className='progress progress-info w-full h-1'
            value={Number(numeral(video.download.progress).format('0.00') || 0)}
          />
        )}
      </div>
    </div>
  );
}, isEqual);

VideoDetailCard.displayName = 'VideoDetailCard';
