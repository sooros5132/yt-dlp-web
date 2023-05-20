'use client';

import axios from 'axios';
import classNames from 'classnames';
import React, { FormEvent, memo, useLayoutEffect, useState } from 'react';
import { mutate } from 'swr';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'react-toastify';
import numeral from 'numeral';
import isEquals from 'react-fast-compare';
import { useSiteSettingStore } from '@/store/siteSetting';
import { PingSvg } from '@/components/PingSvg';
import { IoClose } from 'react-icons/io5';
import { AiOutlineCloudDownload, AiOutlineLink, AiOutlineSearch } from 'react-icons/ai';
import { FcRemoveImage } from 'react-icons/fc';
import { HiOutlineBarsArrowDown, HiOutlineBarsArrowUp, HiOutlinePencil } from 'react-icons/hi2';
import {
  MdContentPaste,
  MdOutlineKeyboardArrowDown,
  MdOutlineKeyboardArrowUp
} from 'react-icons/md';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import queryString from 'query-string';
import type { ChangeEvent } from 'react';
import type { PlaylistMetadata, VideoFormat, VideoMetadata } from '@/types/video';
import { useDownloadFormStore } from '@/store/downloadForm';
import { CookiesEditor } from './CookiesEditor';

export function DownloadForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const {
    setUrl,
    disableBestFormat,
    enableBestFormat,
    enabledBestFormat,
    url,
    usingCookies,
    setUsingCookies
  } = useDownloadFormStore();
  const { hydrated } = useSiteSettingStore();
  const [isValidating, setValidating] = useState(false);
  const [openMoreOptions, setOpenMoreOptions] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | PlaylistMetadata | null>(null);

  const handleChangeUrl = (evt: ChangeEvent<HTMLInputElement>) => {
    setUrl(evt.target.value || '');
  };

  const handleChangeCheckBox = (evt: ChangeEvent<HTMLInputElement>) => {
    if (evt.target.checked) {
      enableBestFormat();
    } else {
      disableBestFormat();
    }
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
      if (enabledBestFormat) {
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

  const handleClickEditCookiesButton = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    useSiteSettingStore.getState().setOpenCookiesEditor(true);
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
    <div className='px-4 py-2 rounded-lg bg-base-content/5'>
      <form className='[&>div]:my-2' method='GET' onSubmit={handleSubmit}>
        <div className='input input-sm flex justify-between h-auto pr-1 focus:outline-none'>
          <input
            name='url'
            type='text'
            className={classNames(
              'bg-base-100 flex-auto outline-none',
              !hydrated && 'input-disabled'
            )}
            readOnly={!hydrated}
            value={url}
            placeholder='https://...'
            onChange={handleChangeUrl}
          />
          {!hydrated || url || !navigator?.clipboard ? (
            <button
              key={'delete-url'}
              type='button'
              className='btn btn-sm btn-circle btn-ghost text-xl text-zinc-400'
              onClick={handleClickDeleteUrlButton}
            >
              <IoClose />
            </button>
          ) : (
            <button
              key={'paste-url'}
              type='button'
              className='btn btn-sm btn-circle btn-ghost text-lg text-zinc-400'
              onClick={handleClickPasteClipboardButton}
            >
              <MdContentPaste />
            </button>
          )}
        </div>
        <div>
          <div>
            <label className='inline-flex items-center pl-1 gap-x-1 cursor-pointer'>
              <input
                className='checkbox checkbox-xs rounded-md'
                name='enabledBestFormat'
                type='checkbox'
                checked={!hydrated ? true : enabledBestFormat}
                readOnly={!hydrated}
                onChange={handleChangeCheckBox}
              />
              <span className='text-sm'>Download immediately in the best quality</span>
            </label>
          </div>
          <div className='flex items-center'>
            <label className='inline-flex items-center pl-1 gap-x-1 cursor-pointer'>
              <input
                className='checkbox checkbox-xs rounded-md'
                name='usingCookies'
                type='checkbox'
                checked={!hydrated ? false : usingCookies}
                readOnly={!hydrated}
                onChange={handleClickUsingCookiesButton}
              />
              <span className='text-sm'>Using Cookies</span>
            </label>
            <button
              className='btn btn-xs w-[20px] h-[20px] min-w-[20px] min-h-[20px] btn-circle btn-ghost'
              onClick={handleClickEditCookiesButton}
            >
              <HiOutlinePencil />
            </button>
          </div>
        </div>
        <div className='text-right'>
          <button
            className={classNames(
              'btn btn-sm btn-primary px-3 normal-case gap-x-1',
              !hydrated && 'btn-disabled',
              isValidating && 'loading'
            )}
            disabled={!hydrated}
            type='submit'
            title={!hydrated || enabledBestFormat ? 'Download' : 'Search'}
          >
            {!hydrated || enabledBestFormat ? (
              <>
                <AiOutlineCloudDownload />
                <span>Download</span>
              </>
            ) : (
              <>
                <AiOutlineSearch />
                <span>Search</span>
              </>
            )}
          </button>
        </div>
      </form>
      {openMoreOptions && (
        <div>
          <CookiesEditor />
        </div>
      )}
      {!isValidating && videoMetadata ? (
        videoMetadata?.type === 'video' ? (
          <div className='mb-2'>
            <SearchedVideoMetadata
              key={`${videoMetadata?.id || Date.now()}-video-metadata`}
              metadata={videoMetadata}
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
            />
            <PlaylistDownload
              key={`${videoMetadata?.id || Date.now()}-playlist-download`}
              metadata={videoMetadata as PlaylistMetadata}
            />
          </div>
        ) : null
      ) : null}
      <CookiesEditor />
    </div>
  );
}

