'use client';

import React, { FormEvent, memo, useLayoutEffect, useState } from 'react';
import { mutate } from 'swr';
import { toast } from 'react-toastify';
import numeral from 'numeral';
import isEquals from 'react-fast-compare';
import { useSiteSettingStore } from '@/store/siteSetting';
import { PingSvg } from '@/components/PingSvg';
import { IoClose } from 'react-icons/io5';
import { AiOutlineCloudDownload, AiOutlineLink, AiOutlineSearch } from 'react-icons/ai';
import { FcRemoveImage } from 'react-icons/fc';
import { HiOutlineBarsArrowDown, HiOutlineBarsArrowUp, HiOutlinePencil } from 'react-icons/hi2';
import { MdContentPaste } from 'react-icons/md';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import queryString from 'query-string';
import type { ChangeEvent } from 'react';
import type { PlaylistMetadata, SelectQuality, VideoFormat, VideoMetadata } from '@/types/video';
import { useDownloadFormStore } from '@/store/downloadForm';
import { CookiesEditor } from './CookiesEditor';
import { shallow } from 'zustand/shallow';
import { PatternFormat } from 'react-number-format';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Loader2 } from 'lucide-react';
import { Divider } from './Divider';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from './ui/alert-dialog';
import { BsLink45Deg } from 'react-icons/bs';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { RiArrowUpSLine } from 'react-icons/ri';

