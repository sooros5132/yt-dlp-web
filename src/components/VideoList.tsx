'use client';

import { memo, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import useSWR, { mutate } from 'swr';
import numeral from 'numeral';
import classNames from 'classnames';
import isEqual from 'react-fast-compare';
import { toast } from 'react-toastify';
import { useVideoPlayerStore } from '@/store/videoPlayer';
import { LoadingSvg } from '@/components/LoadingSvg';
import { PingSvg } from '@/components/PingSvg';
import { isMobile } from '@/client/utils';
import { FcRemoveImage } from 'react-icons/fc';
import { AiOutlineCloudDownload } from 'react-icons/ai';
import { VscRefresh } from 'react-icons/vsc';
import { MdOutlineVideocamOff, MdPlaylistRemove, MdStop } from 'react-icons/md';
import { BsDatabaseGear } from 'react-icons/bs';
import { TbExternalLink } from 'react-icons/tb';
import { CgClose, CgPlayListSearch } from 'react-icons/cg';
import type { VideoInfo } from '@/types/video';

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
        if (video.download && video.status !== 'failed' && video.status !== 'completed') {
          nextIntervalTime = 3 * 1000;
          break;
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

  const handleClickRefreshButton = async () => {
    await mutate();
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
            onClick={handleClickRefreshButton}
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
  const [isNotSupportedCodec, setNotSupportedCodec] = useState(false);
  const [recommendedDownloadRetry, setRecommendedDownloadRetry] = useState(false);
  const [openPlaylistView, setOpenPlaylistView] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevVideoRef = useRef(video);
  const isCompleted = video.status === 'completed';
  const isStandby = video.status === 'standby';
  const isFailed = video.status === 'failed';
  const isRecording = video.status === 'recording';

  const handleClickDelete =
    (video: VideoInfo, deleteType: 'deleteFile' | 'deleteList') => async () => {
      const deleteFile = deleteType === 'deleteFile';
      if (deleteFile && !isCompleted) {
        toast.warn(
          video?.isLive
            ? 'Please delete it after stop recording'
            : 'The file cannot be deleted while downloading. Please erase it yourself.'
        );
        return;
      }

      const deleteApiPath = video.type === 'playlist' ? '/api/playlist/file' : '/api/file';

      const result = await axios
        .delete(deleteApiPath, {
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

      mutate('/api/list');
    };

  const handleMouseLeave = () => {
    if (!isCompleted) {
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
    if (!isCompleted || video?.type === 'playlist') {
      return;
    }
    const videoEl = videoRef.current;
    if (videoEl) {
      try {
        if (!isMobile()) {
          await videoEl?.play?.();
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

    if (!result?.success || result?.error) {
      toast.error(result?.error || 'Retry Failed');
    } else if (result?.success) {
      if (result?.status === 'already') {
        toast.info('Already been downloaded');
      } else if (result?.status === 'downloading') {
        toast.success('Download Retryed');
        mutate('/api/list');
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

  const handleClickVideo = async () => {
    if (video.status !== 'completed') {
      return;
    }
    if (video?.type === 'playlist') {
      setOpenPlaylistView(true);
      return;
    }
    const NOT_SUPPORTED = 'not supported';
    const videoEl = videoRef.current;
    if (videoEl) {
      try {
        if (!isMobile()) {
          try {
            await videoEl?.play?.();
            setNotSupportedCodec(false);
          } catch (e) {
            throw NOT_SUPPORTED;
          }
          if (!videoEl.played) {
            videoEl.pause();
          }
        }
        const openVideo = useVideoPlayerStore.getState().open;
        setMouseEntered(false);
        openVideo(video);
      } catch (e) {
        if (e === NOT_SUPPORTED) {
          setNotSupportedCodec(true);
        }
      }
    }
  };

  const handleClickOpenPlaylistButton = () => {
    setOpenPlaylistView(true);
  };

  const handleClosePlaylistView = () => {
    setOpenPlaylistView(false);
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

      if (initialProgress === nextProgress && initialUpdatedAt === nextUpdatedAt) {
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
          className={classNames(
            'relative flex items-center shrink-0 grow-0 min-w-[100px] max-h-[250px] overflow-hidden aspect-video',
            isCompleted && 'cursor-pointer'
          )}
          onClick={handleClickVideo}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
        >
          <div
            className={classNames(
              'w-full h-full place-items-center bg-black',
              isMouseEntered ? 'flex' : 'hidden'
            )}
          >
            {isCompleted && (
              <video
                key={video.status || 'completed'}
                ref={videoRef}
                className='w-full h-full outline-none'
                src={`/api/file?uuid=${video.uuid}`}
                muted
                playsInline
                preload='none'
              />
            )}
          </div>
          <div
            className={classNames('w-full h-full', isMouseEntered ? 'hidden' : 'block')}
            onClick={handleMouseEnter}
          >
            <figure className='relative w-full h-full bg-black/30'>
              {video.thumbnail && !isThumbnailImageError ? (
                <img
                  className='w-full h-full object-cover'
                  src={
                    isCompleted && video.localThumbnail
                      ? '/api/thumbnail?uuid=' + video.uuid
                      : video.thumbnail
                  }
                  alt={'thumbnail'}
                  onError={handleImageError}
                  loading='lazy'
                />
              ) : (
                <div className='w-full h-full min-h-[100px] flex items-center justify-center text-4xl bg-base-content/5 select-none '>
                  <FcRemoveImage />
                </div>
              )}
              {isNotSupportedCodec && (
                <div
                  className='absolute flex top-0 left-0 items-center text-center w-full h-full overflow-hidden cursor-auto'
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className='w-full bg-black/70 text-white text-sm md:text-base py-2'>
                    {`The file does not exist or cannot be played.`}
                  </div>
                </div>
              )}
            </figure>
            {!isCompleted && (
              <div className='absolute top-0 left-0 w-full h-full flex flex-col p-3 gap-y-2 items-center justify-center bg-black/80 text-2xl text-white dark:text-base-content'>
                {isStandby ? (
                  <span className='font-bold'>Standby</span>
                ) : isFailed ? (
                  <span className='text-rose-400 font-bold'>Failed</span>
                ) : (
                  <LoadingSvg className='text-xl' />
                )}
                {video.createdAt !== video.updatedAt && (
                  <div className='text-xs text-center'>
                    {'Running time ≈'}
                    {numeral((video.updatedAt - video.createdAt) / 1000).format('00:00:00')}
                  </div>
                )}
                {video.download.playlist && (
                  <div className='text-xs text-center'>
                    {video.download.playlist?.current}/{video.download.playlist?.count}
                  </div>
                )}
                <div
                  className={classNames(
                    'text-sm text-center animate-pulse',
                    isFailed && 'overflow-y-auto'
                  )}
                >
                  {isFailed && video.error
                    ? video.error
                    : recommendedDownloadRetry
                    ? "The download doesn't seem to work. Try again with the refresh button below."
                    : `${video.status}...`}
                </div>
              </div>
            )}
          </div>
          {isCompleted && video?.type === 'playlist' && (
            <div className='absolute top-1.5 left-1.5 text-xs text-white bg-black/70 py-0.5 px-1.5 rounded-sm'>
              Playlist {video.download.playlist?.count && `(${video.download.playlist?.count})`}
            </div>
          )}
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
          {!isMouseEntered && video.file.duration && (
            <div className='absolute right-1.5 bottom-1.5 text-xs text-white bg-black/70 py-0.5 px-1.5 rounded-sm'>
              {numeral(video.file.duration).format('00:00:00')}
            </div>
          )}
        </div>
        <div className='card-body grow-0 shrink p-3 overflow-hidden'>
          <h2 className='card-title line-clamp-2 text-base min-h-[3em] mb-2'>
            {video.isLive && isRecording && (
              <div className='inline-flex items-center align-text-top text-xl text-rose-600'>
                <PingSvg />
              </div>
            )}
            <span className={(isStandby || isFailed) && !video.title ? 'text-xs font-normal' : ''}>
              {video.title || video.url}
            </span>
          </h2>
          <div className='flex items-center justify-between'>
            {isStandby || isFailed || !isCompleted ? (
              <div className='dropdown dropdown-top'>
                <label
                  tabIndex={0}
                  className='btn btn-sm btn-outline btn-warning text-lg'
                  title='Delete from List'
                >
                  <MdPlaylistRemove />
                </label>
                <div
                  tabIndex={0}
                  className='dropdown-content mb-1 p-1 bg-warning text-warning-content shadow-md border-rose-500 rounded-md text-xs whitespace-nowrap'
                >
                  <div className='px-1 text-sm'>Delete from List?</div>
                  <button
                    className='btn btn-xs bg-black border-0 !rounded-md dark:!rounded-full normal-case'
                    onClick={handleClickDelete(video, 'deleteList')}
                  >
                    Yes
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className='dropdown dropdown-top'>
                  <label
                    tabIndex={0}
                    className='btn btn-sm btn-outline btn-error text-lg rounded-r-none'
                    title='Delete from List and File'
                  >
                    <MdOutlineVideocamOff />
                  </label>
                  <div
                    tabIndex={0}
                    className='dropdown-content mb-1 p-1 bg-error text-error-content shadow-md border-rose-500 rounded-md text-xs whitespace-nowrap'
                  >
                    <div className='px-1 text-sm'>Delete from List and File?</div>
                    <button
                      className='btn btn-xs bg-black border-0 !rounded-md dark:!rounded-full normal-case'
                      onClick={handleClickDelete(video, 'deleteFile')}
                    >
                      Yes
                    </button>
                  </div>
                </div>
                <div className='dropdown dropdown-top'>
                  <label
                    tabIndex={0}
                    className='btn btn-sm btn-outline btn-warning text-lg rounded-l-none'
                    title='Delete from List'
                  >
                    <MdPlaylistRemove />
                  </label>
                  <div
                    tabIndex={0}
                    className='dropdown-content mb-1 p-1 bg-warning text-warning-content shadow-md border-rose-500 rounded-md text-xs whitespace-nowrap'
                  >
                    <div className='px-1 text-sm'>Delete from List?</div>
                    <button
                      className='btn btn-xs bg-black border-0 !rounded-md dark:!rounded-full normal-case'
                      onClick={handleClickDelete(video, 'deleteList')}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            )}
            {video.isLive && isRecording && (
              <button
                className='btn btn-sm btn-circle btn-outline btn-error text-lg'
                onClick={handleClickStopRecording}
                title='Stop Recording'
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
                title='Open Original Link'
              >
                <TbExternalLink />
              </a>
              {isCompleted ? (
                video.type === 'playlist' ? (
                  <button
                    className='btn btn-sm btn-primary text-xl dark:btn-secondary'
                    disabled={isValidating}
                    onClick={handleClickOpenPlaylistButton}
                  >
                    <CgPlayListSearch />
                  </button>
                ) : (
                  <a
                    className='btn btn-sm btn-primary text-xl dark:btn-secondary'
                    href={isCompleted ? `/api/file?uuid=${video.uuid}&download=true` : ''}
                    rel='noopener noreferrer'
                    target='_blank'
                    download={video?.status === 'completed' ? video.file.name : false}
                    title='Download Video'
                  >
                    <AiOutlineCloudDownload />
                  </a>
                )
              ) : (
                <button
                  className={classNames(
                    'btn btn-sm btn-primary text-lg dark:btn-secondary',
                    recommendedDownloadRetry && 'animate-pulse'
                  )}
                  disabled={isValidating || video?.isLive}
                  onClick={handleClickRestartDownload}
                  title={video?.isLive ? '' : 'Retry Download'}
                >
                  {video?.isLive ? (
                    <AiOutlineCloudDownload />
                  ) : (
                    <VscRefresh className={classNames(isValidating && 'animate-spin')} />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        {isCompleted ? (
          <div className='h-1'></div>
        ) : isStandby ? (
          <div className='h-1 bg-zinc-500/50' />
        ) : isRecording ? (
          <div className='h-1 gradient-background' />
        ) : (
          <progress
            className='progress progress-info w-full h-1'
            value={Number(numeral(video.download.progress).format('0.00') || 0)}
            title={video.download.progress ? `${Number(video.download.progress) * 100}%` : ''}
          />
        )}
      </div>
      {openPlaylistView && video.type === 'playlist' && video.playlist && video.playlist.length && (
        <PlaylistView video={video} onClose={handleClosePlaylistView} />
      )}
    </div>
  );
}, isEqual);

VideoDetailCard.displayName = 'VideoDetailCard';

type PlaylistViewProps = { video: VideoInfo; onClose: () => void };

const PlaylistView = memo(({ video, onClose }: PlaylistViewProps) => {
  const handleEventStopPropagation = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      className='fixed top-0 left-0 flex items-center justify-center w-full h-full bg-base-100/90 dark:bg-base-100/80 backdrop-blur-xl z-10 cursor-pointer'
      onClick={onClose}
    >
      <div
        className='flex flex-col max-w-3xl px-3 sm:px-2 max-h-[80%] mx-auto cursor-auto'
        onClick={handleEventStopPropagation}
      >
        <div className='flex flex-col p-2 rounded-md bg-base-content/10 overflow-y-auto'>
          <div className='flex shrink-0 items-center gap-x-1 text-xl'>
            <div className='flex-auto pl-2 py-1'>
              <span className='font-bold'>{video.title} </span>
              <span className='text-sm'>
                {video.download.playlist?.count && `(${video.download.playlist?.count})`}
              </span>
            </div>
            <a
              className={classNames('btn btn-xs btn-info text-lg', !video.url && 'btn-disabled')}
              href={video.url || ''}
              rel='noopener noreferrer'
              target='_blank'
              title='Open Original Link'
            >
              <TbExternalLink />
            </a>
            <div className='btn shrink-0 btn-xs btn-ghost text-lg' onClick={onClose}>
              <CgClose />
            </div>
          </div>
          <div className='divider shrink-0 mt-0 mb-2'></div>
          <div className='flex flex-col flex-auto gap-y-1 overflow-y-auto'>
            {video.playlist.map((item, i) => {
              if (!item) {
                return (
                  <div
                    key={i}
                    className='flex gap-x-1 p-1 hover:bg-base-content/10 rounded-md text-zinc-500'
                  >
                    <div className='min-w-[2em] shrink-0 text-center font-bold'>{i + 1}</div>
                    <div>No Data</div>
                  </div>
                );
              }

              return (
                <div
                  key={item?.uuid ?? i}
                  className='flex gap-x-1 p-1 hover:bg-base-content/10 rounded-md'
                >
                  <div
                    className={classNames(
                      'min-w-[2em] shrink-0 text-center font-bold',
                      item.error && 'text-error',
                      !item.error && item.isLive && 'text-zinc-500 line-through'
                    )}
                  >
                    {i + 1}
                  </div>
                  <div className='flex-auto'>
                    <div className='line-clamp-3'>
                      {item.error ? (
                        <span className='text-error' title={item.error}>
                          {item.error}
                        </span>
                      ) : item.isLive ? (
                        <span className='text-zinc-500'>Live has been excluded.</span>
                      ) : (
                        <span title={item.name || ''}>{item.name}</span>
                      )}
                    </div>
                  </div>
                  <div className='shrink-0 leading-4'>
                    <a
                      className={classNames(
                        'btn btn-xs btn-info text-lg',
                        !item.url && 'btn-disabled'
                      )}
                      href={item.url || ''}
                      rel='noopener noreferrer'
                      target='_blank'
                      title='Open Item Link'
                    >
                      <TbExternalLink />
                    </a>
                  </div>
                  <div className='shrink-0 leading-4'>
                    <a
                      className={classNames(
                        'btn btn-xs text-xl',
                        item?.error || !item.uuid || !item.path || !item.size || item.isLive
                          ? 'btn-disabled'
                          : 'btn-primary dark:btn-secondary'
                      )}
                      href={`/api/playlist/file?uuid=${video.uuid}&itemUuid=${item.uuid}&itemIndex=${i}&download=true`}
                      rel='noopener noreferrer'
                      target='_blank'
                      download={item.name}
                      title='Download Video'
                    >
                      <AiOutlineCloudDownload />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}, isEqual);

PlaylistView.displayName = 'PlaylistView';
