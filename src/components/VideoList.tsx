/* eslint-disable @next/next/no-img-element */
'use client';

import React, { memo, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import useSWR, { mutate } from 'swr';
import { FcRemoveImage } from 'react-icons/fc';
import { AiOutlineCloudDownload, AiOutlineLoading3Quarters } from 'react-icons/ai';
import { VscLinkExternal, VscRefresh } from 'react-icons/vsc';
import { TbExternalLink } from 'react-icons/tb';
import numeral from 'numeral';
import { toast } from 'react-toastify';
import classNames from 'classnames';
import { VideoInfo } from '@/types/video';
import { MdOutlineVideocamOff, MdPlaylistRemove } from 'react-icons/md';
import isEqual from 'react-fast-compare';

const MAX_INTERVAL_Time = 120 * 1000;
const MIN_INTERVAL_Time = 3 * 1000;

export function VideoList() {
  const refreshIntervalTimeRef = useRef(3 * 1000);
  const {
    data: videos,
    isValidating,
    mutate
  } = useSWR<Array<VideoInfo>>(
    '/api/list',
    async () => {
      const videos = await axios.get<Array<VideoInfo>>('/api/list').then((res) => res.data);
      let nextIntervalTime = Math.min(
        Math.max(MIN_INTERVAL_Time, refreshIntervalTimeRef.current * 3),
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
      revalidateOnFocus: false,
      errorRetryCount: 0
    }
  );

  return (
    <div className='my-8 bg-base-content/5 rounded-md p-4 overflow-hidden'>
      <div className='grid grid-cols-[30px_auto_30px] place-items-center mb-4'>
        <div></div>
        <h1 className='text-center text-3xl font-bold'>Videos</h1>
        <div className=''>
          <button
            className={classNames(
              'btn btn-sm btn-ghost btn-circle text-2xl',
              isValidating && 'btn-disabled'
            )}
            onClick={() => mutate()}
          >
            <VscRefresh className={classNames(isValidating && 'animate-spin')} />
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
  const [isImageError, setImageError] = useState(false);
  const [isMouseEntered, setMouseEntered] = useState(false);
  const [recommendedDownloadRetry, setRecommendedDownloadRetry] = useState(false);
  const [firstPlay, setFirstPlay] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevVideoRef = useRef(video);

  const handleClickDelete =
    (video: VideoInfo, deleteType: 'deleteFile' | 'deleteList') => async () => {
      const deleteFile = deleteType === 'deleteFile';

      await axios
        .delete('/api/file', {
          params: {
            uuid: video.uuid,
            deleteFile
          }
        })
        .then((res) => {
          if (res.data.success) {
            if (deleteFile) {
              toast.success('Deleted list and file.');
            } else {
              toast.success('Deleted from list. (File will be retained)');
            }
          }
        });
      mutate('/api/list');
    };

  const handleMouseLeave = () => {
    if (!video?.download?.completed) {
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
    if (!video?.download?.completed) {
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
      .then((res) => res.data);

    setValidating(false);

    if (result?.error) {
      toast.error(result?.error || 'download failed');
    } else if (result?.success) {
      if (result?.status === 'already') {
        toast.info('already been downloaded');
      } else if (result?.status === 'downloading') {
        mutate('/api/list');
        toast.success('Download Retryed');
      }
    }
  };

  useEffect(() => {
    if (
      prevVideoRef?.current?.download?.completed ||
      prevVideoRef?.current?.download?.progress === '1'
    ) {
      return;
    }
    const initialProgress = prevVideoRef?.current?.download?.progress;
    const timeout = setTimeout(() => {
      const nextProgress = prevVideoRef?.current?.download?.progress;
      console.log(initialProgress, nextProgress);
      if (!prevVideoRef?.current?.download?.completed && initialProgress === nextProgress) {
        setRecommendedDownloadRetry(true);
      }
    }, 5000);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    prevVideoRef.current = video;
    setRecommendedDownloadRetry(false);
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
            {video?.download?.completed && (
              <video
                ref={videoRef}
                className='w-full h-full'
                src={`/api/stream?uuid=${video.uuid}`}
                controls
              />
            )}
          </div>
          <div className={classNames('w-full h-full', isMouseEntered ? 'hidden' : 'block')}>
            {video.thumbnail && !isImageError ? (
              <figure className='w-full h-full'>
                <img
                  className='w-full h-full object-cover'
                  src={video.thumbnail}
                  alt={'thumbnail'}
                  onError={() => setImageError(true)}
                />
              </figure>
            ) : (
              <div className='w-full h-full min-h-[100px] flex items-center justify-center text-4xl bg-base-content/5 select-none '>
                <FcRemoveImage />
              </div>
            )}
            {!video?.download?.completed && (
              <div className='absolute top-0 left-0 w-full h-full flex flex-col p-3 gap-y-2 items-center justify-center bg-black/60 text-2xl pointer-events-none'>
                <AiOutlineLoading3Quarters className='animate-spin' />
                {recommendedDownloadRetry && (
                  <div className='text-sm text-center'>
                    {"If you can't download it, try again with the button below."}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className='card-body grow-0 shrink p-3 overflow-hidden'>
          <h2 className='card-title line-clamp-2 text-base min-h-[3em] mb-2'>{video.title}</h2>
          <div className='flex items-center justify-between'>
            <div className='btn-group rounded-xl'>
              {!video?.download?.completed ? (
                <button className='btn btn-sm btn-outline btn-error btn-disabled text-lg'>
                  <MdOutlineVideocamOff />
                </button>
              ) : (
                <button
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
            <div className='btn-group'>
              <a
                className='btn btn-sm btn-info text-lg'
                href={video.url || ''}
                rel='noopener noreferrer'
                target='_blank'
              >
                <TbExternalLink />
              </a>
              {video?.download?.completed ? (
                <a
                  className={'btn btn-sm btn-primary text-xl dark:btn-secondary'}
                  href={video?.download?.completed ? `/api/file?id=${video.uuid}` : ''}
                  rel='noopener noreferrer'
                  target='_blank'
                  download={video?.download?.completed ? video.file.name : false}
                >
                  <AiOutlineCloudDownload />
                </a>
              ) : (
                <button
                  className={classNames(
                    'btn btn-sm btn-primary text-lg dark:btn-secondary',
                    recommendedDownloadRetry && 'animate-pulse'
                  )}
                  onClick={handleClickRestartDownload}
                >
                  <VscRefresh />
                </button>
              )}
            </div>
          </div>
        </div>
        {!video?.download?.completed && (
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