export function DownloadForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const {
    enableDownloadNow,
    url,
    usingCookies,
    setUrl,
    setEnableDownloadNow,
    setUsingCookies,
    embedChapters,
    // embedMetadata,
    embedSubs,
    setEmbedChapters,
    // setEmbedMetadata,
    setEmbedSubs,
    enableProxy,
    proxyAddress,
    setEnableProxy,
    setProxyAddress,
    enableLiveFromStart,
    setEnableLiveFromStart,
    setSliceByTime,
    sliceByTime,
    setSliceStartTime,
    sliceStartTime,
    setSliceEndTime,
    sliceEndTime,
    enableOutputFilename,
    outputFilename,
    setOutputFilename,
    setEnableOutputFilename,
    selectQuality,
    setSelectQuality
  } = useDownloadFormStore((state) => state, shallow);

  const handleClickEmbedChaptersCheckbox = () => {
    setEmbedChapters(!embedChapters);
  };

  const handleClickEmbedSubsCheckbox = () => {
    setEmbedSubs(!embedSubs);
  };

  const handleClickEnableProxyCheckbox = () => {
    setEnableProxy(!enableProxy);
  };

  const handleClickEnableLiveFromStart = () => {
    setEnableLiveFromStart(!enableLiveFromStart);
  };

  const handleChangeProxyServer = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value || '';
    setProxyAddress(value);
  };

  const handleClickSliceByTimeCheckbox = () => {
    setSliceByTime(!sliceByTime);
  };
  const handleChangeSliceStartTime = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value || '';
    setSliceStartTime(value);
  };

  const handleChangeSliceEndTime = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value || '';
    setSliceEndTime(value);
  };

  const handleClickEnableOutputFilenameCheckbox = () => {
    setEnableOutputFilename(!enableOutputFilename);
  };

  const handleChangeOutputFilename = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value || '';
    setOutputFilename(value);
  };

  const handleChangeSelectQuality = (quality: SelectQuality) => {
    setSelectQuality(quality);
  };

  const { hydrated } = useSiteSettingStore();
  const [isValidating, setValidating] = useState(false);
  const [openMoreOptions, setOpenMoreOptions] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | PlaylistMetadata | null>(null);
  const [openCookiesEditor, setOpenCookiesEditor] = useState(false);

  const handleChangeUrl = (evt: ChangeEvent<HTMLInputElement>) => {
    setUrl(evt.target.value || '');
  };

  const handleClickCheckBox = () => {
    setEnableDownloadNow(!enableDownloadNow);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isValidating) {
      return;
    }

    if (!url || !/^https?:\/?\/?/i.test(url)) {
      toast.warn('Please check url format \nex) https://www.youtube.com/xxxxx', {
        autoClose: 5000
      });
      return;
    }
    setValidating(true);
    setVideoMetadata(null);
    const { getMetadata, requestDownload } = useDownloadFormStore.getState();
    try {
      if (enableDownloadNow) {
        const result = await requestDownload();

        if (result?.error) {
          toast.error(result?.error || 'Download Failed');
        } else if (result?.success) {
          if (result?.status === 'already') {
            toast.info('Already been downloaded');
            return;
          }
          if (result?.status === 'standby') {
            toast.success('Download Requested!');
          } else if (result?.status === 'downloading') {
            toast.success('Download Requested!');
          } else if (result?.status === 'restart') {
            toast.success('Download Restart');
          }
          mutate('/api/list');
        }

        return;
      } else {
        const metadata = await getMetadata();
        if (metadata?.error) {
          toast.error(metadata?.error || 'search failed');
        } else if (metadata?.id) {
          setVideoMetadata(metadata);
        }
        return;
      }
    } finally {
      setValidating(false);
    }
  };

  const handleClickDeleteUrlButton = () => {
    setUrl('');
  };

  const handleClickPasteClipboardButton = async () => {
    if (!navigator?.clipboard) {
      return;
    }
    const clipText = await navigator.clipboard.readText();
    setUrl(clipText);
  };

  const handleClickUsingCookiesButton = () => {
    setUsingCookies(!usingCookies);
  };

  const handleClickMoreOptionsButton = () => {
    setOpenMoreOptions((prev) => !prev);
  };
  const handleCloseCookiesEditor = () => {
    setOpenCookiesEditor(false);
  };
  const handleChangeCookiesEditor = (open: boolean) => {
    setOpenCookiesEditor(open);
  };

  const handleClickCloseSearchResultButton = () => {
    setVideoMetadata(null);
  };

  useLayoutEffect(() => {
    const initUrl = searchParams.get('url');
    if (initUrl) {
      setUrl(initUrl);
    }

    setTimeout(async () => {
      if (isValidating) {
        return;
      }
      const isDownload = searchParams.get('download') === 'true';
      if (isDownload) {
        if (!initUrl || !/^https?:\/?\/?/i.test(initUrl)) {
          return;
        }

        try {
          const { url, download, ..._newQueryString } = queryString.parse(searchParams.toString());
          const newQueryString = queryString.stringify(_newQueryString);

          setValidating(true);
          router.replace(`${pathname}?${newQueryString}`);
          const result = await useDownloadFormStore.getState().requestDownload();

          if (result?.error) {
            toast.error(result?.error || 'Download Failed');
          } else if (result?.success) {
            if (result?.status === 'already') {
              toast.info('Already been downloaded');
              return;
            }
            if (result?.status === 'standby') {
              toast.success('Download Requested!');
            } else if (result?.status === 'downloading') {
              toast.success('Download Requested!');
            } else if (result?.status === 'restart') {
              toast.success('Download Restart');
            }

            mutate('/api/list');
          }
        } finally {
          setValidating(false);
        }
      }
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className='my-8 px-4 py-2 border-none shadow-md'>
      <form className='flex flex-col py-2 gap-y-2' method='GET' onSubmit={handleSubmit}>
        <div className='flex justify-between gap-x-2'>
          <div className='flex items-center justify-between rounded-full shadow-sm flex-auto'>
            <Input
              name='url'
              type='text'
              className='flex-auto rounded-full rounded-r-none border-none'
              disabled={!hydrated}
              readOnly={!hydrated}
              value={url}
              placeholder='https://...'
              onChange={handleChangeUrl}
            />
            {!hydrated || url || !navigator?.clipboard ? (
              <Button
                key={'delete-url'}
                type='button'
                variant='outline'
                size='icon'
                disabled={!hydrated}
                className='text-xl rounded-full rounded-l-none border-none text-muted-foreground hover:text-muted-foreground'
                onClick={handleClickDeleteUrlButton}
              >
                <IoClose />
              </Button>
            ) : (
              <Button
                key={'paste-url'}
                type='button'
                variant='outline'
                size='icon'
                disabled={!hydrated}
                className='text-lg rounded-full rounded-l-none border-none text-muted-foreground hover:text-muted-foreground'
                onClick={handleClickPasteClipboardButton}
              >
                <MdContentPaste />
              </Button>
            )}
          </div>
          <div className='flex items-center justify-end'>
            <Button
              type='submit'
              size='sm'
              className='px-3 gap-x-1'
              disabled={!hydrated || isValidating}
              title={!hydrated || enableDownloadNow ? 'Download' : 'Search'}
            >
              {!hydrated || enableDownloadNow ? (
                <>
                  {isValidating ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <AiOutlineCloudDownload />
                  )}
                  <span>Download</span>
                </>
              ) : (
                <>
                  {isValidating ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <AiOutlineSearch />
                  )}
                  <span>Search</span>
                </>
              )}
            </Button>
          </div>
        </div>
        <div className='flex items-center'>
          <Label
            className='inline-flex items-center pl-1 gap-x-1 cursor-pointer'
            title='Download immediately in the best quality'
          >
            <Checkbox
              name='enableDownloadNow'
              checked={!hydrated ? true : enableDownloadNow}
              disabled={!hydrated}
              onClick={handleClickCheckBox}
            />
            <span className='text-sm'>Download now in </span>
            <Select value={selectQuality} onValueChange={handleChangeSelectQuality}>
              <SelectTrigger className='w-auto h-auto py-1 px-2'>
                <SelectValue placeholder='Select a fruit' />
              </SelectTrigger>
              <SelectContent align='end'>
                <SelectGroup>
                  <SelectLabel>Quality</SelectLabel>
                  <SelectItem value='best'>best</SelectItem>
                  <SelectItem value='4320p'>4320p</SelectItem>
                  <SelectItem value='2160p'>2160p</SelectItem>
                  <SelectItem value='1440p'>1440p</SelectItem>
                  <SelectItem value='1080p'>1080p</SelectItem>
                  <SelectItem value='720p'>720p</SelectItem>
                  <SelectItem value='480p'>480p</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            quality
          </Label>
        </div>
        <div className='flex items-center'>
          <Label
            className='inline-flex items-center pl-1 gap-x-1 cursor-pointer'
            title='Using Cookies'
          >
            <Checkbox
              name='usingCookies'
              checked={!hydrated ? false : usingCookies}
              disabled={!hydrated}
              onClick={handleClickUsingCookiesButton}
            />
            <span className='text-sm'>Using Cookies</span>
          </Label>
          <AlertDialog open={openCookiesEditor} onOpenChange={handleChangeCookiesEditor}>
            <AlertDialogTrigger type='button' className='flex items-center text-sm h-auto p-0.5'>
              <HiOutlinePencil />
            </AlertDialogTrigger>
            <AlertDialogContent className='min-w-[300px] max-w-3xl max-h-full bg-card overflow-auto'>
              <CookiesEditor open={openCookiesEditor} onClose={handleCloseCookiesEditor} />
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <Card className='p-2 rounded-md bg-card-nested border-none'>
          <CardDescription className='text-warning-foreground text-sm mb-1'>
            The options below are excluded for <b>livestreams</b> and <b>playlist</b> downloads.
          </CardDescription>
          <div className='flex flex-col gap-y-2'>
            <div className='flex items-center gap-x-1 flex-wrap'>
              <Label
                className='inline-flex items-center pl-1 gap-x-1 shrink-0 cursor-pointer'
                title='Enable Output Filename'
              >
                <Checkbox
                  name='enableOutputFilename'
                  checked={hydrated ? enableOutputFilename : false}
                  disabled={!hydrated}
                  onClick={handleClickEnableOutputFilenameCheckbox}
                />
                <span className='text-sm'>Output file name</span>
              </Label>
              <div className='flex items-center ml-auto sm:ml-0'>
                <Input
                  className='h-auto max-w-[160px] px-1 py-0.5 leading-[1]'
                  name='outputFileName'
                  value={!hydrated || !enableOutputFilename ? '' : outputFilename}
                  disabled={hydrated ? !enableOutputFilename : false}
                  placeholder='%(title)s (%(id)s)'
                  title='Output file name'
                  onChange={handleChangeOutputFilename}
                />
                <Input
                  className='h-auto max-w-[70px] px-1 py-0.5 leading-[1] text-muted-foreground'
                  defaultValue={'.%(ext)s'}
                  readOnly
                  onChange={handleChangeOutputFilename}
                  onClick={() => {
                    toast.info("You can't change the extension.");
                  }}
                />
              </div>
            </div>
            <div className='flex flex-wrap items-center gap-x-1 leading-[1]'>
              <Label
                className='inline-flex items-center pl-1 gap-x-1 shrink-0 cursor-pointer'
                title='Slice by Time'
              >
                <Checkbox
                  name='sliceByTime'
                  checked={hydrated ? sliceByTime : false}
                  disabled={!hydrated}
                  onClick={handleClickSliceByTimeCheckbox}
                />
                <span className='text-sm'>Slice by Time</span>{' '}
              </Label>
              <div className='flex items-center ml-auto sm:ml-0'>
                <PatternFormat
                  displayType='input'
                  customInput={Input}
                  className='h-auto max-w-[100px] px-1 py-0.5 leading-[1]'
                  name='sliceStartTime'
                  value={!hydrated || !sliceByTime ? '' : sliceStartTime}
                  disabled={hydrated ? !sliceByTime : false}
                  title='Start Time'
                  onChange={handleChangeSliceStartTime}
                  format='##:##:##.##'
                  placeholder='00:00:00.00'
                  mask='_'
                />
                <span>~</span>
                <PatternFormat
                  displayType='input'
                  customInput={Input}
                  className='h-auto max-w-[100px] px-1 py-0.5 leading-[1]'
                  name='sliceEndTime'
                  value={!hydrated || !sliceByTime ? '' : sliceEndTime}
                  disabled={hydrated ? !sliceByTime : false}
                  title='End Time'
                  onChange={handleChangeSliceEndTime}
                  format='##:##:##.##'
                  placeholder='00:00:00.00'
                  mask='_'
                />
              </div>
            </div>
            <Label
              className='inline-flex items-center w-fit pl-1 gap-x-1 cursor-pointer'
              title='Embed Subs'
            >
              <Checkbox
                name='embedSubs'
                checked={embedSubs}
                disabled={!hydrated}
                onClick={handleClickEmbedSubsCheckbox}
              />
              <span className='text-sm'>Embed subtitles</span>
            </Label>
            <Label
              className='inline-flex items-center w-fit pl-1 gap-x-1 cursor-pointer'
              title='Embed Chapters'
            >
              <Checkbox
                name='embedChapters'
                checked={embedChapters}
                disabled={!hydrated}
                onClick={handleClickEmbedChaptersCheckbox}
              />
              <span className='text-sm'>Embed chapter markers</span>
            </Label>
          </div>
        </Card>
        <div className='flex items-center'>
          <Label
            className='inline-flex items-center pl-1 gap-x-1 cursor-pointer'
            title='Enable Live From Start'
          >
            <Checkbox
              name='enableLiveFromStart'
              checked={enableLiveFromStart}
              disabled={!hydrated}
              onClick={handleClickEnableLiveFromStart}
            />
            <span className='text-sm'>
              Download livestreams from the start. Only supported for YouTube.(Experimental)
            </span>
          </Label>
        </div>
        <div className='flex items-center gap-x-1'>
          <Label
            className='inline-flex items-center pl-1 gap-x-1 shrink-0 cursor-pointer'
            title='Enable Proxy'
          >
            <Checkbox
              name='enableProxy'
              checked={enableProxy}
              disabled={!hydrated}
              onClick={handleClickEnableProxyCheckbox}
            />
            <span className='text-sm'>Enable Proxy</span>
          </Label>
          <Input
            className='h-auto max-w-[300px] px-1 py-0.5 leading-[1]'
            name='proxyAddress'
            value={!enableProxy ? '' : proxyAddress}
            disabled={!enableProxy}
            placeholder='Proxy Address HTTP/HTTPS/SOCKS'
            title='Proxy Address HTTP/HTTPS/SOCKS'
            onChange={handleChangeProxyServer}
          />
        </div>
      </form>
      {!isValidating && videoMetadata ? (
        videoMetadata?.type === 'video' ? (
          <div className='mb-2'>
            <SearchedVideoMetadata
              key={`${videoMetadata?.id || Date.now()}-video-metadata`}
              metadata={videoMetadata}
              onClickCloseSearchResultButton={handleClickCloseSearchResultButton}
            />
            <VideoDownload
              key={`${videoMetadata?.id || Date.now()}-video-download`}
              metadata={videoMetadata}
            />
          </div>
        ) : videoMetadata?.type === 'playlist' ? (
          <div className='mb-2'>
            <SearchedVideoMetadata
              key={`${videoMetadata?.id || Date.now()}-playlist-metadata`}
              metadata={videoMetadata as unknown as VideoMetadata}
              onClickCloseSearchResultButton={handleClickCloseSearchResultButton}
            />
            <PlaylistDownload
              key={`${videoMetadata?.id || Date.now()}-playlist-download`}
              metadata={videoMetadata as PlaylistMetadata}
            />
          </div>
        ) : null
      ) : null}
    </Card>
  );
}

