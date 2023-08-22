'use client';

import { memo, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import useSWR, { mutate } from 'swr';
import numeral from 'numeral';
import isEqual from 'react-fast-compare';
import { toast } from 'react-toastify';
import { useVideoPlayerStore } from '@/store/videoPlayer';
import { LoadingSvg } from '@/components/LoadingSvg';
import { PingSvg } from '@/components/PingSvg';
import { isMobile } from '@/client/utils';
import { FcRemoveImage } from 'react-icons/fc';
import { AiOutlineCloudDownload } from 'react-icons/ai';
import { VscRefresh, VscWarning } from 'react-icons/vsc';
import { MdOutlineVideocamOff, MdPlaylistRemove, MdStop } from 'react-icons/md';
import { CgClose, CgPlayListSearch } from 'react-icons/cg';
import type { VideoInfo } from '@/types/video';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { LayoutList, LinkIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './ui/dialog';
import { Progress } from './ui/progress';
import { Divider } from './Divider';

const MAX_INTERVAL_Time = 120 * 1000;
const MIN_INTERVAL_Time = 3 * 1000;

type LayoutMode = 'table' | 'grid';

export function VideoList({ videoList }: { videoList: VideoInfo[] }) {
  const refreshIntervalTimeRef = useRef(MIN_INTERVAL_Time);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');

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

  return (
    <Card className='my-8 p-4 overflow-hidden border-none shadow-md'>
      <VideoListHeader
        isValidating={isValidating}
        layoutMode={layoutMode}
        setLayoutMode={setLayoutMode}
      />
      {videos && <VideoListContent layoutMode={layoutMode} videos={videos} />}
    </Card>
  );
}

type VideoListHeaderProps = {
  isValidating: boolean;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
};

const VideoListHeader = ({ isValidating, layoutMode, setLayoutMode }: VideoListHeaderProps) => {
  const handleClickRefreshButton = async () => {
    await mutate('/api/list');
  };

  const handleClickChangeLayoutButton = (mode: LayoutMode) => () => {
    setLayoutMode(mode);
  };

  return (
    <div className='flex justify-between items-center mb-4'>
      <div className='flex items-center'>
        <h1 className='text-center text-3xl font-bold'>Videos</h1>
        <Button
          variant='ghost'
          size='icon'
          className='text-2xl'
          disabled={isValidating}
          onClick={handleClickRefreshButton}
        >
          <VscRefresh className={isValidating ? 'animate-spin' : undefined} />
        </Button>
      </div>
      <div className='flex items-center border-join'>
        <Button
          variant='ghost'
          size='icon'
          className={cn(
            'h-auto py-2 text-lg',
            layoutMode === 'table' &&
              'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
          )}
          onClick={handleClickChangeLayoutButton('table')}
        >
          <LayoutList size='1em' />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          className={cn(
            'h-auto py-2 text-lg',
            layoutMode === 'grid' &&
              'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
          )}
          onClick={handleClickChangeLayoutButton('grid')}
        >
          {/**
           * lucide-react에서 grid관련 아이콘들이 import되지 않음
           */}
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='1em'
            height='1em'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            stroke-width='2'
            stroke-linecap='round'
            stroke-linejoin='round'
            className='lucide lucide-grid-2x2'
          >
            <rect width='18' height='18' x='3' y='3' rx='2' />
            <path d='M3 12h18' />
            <path d='M12 3v18' />
          </svg>
        </Button>
      </div>
    </div>
  );
};

type VideoListContentProps = {
  layoutMode: LayoutMode;
  videos: Array<VideoInfo>;
};

const VideoListContent = ({ layoutMode, videos }: VideoListContentProps) => {
  if (!videos || !videos?.length) {
    return (
      <div className='py-10 text-3xl text-center text-muted-foreground opacity-50 select-none'>
        List is empty
      </div>
    );
  }

  switch (layoutMode) {
    case 'table': {
      return (
        <>
          {videos.map((video) => (
            <VideoTableItem key={video.uuid} video={video} />
          ))}
        </>
      );
    }
    case 'grid': {
      return (
        <div className='grid gap-x-3 gap-y-6 grid-cols-1 sm:gap-5 sm:grid-cols-2'>
          {videos.map((video) => (
            <VideoGridItem key={video.uuid} video={video} />
          ))}
        </div>
      );
    }
    default: {
      return <div>Not Supported</div>;
    }
  }
};

const VideoTableItem = memo(({ video }: { video: VideoInfo }) => {
  return <></>;
}, isEqual);
VideoTableItem.displayName = 'VideoTableItem';

const VideoGridItem = memo(({ video }: { video: VideoInfo }) => {
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

  const [openDeleteList, setOpenDeleteList] = useState(false);
  const [openDeleteFile, setOpenDeleteFile] = useState(false);

  const handleCloseDeleteList = () => {
    setOpenDeleteList(false);
  };

  const handleChangeDeleteList = (open: boolean) => {
    setOpenDeleteList(open);
  };

  const handleCloseDeleteFile = () => {
    setOpenDeleteFile(false);
  };

  const handleChangeDeleteFile = (open: boolean) => {
    setOpenDeleteFile(open);
  };

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
          handleCloseDeleteFile();
        } else {
          toast.success('Deleted from list. (File will be retained)');
          handleCloseDeleteList();
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
      <Card className='bg-card-nested flex flex-col rounded-xl overflow-hidden border-none'>
        <div
          className={cn(
            'relative flex items-center shrink-0 grow-0 min-w-[100px] max-h-[250px] overflow-hidden aspect-video',
            isCompleted && 'cursor-pointer'
          )}
          onClick={handleClickVideo}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
        >
          <div
            className={cn(
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
            className={cn('w-full h-full', isMouseEntered ? 'hidden' : 'block')}
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
                  <span className='text-error-foreground font-bold'>Failed</span>
                ) : recommendedDownloadRetry ? (
                  <VscWarning className='text-3xl text-yellow-500' />
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
                  className={cn(
                    'text-sm text-center animate-pulse',
                    isFailed && 'overflow-y-auto',
                    video.sliceByTime && video.download.ffmpeg && 'whitespace-pre-wrap'
                  )}
                >
                  {isFailed && video.error
                    ? video.error
                    : recommendedDownloadRetry
                    ? "The download doesn't seem to work. Try again with the refresh button below."
                    : video.status === 'downloading' && video.sliceByTime && video.download.ffmpeg
                    ? `${video.download.ffmpeg.time} downloaded...
encode speed ${video.download.ffmpeg.speed}`
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
        <div className='grow-0 shrink p-2 overflow-hidden'>
          <h2 className='line-clamp-2 text-base min-h-[3em] mb-2' title={video.title || undefined}>
            {video.isLive && isRecording && (
              <div className='inline-flex items-center align-text-top text-xl text-error-foreground'>
                <PingSvg />
              </div>
            )}
            <span className={(isStandby || isFailed) && !video.title ? 'text-xs font-normal' : ''}>
              {video.title || video.url}
            </span>
          </h2>
          <div className='flex items-center justify-between px-1'>
            <div className={cn(!(isStandby || isFailed || !isCompleted) && 'border-join')}>
              {!(isStandby || isFailed || !isCompleted) && (
                <Dialog open={openDeleteFile} onOpenChange={handleChangeDeleteFile}>
                  <DialogTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                      borderCurrentColor
                      className='h-[1.7em] text-lg text-error-foreground hover:text-error-foreground/90'
                      title='Delete from List and File'
                    >
                      <MdOutlineVideocamOff />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Do you want to delete item and files?</DialogTitle>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant='outline' size='sm' onClick={handleCloseDeleteFile}>
                        No
                      </Button>
                      <Button
                        size='sm'
                        className='bg-error hover:bg-error/90 text-foreground'
                        onClick={handleClickDelete(video, 'deleteFile')}
                      >
                        Yes
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              <Dialog open={openDeleteList} onOpenChange={handleChangeDeleteList}>
                <DialogTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    borderCurrentColor
                    className={cn(
                      'h-[1.7em] text-lg text-warning hover:text-warning/90',
                      (isStandby || isFailed || !isCompleted) && 'rounded-xl'
                    )}
                    title='Delete from List'
                  >
                    <MdPlaylistRemove />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Do you want to delete the item?</DialogTitle>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant='outline' size='sm' onClick={handleCloseDeleteList}>
                      No
                    </Button>
                    <Button
                      size='sm'
                      className='bg-yellow-300 hover:bg-yellow-300/90'
                      onClick={handleClickDelete(video, 'deleteList')}
                    >
                      Yes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {video.isLive && isRecording && (
              <Button
                variant='outline'
                borderCurrentColor
                size='icon'
                className='w-[1.7em] h-[1.7em] rounded-full text-error-foreground hover:text-error-foreground/90 text-lg'
                onClick={handleClickStopRecording}
                title='Stop Recording'
              >
                <MdStop />
              </Button>
            )}
            <div className='flex items-center'>
              <a
                href={video.url || ''}
                rel='noopener noreferrer'
                target='_blank'
                title='Open Original Link'
              >
                <Button
                  size='sm'
                  className='h-[1.7em] text-lg bg-info hover:bg-info/90 rounded-xl rounded-r-none'
                >
                  <LinkIcon className='text-base' size='1em' />
                </Button>
              </a>
              {isCompleted ? (
                video.type === 'playlist' ? (
                  <Button
                    size='sm'
                    className='h-[1.7em] text-lg rounded-xl rounded-l-none'
                    disabled={isValidating}
                    onClick={handleClickOpenPlaylistButton}
                  >
                    <CgPlayListSearch />
                  </Button>
                ) : (
                  <a
                    href={isCompleted ? `/api/file?uuid=${video.uuid}&download=true` : ''}
                    rel='noopener noreferrer'
                    target='_blank'
                    download={video?.status === 'completed' ? video.file.name : false}
                    title='Download Video'
                  >
                    <Button size='sm' className='h-[1.7em] text-lg rounded-xl rounded-l-none'>
                      <AiOutlineCloudDownload />
                    </Button>
                  </a>
                )
              ) : (
                <div className={cn(recommendedDownloadRetry && 'animate-pulse')}>
                  <Button
                    size='sm'
                    className={'h-[1.7em] text-lg rounded-xl rounded-l-none'}
                    disabled={isValidating || video?.isLive}
                    onClick={handleClickRestartDownload}
                    title={video?.isLive ? '' : 'Retry Download'}
                  >
                    {video?.isLive ? (
                      <AiOutlineCloudDownload />
                    ) : (
                      <VscRefresh className={cn(isValidating && 'animate-spin')} />
                    )}
                  </Button>
                </div>
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
          <Progress
            className='w-full h-1'
            value={Number(numeral(video.download.progress).format('0.00') || 0) * 100}
            title={video.download.progress ? `${Number(video.download.progress) * 100}%` : ''}
          />
        )}
      </Card>
      {video.type === 'playlist' && video.playlist && video.playlist.length && (
        <PlaylistViewDialog
          open={openPlaylistView}
          video={video}
          onClose={handleClosePlaylistView}
        />
      )}
    </div>
  );
}, isEqual);

VideoGridItem.displayName = 'VideoGridItem';

type PlaylistViewDialogProps = { open: boolean; video: VideoInfo; onClose: () => void };

const PlaylistViewDialog = memo(({ open, video, onClose }: PlaylistViewDialogProps) => {
  const handleEventStopPropagation = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const handleChangeOpen = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleChangeOpen}>
      <DialogContent className='max-w-3xl max-h-full flex flex-col'>
        <div className='flex flex-col overflow-hidden' onClick={handleEventStopPropagation}>
          <DialogTitle className='flex-auto pl-2 py-1 text-xl'>
            <a
              className='inline-flex gap-x-1 items-center hover:underline'
              href={video.url || ''}
              rel='noopener noreferrer'
              target='_blank'
              title='Open Original Link'
            >
              <LinkIcon className='inline shrink-0 text-base' size='1em' />
              <span className='font-bold line-clamp-2'>{video.title} </span>
              <span className='text-sm shrink-0'>
                {video.download.playlist?.count && `(${video.download.playlist?.count})`}
              </span>
            </a>
          </DialogTitle>
          <Divider className='shrink-0 mt-0 mb-2' />
          <div className='flex flex-col flex-auto gap-y-1 overflow-y-auto'>
            {video.playlist.map((item, i) => {
              if (!item) {
                return (
                  <div
                    key={i}
                    className='flex gap-x-1 p-1 hover:bg-foreground/10 rounded-md text-muted-foreground'
                  >
                    <div className='min-w-[2em] shrink-0 text-center font-bold'>{i + 1}</div>
                    <div>No Data</div>
                  </div>
                );
              }

              return (
                <div
                  key={item?.uuid ?? i}
                  className='flex gap-x-1 p-1 hover:bg-foreground/10 rounded-md'
                >
                  <div
                    className={cn(
                      'min-w-[2em] shrink-0 text-center font-bold',
                      item.error && 'text-error-foreground',
                      !item.error && item.isLive && 'text-muted-foreground line-through'
                    )}
                  >
                    {i + 1}
                  </div>
                  <div className='flex items-center justify-between gap-x-1 flex-auto'>
                    <div className='line-clamp-3 shrink'>
                      {item.error ? (
                        <span className='text-error-foreground' title={item.error}>
                          {item.error}
                        </span>
                      ) : item.isLive ? (
                        <span className='text-muted-foreground'>Live has been excluded.</span>
                      ) : (
                        <span title={item.name || ''}>{item.name}</span>
                      )}
                    </div>
                    <span className='shrink-0'>
                      {item.size && numeral(item.size).format('0.0b')}
                    </span>
                  </div>
                  <div className='flex items-center shrink-0 leading-4'>
                    <a
                      href={item.url || ''}
                      className={cn(!item.url && 'pointer-events-none')}
                      rel='noopener noreferrer'
                      target='_blank'
                      title='Open Item Link'
                    >
                      <Button
                        size='sm'
                        className='h-[1.5em] text-lg bg-info hover:bg-info/90 rounded-xl rounded-r-none'
                      >
                        <LinkIcon className='text-base' size='1em' />
                      </Button>
                    </a>
                    <a
                      className={cn(
                        (item?.error || !item.uuid || !item.path || !item.size || item.isLive) &&
                          'opacity-30 pointer-events-none'
                      )}
                      href={`/api/playlist/file?uuid=${video.uuid}&itemUuid=${item.uuid}&itemIndex=${i}&download=true`}
                      rel='noopener noreferrer'
                      target='_blank'
                      download={item.name}
                      title='Download Video'
                    >
                      <Button size='sm' className='h-[1.5em] text-lg rounded-xl rounded-l-none'>
                        <AiOutlineCloudDownload />
                      </Button>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}, isEqual);

PlaylistViewDialog.displayName = 'PlaylistViewDialog';
