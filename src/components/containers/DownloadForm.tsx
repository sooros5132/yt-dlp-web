'use client';

import React, { memo, useLayoutEffect, useState, type ChangeEvent } from 'react';
import { mutate } from 'swr';
import { toast } from 'react-toastify';
import { IoClose } from 'react-icons/io5';
import { AiOutlineCloudDownload, AiOutlineLink, AiOutlineSearch } from 'react-icons/ai';
import { HiOutlinePencil } from 'react-icons/hi2';
import { MdContentPaste } from 'react-icons/md';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import queryString from 'query-string';
import type { PlaylistMetadata, SelectQuality, VideoMetadata } from '@/types/video';
import { useDownloadFormStore } from '@/store/downloadForm';
import { CookiesEditor } from '@/components/modules/CookiesEditor';
import { shallow } from 'zustand/shallow';
import { PatternFormat } from 'react-number-format';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  PlaylistDownloadForm,
  VideoDownloadForm
} from '@/components/download-form/OptionalDownloadForm';
import { FcRemoveImage } from 'react-icons/fc';
import { RiArrowUpSLine } from 'react-icons/ri';
import { Divider } from '@/components/Divider';
import { isPropsEquals } from '@/lib/utils';

export function DownloadForm() {
  return <DownloadFormContainer />;
}

export function DownloadFormContainer() {
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
    embedSubs,
    setEmbedChapters,
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
  const [isValidating, setValidating] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | PlaylistMetadata | null>(null);
  const [openCookiesEditor, setOpenCookiesEditor] = useState(false);
  const isNotHydrated = !(useDownloadFormStore.persist?.hasHydrated?.() || false);

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

  const handleChangeUrl = (evt: ChangeEvent<HTMLInputElement>) => {
    setUrl(evt.target.value || '');
  };

  const handleClickCheckBox = () => {
    setEnableDownloadNow(!enableDownloadNow);
  };

  const handleClickUsingCookiesButton = () => {
    setUsingCookies(!usingCookies);
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
            if (['downloading', 'standby'].includes(result?.status)) {
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
              value={url}
              disabled={isNotHydrated}
              placeholder='https://...'
              onChange={handleChangeUrl}
            />
            {typeof window !== 'undefined' && (url || !navigator?.clipboard) ? (
              <Button
                key={'delete-url'}
                type='button'
                variant='outline'
                size='icon'
                disabled={isNotHydrated}
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
                disabled={isNotHydrated}
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
              disabled={isNotHydrated || isValidating}
              title={enableDownloadNow ? 'Download' : 'Search'}
            >
              {enableDownloadNow ? (
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
              checked={enableDownloadNow}
              disabled={isNotHydrated}
              onClick={handleClickCheckBox}
            />
            <span className='text-sm'>Download now in </span>
            <Select
              disabled={isNotHydrated}
              value={selectQuality}
              onValueChange={handleChangeSelectQuality}
            >
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
              checked={usingCookies}
              disabled={isNotHydrated}
              onClick={handleClickUsingCookiesButton}
            />
            <span className='text-sm'>Using Cookies</span>
          </Label>
          <AlertDialog open={openCookiesEditor} onOpenChange={handleChangeCookiesEditor}>
            <AlertDialogTrigger
              disabled={isNotHydrated}
              type='button'
              className='flex items-center text-sm h-auto p-0.5'
            >
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
                  checked={enableOutputFilename}
                  disabled={isNotHydrated}
                  onClick={handleClickEnableOutputFilenameCheckbox}
                />
                <span className='text-sm'>Output file name</span>
              </Label>
              <div className='flex items-center ml-auto sm:ml-0'>
                <Input
                  className='h-auto max-w-[160px] px-1 py-0.5 leading-[1]'
                  name='outputFileName'
                  value={!enableOutputFilename ? '' : outputFilename}
                  disabled={!enableOutputFilename}
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
                  checked={sliceByTime}
                  disabled={isNotHydrated}
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
                  value={!sliceByTime ? '' : sliceStartTime}
                  disabled={!sliceByTime}
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
                  value={!sliceByTime ? '' : sliceEndTime}
                  disabled={!sliceByTime}
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
                disabled={isNotHydrated}
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
                disabled={isNotHydrated}
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
              disabled={isNotHydrated}
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
              disabled={isNotHydrated}
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
      {!isValidating && videoMetadata && (
        <section>
          <Divider className='mt-4 mb-6'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='border-primary bg-transparent rounded-full opacity-80 gap-x-1'
              onClick={handleClickCloseSearchResultButton}
            >
              <RiArrowUpSLine />
              Close
            </Button>
          </Divider>
          {videoMetadata?.type === 'video' ? (
            <div className='mb-2'>
              <SearchedMetadataCard
                key={`${videoMetadata?.id || Date.now()}-video-metadata`}
                metadata={videoMetadata}
              />
              <VideoDownloadForm
                key={`${videoMetadata?.id || Date.now()}-video-download`}
                metadata={videoMetadata}
              />
            </div>
          ) : videoMetadata?.type === 'playlist' ? (
            <div className='mb-2'>
              <SearchedMetadataCard
                key={`${videoMetadata?.id || Date.now()}-playlist-metadata`}
                metadata={videoMetadata as unknown as VideoMetadata}
              />
              <PlaylistDownloadForm
                key={`${videoMetadata?.id || Date.now()}-playlist-download`}
                metadata={videoMetadata as PlaylistMetadata}
              />
            </div>
          ) : null}
        </section>
      )}
    </Card>
  );
}

type SearchedMetadataCardProps = {
  metadata: VideoMetadata;
};

const SearchedMetadataCard = memo(({ metadata }: SearchedMetadataCardProps) => {
  const [isImageError, setImageError] = useState(false);

  return (
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
  );
}, isPropsEquals);

SearchedMetadataCard.displayName = 'SearchedMetadataCard';
