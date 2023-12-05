import React, { memo, useState } from 'react';
import { mutate } from 'swr';
import { toast } from 'react-toastify';
import numeral from 'numeral';
import { PingSvg } from '@/components/modules/PingSvg';
import { HiOutlineBarsArrowDown, HiOutlineBarsArrowUp } from 'react-icons/hi2';
import { useDownloadFormStore } from '@/store/downloadForm';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Divider } from '@/components/Divider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn, isPropsEquals } from '@/lib/utils';
import { BsLink45Deg } from 'react-icons/bs';
import type { PlaylistMetadata, VideoFormat, VideoMetadata } from '@/types/video';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';

type VideoDownloadFormProps = { metadata: VideoMetadata };

type SelectedFormats = {
  audio: VideoFormat | null;
  video: VideoFormat | null;
  subtitles: VideoMetadata['subtitles'];
};

export const VideoDownloadForm = memo(({ metadata }: VideoDownloadFormProps) => {
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
  const [selectedFormats, setSelectedFormats] = useState<SelectedFormats>({
    audio: null,
    video: null,
    subtitles: {}
  });

  const handleClickRadio = (type: 'audio' | 'video', format: VideoFormat) => () => {
    if (!['audio', 'video'].includes(type) || !format) {
      return;
    }
    if (selectedFormats[type] === format) {
      return;
    }
    setSelectedFormats({
      ...selectedFormats,
      [type]: format
    });
  };

  const handleClickSubtitleCheckbox =
    (lang: string, subtitle: VideoMetadata['subtitles'][string]) => () => {
      if (selectedFormats.subtitles[lang]) {
        const { [lang]: _, ...newSubtitles } = selectedFormats.subtitles;
        setSelectedFormats({
          ...selectedFormats,
          subtitles: newSubtitles
        });
      } else {
        setSelectedFormats({
          ...selectedFormats,
          subtitles: {
            ...selectedFormats.subtitles,
            [lang]: subtitle
          }
        });
      }
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isValidating) {
      return;
    }
    if (!selectedFormats.video && !selectedFormats.audio) {
      toast.warn('Please select a formats');
      return;
    }

    const subLangs = Object.keys(selectedFormats.subtitles);

    await requestDownload({
      url: metadata.originalUrl,
      videoId: selectedFormats?.video?.formatId,
      audioId: selectedFormats?.audio?.formatId,
      embedSubs: Boolean(subLangs.length),
      subLangs: subLangs
    });
  };

  const handleClickBestButton = async () => {
    await requestDownload({
      url: metadata.originalUrl
    });
  };

  const handleClickAllCheck = (type: 'subtitles') => () => {
    if (!type) {
      return;
    }
    switch (type) {
      case 'subtitles': {
        setSelectedFormats({
          ...selectedFormats,
          [type]: {
            ...metadata.subtitles
          }
        });
        break;
      }
    }
  };

  const handleClickUncheck = (type: 'audio' | 'video' | 'subtitles') => () => {
    if (!type) {
      return;
    }
    switch (type) {
      case 'audio':
      case 'video': {
        setSelectedFormats({
          ...selectedFormats,
          [type]: null
        });
        break;
      }
      case 'subtitles': {
        setSelectedFormats({
          ...selectedFormats,
          [type]: {}
        });
        break;
      }
    }
  };

  const requestDownload = async (params: NonNullable<Parameters<typeof requestDownload>[0]>) => {
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

  const langs = Object.keys(metadata.subtitles);

  let bestVideo = metadata.best?.height ? metadata.best?.height + 'p' : metadata.best?.resolution;
  let bestAudio = metadata.best?.acodec;
  const selectVideo = selectedFormats.video;
  const selectAudio = selectedFormats.audio;

  if (metadata.best?.fps) bestVideo += ' ' + metadata.best?.fps + 'fps';
  if (metadata.best?.dynamicRange) bestVideo += ' ' + metadata.best?.dynamicRange;
  if (metadata.best?.vcodec) bestVideo += ' ' + metadata.best?.vcodec;

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
            {isOpen && (
              <div className='my-4 text-center'>
                <OptionalDownloadButton
                  selectVideo={selectVideo}
                  selectAudio={selectAudio}
                  isLive={metadata.isLive}
                  isValidating={isValidating}
                />
              </div>
            )}
            <div className={cn(!isOpen && 'pointer-events-none select-none opacity-60')}>
              <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] lg:grid-cols-1 gap-2'>
                <div className='overflow-hidden'>
                  <div className='flex items-center justify-between'>
                    <b className='shrink-0'>{metadata.isLive ? 'Stream' : 'Video'}</b>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='h-[1.75em] py-1 px-2'
                      onClick={handleClickUncheck('video')}
                    >
                      Uncheck
                    </Button>
                  </div>
                  {/* grid는 너비 오류가 생김. flex로 변경 */}
                  <RadioGroup
                    className='flex flex-col gap-0'
                    key={selectedFormats.video?.formatId || 'uncheked'}
                  >
                    {videoFormat.map((format) => (
                      <VideoDownloadRadio
                        key={format.formatId}
                        type='video'
                        format={format}
                        checked={format.formatId === selectVideo?.formatId}
                        onClickRadio={handleClickRadio('video', format)}
                      />
                    ))}
                  </RadioGroup>
                </div>
                <Divider variant='horizontal' className='hidden sm:flex' />
                <div className='overflow-hidden'>
                  <div className='flex items-center justify-between'>
                    <b className='shrink-0'>Audio</b>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='h-[1.75em] py-1 px-2'
                      onClick={handleClickUncheck('audio')}
                    >
                      Uncheck
                    </Button>
                  </div>
                  {/* grid는 너비 오류가 생김. flex로 변경 */}
                  <RadioGroup
                    className='flex flex-col gap-0'
                    value={selectedFormats.audio?.formatId || ''}
                    key={selectedFormats.audio?.formatId || 'uncheked'}
                  >
                    {audioFormat.map((format) => (
                      <VideoDownloadRadio
                        key={format.formatId}
                        type='audio'
                        format={format}
                        checked={format.formatId === selectAudio?.formatId}
                        onClickRadio={handleClickRadio('audio', format)}
                      />
                    ))}
                  </RadioGroup>
                </div>
                {langs && (
                  <div className='overflow-hidden sm:col-span-3 lg:col-span-1'>
                    <div className='flex gap-x-1 items-center justify-between'>
                      <b className='grow shrink-0'>Subtitles</b>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className='h-[1.75em] py-1 px-2'
                        onClick={handleClickAllCheck('subtitles')}
                      >
                        All
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className='h-[1.75em] py-1 px-2'
                        onClick={handleClickUncheck('subtitles')}
                      >
                        Uncheck
                      </Button>
                    </div>
                    {/* grid는 너비 오류가 생김. flex로 변경 */}
                    {langs.map((lang) => {
                      const formats = metadata.subtitles[lang];
                      const checked = Boolean(selectedFormats.subtitles[lang]);
                      const name = formats?.[formats.length - 1]?.name || lang;
                      return (
                        <div key={lang} className='flex my-1'>
                          <Label
                            className='flex items-center pl-1 gap-x-1 cursor-pointer'
                            title='select lang'
                          >
                            <Checkbox
                              name={'subLangs'}
                              checked={checked}
                              onClick={handleClickSubtitleCheckbox(lang, formats)}
                            />
                            <span className='text-sm'>{name}</span>
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className='my-4 text-center'>
                <OptionalDownloadButton
                  selectVideo={selectVideo}
                  selectAudio={selectAudio}
                  isLive={metadata.isLive}
                  isValidating={isValidating}
                />
              </div>
            </div>
          </form>
        ) : null}
      </div>
    </section>
  );
}, isPropsEquals);

VideoDownloadForm.displayName = 'VideoDownloadForm';

type VideoDownloadRadioProps = {
  type: 'audio' | 'video';
  format: VideoFormat;
  checked: boolean;
  onClickRadio: () => void;
};

const VideoDownloadRadio = ({ type, format, checked, onClickRadio }: VideoDownloadRadioProps) => {
  const content = formatToFormatDescription(type, format);

  const handleEventStopPropagation = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  return (
    <div className='my-0.5 whitespace-nowrap' onClick={onClickRadio}>
      <label className='flex items-center px-1 gap-x-1 cursor-pointer rounded-md hover:bg-foreground/5'>
        <RadioGroupItem value={format.formatId} checked={checked} className='shrink-0' />
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
            onClick={handleEventStopPropagation}
          >
            <BsLink45Deg />
          </a>
        )}
      </label>
    </div>
  );
};