type SearchedVideoMetadataProps = {
  metadata: VideoMetadata;
  onClickCloseSearchResultButton: () => void;
};

const SearchedVideoMetadata = memo(
  ({ metadata, onClickCloseSearchResultButton }: SearchedVideoMetadataProps) => {
    const [isImageError, setImageError] = useState(false);

    return (
      <section>
        <Divider className='mt-4 mb-6'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='border-primary bg-transparent rounded-full opacity-80 gap-x-1'
            onClick={onClickCloseSearchResultButton}
          >
            <RiArrowUpSLine />
            Close
          </Button>
        </Divider>
        <Card className='flex flex-col bg-card-nested rounded-xl border-none overflow-hidden sm:flex-row-reverse sm:h-[220px] lg:flex-col lg:h-auto'>
          <div className='flex items-center basis-[40%] shrink-0 grow-0 min-w-[100px] max-h-[220px] overflow-hidden sm:max-w-[40%] lg:max-w-none'>
            {!isImageError && metadata.thumbnail ? (
              <figure className='w-full h-full'>
                <img
                  className='w-full h-full object-cover'
                  src={metadata.thumbnail}
                  alt={'thumbnail'}
                  onError={() => setImageError(true)}
                />
              </figure>
            ) : (
              <div className='w-full h-full min-h-[100px] flex items-center justify-center text-4xl select-none bg-neutral-950/10 dark:bg-neutral-950/20'>
                <FcRemoveImage />
              </div>
            )}
          </div>
          <CardContent className='flex flex-col basis-[60%] grow shrink p-4 gap-y-1 overflow-hidden'>
            <CardTitle className='text-lg line-clamp-2' title={metadata.title}>
              {metadata.title}
            </CardTitle>
            <p
              className='line-clamp-3 grow-0 text-sm text-muted-foreground'
              title={metadata.description}
            >
              {metadata.description}
            </p>
            <CardDescription className='mt-auto line-clamp-2 break-all'>
              <a href={metadata.originalUrl} rel='noopener noreferrer' target='_blank'>
                <AiOutlineLink className='inline' />
                {metadata.originalUrl}
              </a>
            </CardDescription>
          </CardContent>
        </Card>
      </section>
    );
  },
  isEquals
);

