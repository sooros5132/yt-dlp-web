'use client';

import axios from 'axios';
import classNames from 'classnames';
import React, { FormEvent, memo, useState } from 'react';
import { ChangeEvent } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AiOutlineCloudDownload, AiOutlineLink, AiOutlineSearch } from 'react-icons/ai';
import { toast } from 'react-toastify';
import { FcRemoveImage } from 'react-icons/fc';
import { HiOutlineBarsArrowDown, HiOutlineBarsArrowUp } from 'react-icons/hi2';
import numeral from 'numeral';
import isEquals from 'react-fast-compare';
import { useSiteSettingStore } from '@/store/siteSetting';
import { mutate } from 'swr';
import { VideoFormat, VideoMetadata } from '@/types/video';
import { PingSvg } from './PingSvg';

interface State {
  url: string;
  enabledBestFormat: boolean;
}

interface Store extends State {
  changeUrl: (url: string) => void;
  enableBestFormat: () => void;
  disableBestFormat: () => void;
}

const initialState: State = {
  url: '',
  enabledBestFormat: true
};

const useStore = create(
  persist<Store>(
    (set, get) => ({
      ...initialState,
      changeUrl(url) {
        set({
          url
        });
      },
      enableBestFormat() {
        set({
          enabledBestFormat: true
        });
      },
      disableBestFormat() {
        set({
          enabledBestFormat: false
        });
      }
    }),
    {
      name: 'downloadForm',
      storage: createJSONStorage(() => localStorage),
      version: 0.1,
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => ['enabledBestFormat'].includes(key))
        ) as Store
    }
  )
);

export function DownloadForm() {
  const { changeUrl, disableBestFormat, enableBestFormat, enabledBestFormat, url } = useStore();
  const { hydrated } = useSiteSettingStore();
  const [isValidating, setValidating] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);

  const handleChangeUrl = (evt: ChangeEvent<HTMLInputElement>) => {
    changeUrl(evt.target.value || '');
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
    try {
      if (enabledBestFormat) {
        const result = await axios
          .get('/api/d', {
            params: {
              url
            }
          })
          .then((res) => res.data)
          .catch((res) => res.response.data);
        if (result?.error) {
          toast.error(result?.error || 'download failed');
        } else if (result?.success) {
          if (result?.status === 'already') {
            toast.info('already been downloaded');
          } else if (result?.status === 'downloading') {
            mutate('/api/list');
            toast.success('download requested!');
          } else if (result?.status === 'restart') {
            mutate('/api/list');
            toast.success('download restart');
          }
        }
        return;
      } else {
        const metadata = await axios
          .get('/api/info', {
            params: {
              url
            }
          })
          .then((res) => res.data)
          .catch((res) => res.response.data);
        if (metadata?.error) {
          toast.error(metadata?.error || 'search failed');
        } else if (metadata?.id) {
          setVideoMetadata(metadata);
        }
      }
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className='px-4 py-2 rounded-lg bg-base-content/5'>
      <form className='[&>div]:my-2' method='GET' onSubmit={handleSubmit}>
        <div>
          <input
            name='url'
            type='text'
            className={classNames('w-full input input-sm', !hydrated && 'input-disabled')}
            readOnly={!hydrated}
            value={url}
            placeholder='https://...'
            onChange={handleChangeUrl}
          />
        </div>
        <div>
          <label className='inline-flex items-center pl-1 gap-x-1 cursor-pointer'>
            <input
              className='checkbox checkbox-xs'
              name='enabledBestFormat'
              type='checkbox'
              checked={!hydrated ? true : enabledBestFormat}
              readOnly={!hydrated}
              onChange={handleChangeCheckBox}
            />
            <span className='text-sm'>Download at the best quality</span>
          </label>
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
      {!isValidating && videoMetadata ? (
        <div className='mb-2'>
          <VideoMetadata
            key={`${videoMetadata?.id || Date.now()}-metadata`}
            metadata={videoMetadata}
          />
          <VideoDownload
            key={`${videoMetadata?.id || Date.now()}-download`}
            metadata={videoMetadata}
          />
        </div>
      ) : null}
    </div>
  );
}

type VideoMetadataProps = { metadata: VideoMetadata };
const VideoMetadata = memo(({ metadata }: VideoMetadataProps) => {
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
VideoMetadata.displayName = 'VideoMetadata';

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
    try {
      const result = await axios
        .get('/api/d', {
          params
        })
        .then((res) => res.data)
        .catch((res) => res.response.data);

      if (result?.error) {
        toast.error(result?.error || 'download failed');
      } else if (result?.success) {
        if (result?.status === 'already') {
          mutate('/api/list');
          toast.info('already been downloaded');
        } else if (result?.status === 'downloading') {
          mutate('/api/list');
          toast.success('download requested');
        } else if (result?.status === 'restart') {
          mutate('/api/list');
          toast.success('download restart');
        }
      }
    } catch (e) {}
    setValidating(false);
  };

  return (
    <section className='my-6 mb-2'>
      <div className='text-center'>
        <button
          className={classNames(
            'btn btn-sm btn-primary normal-case',
            isValidating && 'loading',
            metadata.isLive && 'text-white gradient-background border-0'
          )}
          onClick={handleClickBestButton}
        >
          {metadata.isLive && (
            <div className='inline-flex items-center align-text-top text-xl text-rose-600'>
              <PingSvg />
            </div>
          )}
          BEST: {metadata.best.resolution} {metadata.best.vcodec}
          {metadata.best.acodec && metadata.best.vcodec && '+'}
          {metadata.best.acodec}
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
                    <b>Video</b>
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
                >
                  {metadata.isLive && (
                    <div className='inline-flex items-center align-text-top text-xl text-rose-600'>
                      <PingSvg />
                    </div>
                  )}
                  {selectedFormats?.video?.formatId &&
                    `${selectedFormats?.video?.formatNote || selectedFormats?.video?.resolution} ${
                      selectedFormats?.video?.vcodec
                    }`}
                  {selectedFormats?.video && selectedFormats?.audio ? '+' : null}
                  {selectedFormats?.audio?.formatId && selectedFormats?.audio?.acodec}
                  <span>
                    {(selectedFormats?.video || selectedFormats?.audio) && <>&nbsp;</>}Optional
                    Download
                  </span>
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
  format?: any;
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
        return `${format.formatNote || format.formatId} ${format.vcodec}`;
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
