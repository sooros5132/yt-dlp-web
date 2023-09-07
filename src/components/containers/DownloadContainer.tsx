'use client';

import React, { memo, useLayoutEffect, useState, type ChangeEvent, FormEvent } from 'react';
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

type AllMetadata = VideoMetadata | PlaylistMetadata | null;

export function DownloadContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [videoMetadata, setVideoMetadata] = useState<AllMetadata>(null);

  const { enableDownloadNow, isFetching, setFetching, url, setUrl } = useDownloadFormStore(
    ({ enableDownloadNow, isFetching, setFetching, url, setUrl }) => ({
      enableDownloadNow,
      isFetching,
      setFetching,
      url,
      setUrl
    }),
    shallow
  );

  const handleCloseMetadata = () => {
    setVideoMetadata(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isFetching) {
      return;
    }

    if (!url || !/^https?:\/?\/?/i.test(url)) {
      toast.warn('Please check url format \nex) https://www.youtube.com/xxxxx', {
        autoClose: 5000
      });
      return;
    }
    setFetching(true);
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
      setFetching(false);
    }
  };

  useLayoutEffect(() => {
    const initUrl = searchParams.get('url');
    if (initUrl) {
      setUrl(initUrl);
    }

    setTimeout(async () => {
      if (isFetching) {
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

          setFetching(true);
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
          setFetching(false);
        }
      }
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className='my-8 px-4 py-2 border-none shadow-md'>
      <DownloadForm onSubmit={handleSubmit} />
      {!isFetching && videoMetadata && (
        <SearchResult videoMetadata={videoMetadata} onClose={handleCloseMetadata} />
      )}
    </Card>
  );
}

type DownloadFormProps = {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const DownloadForm = memo(({ onSubmit }: DownloadFormProps) => {
  return (
    <form className='flex flex-col py-2 gap-y-2' method='GET' onSubmit={onSubmit}>
      <UrlFieldOption />
      <DownloadNowOption />
      <CookieOption />
      <Card className='p-2 rounded-md bg-card-nested border-none'>
        <CardDescription className='text-warning-foreground text-sm mb-1'>
          The options below are excluded for <b>livestreams</b> and <b>playlist</b> downloads.
        </CardDescription>
        <div className='flex flex-col gap-y-2'>
          <FileNameOption />
          <CutVideoOption />
          <EmbedSubtitlesOption />
          <EmbedChapterMarkersOption />
        </div>
      </Card>
      <LiveFromStartOption />
      <ProxyOption />
    </form>
  );
}, isPropsEquals);

DownloadForm.displayName = 'DownloadForm';

const UrlFieldOption = () => {
  const { hydrated, isFetching, enableDownloadNow, url, setUrl } = useDownloadFormStore(
    ({ hydrated, isFetching, enableDownloadNow, url, setUrl }) => ({
      hydrated,
      isFetching,
      enableDownloadNow,
      url,
      setUrl
    }),
    shallow
  );
  const isNotHydrated = !hydrated;

  const handleChangeUrl = (evt: ChangeEvent<HTMLInputElement>) => {
    setUrl(evt.target.value || '');
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

  return (
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
          disabled={isNotHydrated || isFetching}
          title={enableDownloadNow ? 'Download' : 'Search'}
        >
          {enableDownloadNow ? (
            <>
              {isFetching ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <AiOutlineCloudDownload />
              )}
              <span>Download</span>
            </>
          ) : (
            <>
              {isFetching ? <Loader2 className='h-4 w-4 animate-spin' /> : <AiOutlineSearch />}
              <span>Search</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

const DownloadNowOption = () => {
  const { hydrated, enableDownloadNow, selectQuality, setEnableDownloadNow, setSelectQuality } =
    useDownloadFormStore(
      ({ hydrated, enableDownloadNow, selectQuality, setEnableDownloadNow, setSelectQuality }) => ({
        hydrated,
        enableDownloadNow,
        selectQuality,
        setEnableDownloadNow,
        setSelectQuality
      }),
      shallow
    );
  const isNotHydrated = !hydrated;

  const handleChangeSelectQuality = (quality: SelectQuality) => {
    if (!isNotHydrated) {
      setSelectQuality(quality);
    }
  };

  const handleClickCheckBox = () => {
    setEnableDownloadNow(!enableDownloadNow);
  };

  return (
    <Label
      className='flex items-center pl-1 gap-x-1 cursor-pointer'
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
        value={isNotHydrated ? 'best' : selectQuality}
        disabled={isNotHydrated}
        onValueChange={handleChangeSelectQuality}
      >
        <SelectTrigger className='w-auto h-auto py-1 px-2'>
          <SelectValue placeholder='Select a quality' />
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
  );
};

const CookieOption = () => {
  const { hydrated, usingCookies, setUsingCookies } = useDownloadFormStore(
    ({ hydrated, usingCookies, setUsingCookies }) => ({
      hydrated,
      usingCookies,
      setUsingCookies
    }),
    shallow
  );
  const [openCookiesEditor, setOpenCookiesEditor] = useState(false);
  const isNotHydrated = !hydrated;

  const handleClickUsingCookiesButton = () => {
    setUsingCookies(!usingCookies);
  };

  const handleCloseCookiesEditor = () => {
    setOpenCookiesEditor(false);
  };
  const handleChangeCookiesEditor = (open: boolean) => {
    setOpenCookiesEditor(open);
  };

  return (
    <div className='flex items-center'>
      <Label className='flex items-center pl-1 gap-x-1 cursor-pointer' title='Using Cookies'>
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
        <AlertDialogContent className='min-w-[300px] max-w-3xl max-h-full bg-card overflow-auto outline-none'>
          <CookiesEditor open={openCookiesEditor} onClose={handleCloseCookiesEditor} />
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const FileNameOption = () => {
  const {
    hydrated,
    enableOutputFilename,
    outputFilename,
    setOutputFilename,
    setEnableOutputFilename
  } = useDownloadFormStore(
    ({
      hydrated,
      enableOutputFilename,
      outputFilename,
      setOutputFilename,
      setEnableOutputFilename
    }) => ({
      hydrated,
      enableOutputFilename,
      outputFilename,
      setOutputFilename,
      setEnableOutputFilename
    }),
    shallow
  );
  const isNotHydrated = !hydrated;

  const handleClickEnableOutputFilenameCheckbox = () => {
    setEnableOutputFilename(!enableOutputFilename);
  };

  const handleChangeOutputFilename = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value || '';
    setOutputFilename(value);
  };

  return (
    <div className='flex items-center gap-x-1 flex-wrap'>
      <Label
        className='flex items-center pl-1 gap-x-1 shrink-0 cursor-pointer'
        title='Enable Output Filename'
      >
        <Checkbox
          name='enableOutputFilename'
          checked={enableOutputFilename}
          disabled={isNotHydrated}
          onClick={handleClickEnableOutputFilenameCheckbox}
        />
        <span className='text-sm'>Output filename</span>
      </Label>
      <div className='flex items-center ml-auto sm:ml-0 lg:ml-auto'>
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
  );
};

const CutVideoOption = () => {
  const {
    hydrated,
    cutVideo,
    cutStartTime,
    cutEndTime,
    enableForceKeyFramesAtCuts,
    setCutVideo,
    setCutStartTime,
    setCutEndTime,
    setForceKeyFramesAtCuts
  } = useDownloadFormStore(
    ({
      hydrated,
      cutVideo,
      cutStartTime,
      cutEndTime,
      setCutVideo,
      setCutStartTime,
      setCutEndTime,
      enableForceKeyFramesAtCuts,
      setForceKeyFramesAtCuts
    }) => ({
      hydrated,
      cutVideo,
      cutStartTime,
      cutEndTime,
      setCutVideo,
      setCutStartTime,
      setCutEndTime,
      enableForceKeyFramesAtCuts,
      setForceKeyFramesAtCuts
    }),
    shallow
  );
  const isNotHydrated = !hydrated;

  const handleClickCutsByTimeCheckbox = () => {
    setCutVideo(!cutVideo);
  };

  const handleChangeCutsStartTime = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value || '';
    setCutStartTime(value);
  };

  const handleChangeCutsEndTime = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value || '';
    setCutEndTime(value);
  };

  const handleClickForceKeyFramesAtCutsCheckbox = () => {
    setForceKeyFramesAtCuts(!enableForceKeyFramesAtCuts);
  };

  return (
    <div>
      <div className='flex flex-wrap items-center gap-x-1'>
        <Label className='flex items-center pl-1 gap-x-1 shrink-0 cursor-pointer' title='Cut video'>
          <Checkbox
            name='cutVideo'
            checked={cutVideo}
            disabled={isNotHydrated}
            onClick={handleClickCutsByTimeCheckbox}
          />
          <span className='text-sm'>Cut video</span>{' '}
        </Label>
        <div className='flex items-center ml-auto sm:ml-0 lg:ml-auto'>
          <PatternFormat
            displayType='input'
            customInput={Input}
            className='h-auto max-w-[100px] px-1 py-0.5 leading-[1]'
            name='cutStartTime'
            value={!cutVideo ? '' : cutStartTime}
            disabled={!cutVideo}
            title='Start Time'
            onChange={handleChangeCutsStartTime}
            format='##:##:##.##'
            placeholder='00:00:00.00'
            mask='_'
          />
          <span>~</span>
          <PatternFormat
            displayType='input'
            customInput={Input}
            className='h-auto max-w-[100px] px-1 py-0.5 leading-[1]'
            name='cutEndTime'
            value={!cutVideo ? '' : cutEndTime}
            disabled={!cutVideo}
            title='End Time'
            onChange={handleChangeCutsEndTime}
            format='##:##:##.##'
            placeholder='00:00:00.00'
            mask='_'
          />
        </div>
      </div>
      {hydrated && cutVideo && (
        <div className='flex flex-col pl-5 gap-y-1 text-sm'>
          <div className='text-warning-foreground'>
            You chose the cut video option! This can cause the video and audio to be{' '}
            <b>out of sync</b>. Enabling the &quot;Force key frames at cuts&quot; option can bring
            them into sync, but <b>this is very slow.</b>
          </div>
          <Label
            className='inline-flex items-center pl-1 gap-x-1 shrink-0 cursor-pointer'
            title='Force key frames at cuts'
          >
            <Checkbox
              name='enableForceKeyFramesAtCuts'
              checked={enableForceKeyFramesAtCuts}
              disabled={isNotHydrated}
              onClick={handleClickForceKeyFramesAtCutsCheckbox}
            />
            <span>Force key frames at cuts</span>
          </Label>
        </div>
      )}
    </div>
  );
};

const EmbedSubtitlesOption = () => {
  const { hydrated, embedSubs, setEmbedSubs } = useDownloadFormStore(
    ({ hydrated, embedSubs, setEmbedSubs }) => ({
      hydrated,
      embedSubs,
      setEmbedSubs
    }),
    shallow
  );
  const isNotHydrated = !hydrated;

  const handleClickEmbedSubsCheckbox = () => {
    setEmbedSubs(!embedSubs);
  };

  return (
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
  );
};

const EmbedChapterMarkersOption = () => {
  const { hydrated, embedChapters, setEmbedChapters } = useDownloadFormStore(
    ({ hydrated, embedChapters, setEmbedChapters }) => ({
      hydrated,
      embedChapters,
      setEmbedChapters
    }),
    shallow
  );
  const isNotHydrated = !hydrated;

  const handleClickEmbedChaptersCheckbox = () => {
    setEmbedChapters(!embedChapters);
  };

  return (
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
  );
};

const LiveFromStartOption = () => {
  const { hydrated, enableLiveFromStart, setEnableLiveFromStart } = useDownloadFormStore(
    ({ hydrated, enableLiveFromStart, setEnableLiveFromStart }) => ({
      hydrated,
      enableLiveFromStart,
      setEnableLiveFromStart
    }),
    shallow
  );
  const isNotHydrated = !hydrated;

  const handleClickEnableLiveFromStart = () => {
    setEnableLiveFromStart(!enableLiveFromStart);
  };

  return (
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
  );
};

const ProxyOption = () => {
  const { hydrated, enableProxy, proxyAddress, setEnableProxy, setProxyAddress } =
    useDownloadFormStore(
      ({ hydrated, enableProxy, proxyAddress, setEnableProxy, setProxyAddress }) => ({
        hydrated,
        enableProxy,
        proxyAddress,
        setEnableProxy,
        setProxyAddress
      }),
      shallow
    );
  const isNotHydrated = !hydrated;

  const handleClickEnableProxyCheckbox = () => {
    setEnableProxy(!enableProxy);
  };

  const handleChangeProxyServer = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value || '';
    setProxyAddress(value);
  };

  return (
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
  );
};

type SearchResultProps = {
  videoMetadata: AllMetadata;
  onClose: () => void;
};

const SearchResult = ({ videoMetadata, onClose }: SearchResultProps) => {
  return (
    <section>
      <Divider className='mt-4 mb-6'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='border-primary bg-transparent rounded-full opacity-80 gap-x-1'
          onClick={onClose}
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
  );
};

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
