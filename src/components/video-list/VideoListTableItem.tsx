import { VideoInfo } from '@/types/video';
import numeral from 'numeral';
import { memo, useState } from 'react';
import { FcRemoveImage } from 'react-icons/fc';
import { isPropsEquals } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export const VideoListTableItem = memo(({ video }: { video: VideoInfo }) => {
  const isCompleted = video.status === 'completed';
  const isStandby = video.status === 'standby';
  const isFailed = video.status === 'failed';
  const isRecording = video.status === 'recording';
  const [isThumbnailImageError, setThumbnailImageError] = useState(false);
  const handleImageError = () => {
    setThumbnailImageError(true);
  };

  return (
    <Card className='flex rounded-lg bg-card-nested border-none h-[100px] overflow-hidden'>
      <div className='shrink-0 basis-[100px]'>
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
            <div className='w-full h-full min-h-[100px] flex items-center justify-center text-4xl bg-base-content/5 select-none'>
              <FcRemoveImage />
            </div>
          )}
        </figure>
      </div>
      <div className='flex flex-col grow p-2'>
        <div className='line-clamp-2'>{video.title}</div>
        <div className='flex gap-x-1 mt-auto text-xs text-muted-foreground'>
          {typeof video.file.height === 'number' && video.file.height > 0 && (
            <div className='bg-black/70 text-white p-0.5 px-1 rounded-lg'>
              {video.file.height}p
              {typeof video.file.rFrameRate === 'number' && video.file.rFrameRate > 0
                ? Math.round(video.file.rFrameRate)
                : ''}
              {video.file.codecName ? ' ' + video.file.codecName : ''}
              {video.file.colorPrimaries === 'bt2020' ? ' HDR' : ''}
            </div>
          )}
          {typeof video.file.size === 'number' && (
            <div className='bg-black/70 text-white p-0.5 px-1 rounded-lg'>
              {numeral(video.file.size).format('0.0b')}
            </div>
          )}
          {video.file.duration && (
            <div className='bg-black/70 text-white p-0.5 px-1 rounded-lg'>
              {numeral(video.file.duration).format('00:00:00')}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}, isPropsEquals);

VideoListTableItem.displayName = 'VideoListTableItem';