type SearchedVideoMetadataProps = { metadata: VideoMetadata };

const SearchedVideoMetadata = memo(({ metadata }: SearchedVideoMetadataProps) => {
  const [isImageError, setImageError] = useState(false);

  return (
    <section>
      <div className='divider my-4' />
      <div className='card card-side bg-base-100 shadow-xl rounded-xl flex-col sm:flex-row-reverse sm:h-[220px] overflow-hidden'>
        <div className='flex items-center basis-[40%] shrink-0 grow-0 min-w-[100px] max-h-[220px] overflow-hidden sm:max-w-[40%]'>
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
            <div className='w-full h-full min-h-[100px] flex items-center justify-center text-4xl bg-base-content/5 select-none '>
              <FcRemoveImage />
            </div>
          )}
        </div>
        <div className='card-body basis-[60%] grow shrink p-4 overflow-hidden'>
          <h2 className='card-title line-clamp-2'>{metadata.title}</h2>
          <p className='line-clamp-3 grow-0 text-sm text-base-content/60'>{metadata.description}</p>
          <div className='mt-auto line-clamp-2 break-all text-base-content/60'>
            <a
              className='link link-hover text-sm'
              href={metadata.originalUrl}
              rel='noopener noreferrer'
              target='_blank'
            >
              <AiOutlineLink className='inline' />
              {metadata.originalUrl}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}, isEquals);

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
        <button
          className={classNames(
            'btn btn-sm btn-primary normal-case h-auto',
            isValidating && 'loading',
            metadata.isLive && 'text-white gradient-background border-0'
          )}
          onClick={handleClickBestButton}
          title='Download immediately in the best quality'
        >
          {metadata.isLive && (
            <div className='inline-flex items-center align-text-top text-xl text-rose-600'>
              <PingSvg />
            </div>
          )}
          BEST: {bestVideo} {bestVideo && bestAudio && '+'} {bestAudio}
        </button>
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
                    background: 'linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.25))'
                  }
                : undefined
            }
          >
            <div className='mb-6 divider select-none'>
              <button
                type='button'
                className='btn btn-sm btn-primary btn-outline opacity-80 gap-x-2 text-md normal-case'
                onClick={() => setOpen((prev) => !prev)}
                title={isOpen ? 'Close format list' : 'Open format list'}
              >
                Optional
                {isOpen ? (
                  <HiOutlineBarsArrowUp className='inline' />
                ) : (
                  <HiOutlineBarsArrowDown className='inline' />
                )}
              </button>
            </div>
            <div className={classNames(!isOpen && 'pointer-events-none select-none opacity-60')}>
              <div className='flex flex-wrap gap-2 sm:flex-nowrap'>
                <div className='basis-full shrink overflow-hidden sm:basis-1/2'>
                  <div>
                    <b>{metadata.isLive ? 'Stream' : 'Video'}</b>
                  </div>
                  {videoFormat.map((format) => (
                    <VideoDownloadRadio
                      key={format.formatId}
                      type='video'
                      isBest={false}
                      format={format}
                      onClickRadio={handleClickRadio}
                    />
                  ))}
                </div>
                <div className='hidden divider divider-horizontal shrink-0 sm:flex' />
                <div className='basis-full shrink overflow-hidden sm:basis-1/2'>
                  <div>
                    <b>Audio</b>
                  </div>
                  {audioFormat.map((format) => (
                    <VideoDownloadRadio
                      key={format.formatId}
                      type='audio'
                      isBest={false}
                      format={format}
                      onClickRadio={handleClickRadio}
                    />
                  ))}
                </div>
              </div>
              <div className='my-4 text-center'>
                <button
                  className={classNames(
                    'btn btn-sm btn-primary btn-info px-3 normal-case',
                    isValidating && 'loading',
                    metadata.isLive && 'text-white gradient-background border-0'
                  )}
                  type='submit'
                  title='Download with selected option'
                >
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
                </button>
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
    <div className='group form-control my-1 whitespace-nowrap'>
      <label
        className='flex items-center px-1 gap-x-1 cursor-pointer rounded-md hover:bg-base-content/10'
        onClick={onClickRadio(type, format)}
      >
        <input
          type='radio'
          name={`${type}Id`}
          value={format.formatId}
          className='radio radio-xs shrink-0'
          defaultChecked={false}
        />
        <span className='shrink text-sm overflow-hidden text-ellipsis'>{content}</span>
        {format?.filesize && (
          <span className='ml-auto shrink-0 text-sm overflow-hidden'>
            {numeral(format.filesize).format('0.0b')}
          </span>
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
        <button
          className={classNames(
            'btn btn-sm btn-primary normal-case my-2',
            isValidating && 'loading'
          )}
          onClick={handleClickDownloadButton}
        >
          Download Playlist
        </button>
      </div>
    </div>
  );
}, isEquals);

PlaylistDownload.displayName = 'PlaylistDownload';