SearchedVideoMetadata.displayName = 'SearchedVideoMetadata';

type VideoDownloadProps = { metadata: VideoMetadata };

const VideoDownload = memo(({ metadata }: VideoDownloadProps) => {
  const audioFormat: Array<VideoFormat> = [];
  const videoFormat: Array<VideoFormat> = [];
  for (const format of metadata?.formats) {
    if (format.resolution === 'audio only') {
      audioFormat.unshift(format);
    } else if (format.videoExt !== 'none') {
      videoFormat.unshift(format);
    }
  }
  const [isOpen, setOpen] = useState(false);
  const [isValidating, setValidating] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState<any>({
    audio: null,
    video: null
  });

  const handleClickRadio = (type: 'audio' | 'video', format: any) => () => {
    if (!['audio', 'video'].includes(type) || !format) {
      return;
    }
    if (selectedFormats[type] === format) {
      return;
    }
    setSelectedFormats((prev: any) => ({
      ...prev,
      [type]: format
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isValidating) {
      return;
    }
    if (!selectedFormats.video && !selectedFormats.audio) {
      toast.warn('Please select a formats');
      return;
    }
    await requestDownload({
      url: metadata.originalUrl,
      videoId: selectedFormats?.video?.formatId,
      audioId: selectedFormats?.audio?.formatId
    });
  };

  const handleClickBestButton = async () => {
    await requestDownload({
      url: metadata.originalUrl
    });
  };

  const requestDownload = async (params: { url: string; videoId?: string; audioId?: string }) => {
    if (isValidating) {
      return;
    }
    setValidating(true);
    const { requestDownload } = useDownloadFormStore.getState();
    try {
      const result = await requestDownload(params);

      if (result?.error) {
        toast.error(result?.error || 'Download Failed');
      } else if (result?.success) {
        if (result?.status === 'already') {
          toast.info('Already been downloaded');
          return;
        }
        if (result?.status === 'standby') {
          toast.success('Download requested!');
        } else if (result?.status === 'downloading') {
          toast.success('Download requested!');
        } else if (result?.status === 'restart') {
          toast.success('Download restart');
        }
        mutate('/api/list');
      }
    } catch (e) {}
    setValidating(false);
  };
  let bestVideo = metadata.best?.height ? metadata.best?.height + 'p' : metadata.best?.resolution;
  if (metadata.best?.fps) bestVideo += ' ' + metadata.best?.fps + 'fps';
  if (metadata.best?.dynamicRange) bestVideo += ' ' + metadata.best?.dynamicRange;
  if (metadata.best?.vcodec) bestVideo += ' ' + metadata.best?.vcodec;

  let bestAudio = metadata.best?.acodec;

  let selectVideo = selectedFormats?.video?.height
    ? selectedFormats?.video?.height + 'p'
    : selectedFormats?.video?.resolution;
  if (selectedFormats?.video?.dynamicRange)
    selectVideo += ' ' + selectedFormats?.video?.dynamicRange;
  if (selectedFormats?.video?.fps) selectVideo += ' ' + selectedFormats?.video?.fps + 'fps';
  if (selectedFormats?.video?.vcodec) selectVideo += ' ' + selectedFormats?.video?.vcodec;

  return (
    <section className='my-6 mb-2'>
      <div className='text-center'>
        <Button
          className={cn(
            'rounded-full',
            metadata.isLive && 'text-white gradient-background border-0'
          )}
          size='sm'
          onClick={handleClickBestButton}
          title='Download immediately in the best quality'
          disabled={isValidating}
        >
          {isValidating && <Loader2 className='h-4 w-4 animate-spin' />}
          {metadata.isLive && (
            <div className='inline-flex items-center align-text-top text-xl text-rose-600'>
              <PingSvg />
            </div>
          )}
          BEST: {bestVideo} {bestVideo && bestAudio && '+'} {bestAudio}
        </Button>
        {metadata.isLive && (
          <div className='mt-1 text-center text-xs text-base-content/60'>Live Stream!</div>
        )}
      </div>
      <div className={'pt-6'}>
        {audioFormat.length || videoFormat.length ? (
          <form
            onSubmit={handleSubmit}
            className='rounded-b-md'
            style={
              !isOpen
                ? {
                    maxHeight: 120,
                    overflow: 'hidden',
                    background: 'linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.15))'
                  }
                : undefined
            }
          >
            <Divider className='mb-4 select-none'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='border-primary bg-transparent rounded-full opacity-80 gap-x-1'
                onClick={() => setOpen((prev) => !prev)}
                title={isOpen ? 'Close format list' : 'Open format list'}
              >
                {isOpen ? (
                  <HiOutlineBarsArrowUp className='inline' />
                ) : (
                  <HiOutlineBarsArrowDown className='inline' />
                )}
                Optional
              </Button>
            </Divider>
            <div className={cn(!isOpen && 'pointer-events-none select-none opacity-60')}>
              <div className='flex flex-wrap gap-2 sm:flex-nowrap lg:flex-wrap'>
                <div className='basis-full shrink overflow-hidden sm:basis-1/2 lg:basis-full'>
                  <div>
                    <b>{metadata.isLive ? 'Stream' : 'Video'}</b>
                  </div>
                  {/* grid는 너비 오류가 생김. flex로 변경 */}
                  <RadioGroup className='flex flex-col gap-0'>
                    {videoFormat.map((format) => (
                      <VideoDownloadRadio
                        key={format.formatId}
                        type='video'
                        isBest={false}
                        format={format}
                        onClickRadio={handleClickRadio}
                      />
                    ))}
                  </RadioGroup>
                </div>
                <Divider variant='horizontal' className='hidden sm:flex' />
                <div className='basis-full shrink overflow-hidden sm:basis-1/2 lg:basis-full'>
                  <div>
                    <b>Audio</b>
                  </div>
                  {/* grid는 너비 오류가 생김. flex로 변경 */}
                  <RadioGroup className='flex flex-col gap-0'>
                    {audioFormat.map((format) => (
                      <VideoDownloadRadio
                        key={format.formatId}
                        type='audio'
                        isBest={false}
                        format={format}
                        onClickRadio={handleClickRadio}
                      />
                    ))}
                  </RadioGroup>
                </div>
              </div>
              <div className='my-4 text-center'>
                <Button
                  className={cn(
                    'bg-info rounded-full hover:bg-info/90 px-3',
                    metadata.isLive && 'text-white gradient-background border-0'
                  )}
                  size='sm'
                  type='submit'
                  title='Download with selected option'
                  disabled={isValidating}
                >
                  {isValidating && <Loader2 className='h-4 w-4 animate-spin' />}
                  {metadata.isLive && (
                    <div className='inline-flex items-center align-text-top text-xl text-rose-600'>
                      <PingSvg />
                    </div>
                  )}
                  {selectVideo}
                  {selectVideo && selectedFormats?.audio ? '+' : null}
                  {selectedFormats?.audio?.formatId && selectedFormats?.audio?.acodec}
                  {!selectedFormats?.video && !selectedFormats?.audio ? (
                    <span> Optional Download</span>
                  ) : null}
                </Button>
                <div className='text-xs text-muted-foreground'>Optional Download</div>
              </div>
            </div>
          </form>
        ) : null}
      </div>
    </section>
  );
}, isEquals);
VideoDownload.displayName = 'VideoDownload';

type VideoDownloadRadioProps = {
  isBest: boolean;
  type: 'audio' | 'video';
  format: VideoFormat;
  content?: string;
  onClickRadio: (type: 'audio' | 'video', format: any) => () => void;
};

const VideoDownloadRadio = ({
  type,
  isBest,
  content: _content,
  format,
  onClickRadio
}: VideoDownloadRadioProps) => {
  const content = (function () {
    if (isBest) {
      return _content;
    }

    switch (type) {
      case 'audio': {
        return `${format.formatNote || format.formatId} ${format.acodec}`;
      }
      case 'video': {
        let text = format.height ? format.height + 'p' : format.resolution;
        if (format.fps) text += ' ' + format.fps + 'fps';
        if (format.dynamicRange) text += ' ' + format.dynamicRange;
        if (format.vcodec) text += ' ' + format.vcodec;

        return text;
      }
    }
  })();

  return (
    <div className='my-0.5 whitespace-nowrap'>
      <label
        className='flex items-center px-1 gap-x-1 cursor-pointer rounded-md hover:bg-foreground/5'
        onClick={onClickRadio(type, format)}
      >
        <RadioGroupItem
          value={format.formatId}
          id={format.formatId}
          defaultChecked={false}
          className='shrink-0'
        />
        <span className='grow shrink text-sm overflow-hidden text-ellipsis'>{content}</span>
        {format?.filesize && (
          <span className='shrink-0 text-sm overflow-hidden'>
            {numeral(format.filesize).format('0.0b')}
          </span>
        )}
        {format?.url && (
          <a
            className='shrink-0 text-right'
            href={format.url}
            rel='noopener noreferrer'
            target='_blank'
            title='Open Original Media Url'
          >
            <BsLink45Deg />
          </a>
        )}
      </label>
    </div>
  );
};

type PlaylistDownloadProps = {
  metadata: PlaylistMetadata;
};

const PlaylistDownload = memo(({ metadata }: PlaylistDownloadProps) => {
  const [isValidating, setValidating] = useState(false);

  const handleClickDownloadButton = async () => {
    if (isValidating || !metadata?.originalUrl) {
      return;
    }
    setValidating(true);
    const { requestDownload } = useDownloadFormStore.getState();
    try {
      const result = await requestDownload({ url: metadata.originalUrl });

      if (result?.error) {
        toast.error(result?.error || 'Download Failed');
      } else if (result?.success) {
        if (result?.status === 'already') {
          toast.info('Already been downloaded');
          return;
        }
        if (result?.status === 'standby') {
          toast.success('Download requested!');
        } else if (result?.status === 'downloading') {
          toast.success('Download requested!');
        } else if (result?.status === 'restart') {
          toast.success('Download restart');
        }
        mutate('/api/list');
      }
    } catch (e) {}
    setValidating(false);
  };

  return (
    <div className='my-2'>
      <div className='text-zinc-400 text-sm text-center'>
        <p>This url is a playlist.</p>
        <p>Live is excluded and all are downloaded in the best quality.</p>
        <Button
          size='sm'
          className={cn('rounded-full my-2', isValidating && 'loading')}
          onClick={handleClickDownloadButton}
        >
          Download&nbsp;<b>{metadata?.playlistCount}</b>&nbsp;items from a playlist
        </Button>
      </div>
    </div>
  );
}, isEquals);

PlaylistDownload.displayName = 'PlaylistDownload';
