/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useRef, useState } from 'react';
import axios from 'axios';
import useSWR, { mutate } from 'swr';
import { FcRemoveImage } from 'react-icons/fc';
import { AiOutlineCloudDownload, AiOutlineLoading3Quarters } from 'react-icons/ai';
import { VscLinkExternal, VscRefresh } from 'react-icons/vsc';
import numeral from 'numeral';
import { toast } from 'react-toastify';
import classNames from 'classnames';
import { VideoInfo } from '@/types/video';
import { MdOutlineVideocamOff, MdOutlineContentPasteOff } from 'react-icons/md';

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
      let nextIntervalTime = 60 * 1000;
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

const VideoDetailCard = ({ video }: { video: VideoInfo }) => {
  const [isImageError, setImageError] = useState(false);
  const [isMouseEntered, setMouseEntered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleClickDelete = (video: VideoInfo) => async () => {
    await axios
      .delete('/api/file', {
        params: {
          id: video.uuid
        }
      })
      .then((res) => {
        if (res.data.success) {
          toast.success('Deleted from db. (File will be retained)');
        }
      });
    mutate('/api/list');
  };

  const handleMouseLeave = () => {
    setMouseEntered(false);
    const video = videoRef.current;
    if (video) {
      video?.pause?.();
    }
  };

  const handleMouseEnter = async () => {
    const video = videoRef.current;
    if (video) {
      try {
        setMouseEntered(true);
        await video?.play?.();
        video.volume = 0.5;
      } catch (e) {}
    }
  };

  return (
    <div
      className='group card card-side bg-base-100 shadow-xl rounded-xl flex-col overflow-hidden'
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleMouseEnter}
      onTouchEnd={handleMouseEnter}
    >
      <div className='relative flex items-center shrink-0 grow-0 min-w-[100px] max-h-[250px] overflow-hidden aspect-video'>
        <div
          className={classNames(
            'w-full h-full place-items-center bg-black',
            isMouseEntered ? 'flex' : 'hidden'
          )}
        >
          <video
            ref={videoRef}
            className='w-full h-full'
            src={`/api/stream?id=${video.uuid}`}
            controls
          />
        </div>
        <div className={classNames(isMouseEntered ? 'hidden' : 'block')}>
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
            <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/60 text-2xl pointer-events-none animate-pulse'>
              <AiOutlineLoading3Quarters className='animate-spin' />
            </div>
          )}
        </div>
      </div>
      <div className='card-body grow shrink p-3 overflow-hidden'>
        <h2 className='card-title line-clamp-2 text-base min-h-[3em]'>{video.title}</h2>
        <div className='flex items-center justify-between'>
          <div className='btn-group rounded-xl'>
            <button className='btn btn-sm text-lg btn-error' onClick={handleClickDelete(video)}>
              <MdOutlineVideocamOff />
            </button>
            <button className='btn btn-sm text-lg btn-warning' onClick={handleClickDelete(video)}>
              <MdOutlineContentPasteOff />
            </button>
          </div>
          <div className='btn-group rounded-xl'>
            <a
              className='btn btn-sm text-lg btn-info'
              href={video.url || ''}
              rel='noopener noreferrer'
              target='_blank'
            >
              <VscLinkExternal />
            </a>
            <a
              className={classNames(
                'btn btn-sm text-xl btn-secondary',
                !video?.download?.completed && 'btn-disabled'
              )}
              href={video?.download?.completed ? `/api/file?id=${video.uuid}` : ''}
              rel='noopener noreferrer'
              target='_blank'
              download={video?.download?.completed ? video.file.name : false}
            >
              <AiOutlineCloudDownload />
            </a>
          </div>
        </div>

        <div className='mt-auto line-clamp-1 break-all text-base-content/60'></div>
      </div>
      <progress
        className='progress progress-info w-full h-1'
        value={Number(numeral(video.download.progress).format('0.00') || 0)}
      />
    </div>
  );
};