type PlaylistDownloadFormProps = {
  metadata: PlaylistMetadata;
};

export const PlaylistDownloadForm = memo(({ metadata }: PlaylistDownloadFormProps) => {
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
          Download&nbsp;<b>{metadata?.playlistCount || 'Unknown'}</b>&nbsp;items from a playlist
        </Button>
      </div>
    </div>
  );
}, isPropsEquals);

PlaylistDownloadForm.displayName = 'PlaylistDownloadForm';

function formatToFormatDescription(type: 'audio' | 'video', format: VideoFormat) {
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
    default: {
      return '';
    }
  }
}

type OptionalDownloadButtonProps = {
  selectVideo: VideoFormat | null;
  selectAudio: VideoFormat | null;
  isLive: boolean;
  isValidating: boolean;
};
function OptionalDownloadButton({
  isLive,
  selectAudio,
  selectVideo,
  isValidating
}: OptionalDownloadButtonProps) {
  return (
    <>
      <Button
        className={cn(
          'bg-info rounded-full hover:bg-info/90 px-3',
          isLive && 'text-white gradient-background border-0'
        )}
        size='sm'
        type='submit'
        title='Download with selected option'
        disabled={isValidating}
      >
        {isValidating && <Loader2 className='h-4 w-4 animate-spin' />}
        {isLive && (
          <div className='inline-flex items-center align-text-top text-xl text-rose-600'>
            <PingSvg />
          </div>
        )}
        {selectVideo && formatToFormatDescription('video', selectVideo)}
        {selectVideo && selectAudio && ' + '}
        {selectAudio && formatToFormatDescription('audio', selectAudio)}
        {!selectVideo && !selectAudio ? <span>Optional Download</span> : null}
      </Button>
      <div className='text-xs text-muted-foreground'></div>
      <div className='text-xs text-muted-foreground'>
        {selectVideo && !selectAudio
          ? 'Video only'
          : !selectVideo && selectAudio
          ? 'Audio only'
          : selectVideo && selectAudio
          ? 'Video + Audio Download'
          : ''}
      </div>
    </>
  );
}
