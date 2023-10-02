import React from 'react';
import { VideoGridItem } from '@/components/video-list/VideoGridItem';
import { useVideoListStore } from '@/store/videoList';
import { Skeleton } from '../ui/skeleton';
import { VideoListProps } from '../containers/VideoList';

type VideoListBodyProps = {
  isLoading: boolean;
} & VideoListProps;

export const VideoListBody = ({ items, orders, isLoading }: VideoListBodyProps) => {
  const { layoutMode } = useVideoListStore();

  switch (layoutMode) {
    // case 'table': {
    //   return (
    //     <div className='space-y-2'>
    //       {videos.map((video) => (
    //         <VideoTableItem key={video.uuid} video={video} />
    //       ))}
    //     </div>
    //   );
    // }
    case 'grid': {
      return <VideoGridViewer items={items} orders={orders} isLoading={isLoading} />;
    }
    default: {
      return <div>Not Supported</div>;
    }
  }
};

function VideoGridViewer({ items, orders, isLoading }: VideoListBodyProps) {
  return (
    <div className='grid gap-x-3 gap-y-6 grid-cols-1 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3'>
      {!isLoading && items && orders ? (
        orders.length ? (
          orders.map((uuid) => {
            const video = items[uuid];
            if (!video) {
              return <React.Fragment key={uuid} />;
            }
            return <VideoGridItem key={uuid} video={video} />;
          })
        ) : (
          <div className='w-full col-start-1 col-end-4 py-10 text-3xl text-center text-muted-foreground opacity-50 select-none'>
            Empty
          </div>
        )
      ) : (
        <>
          <div className='space-y-2'>
            <Skeleton className='aspect-video bg-card-nested' />
            <Skeleton className='h-3.5 bg-card-nested' />
            <Skeleton className='h-3.5 bg-card-nested' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='aspect-video bg-card-nested' />
            <Skeleton className='h-3.5 bg-card-nested' />
            <Skeleton className='h-3.5 bg-card-nested' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='aspect-video bg-card-nested' />
            <Skeleton className='h-3.5 bg-card-nested' />
            <Skeleton className='h-3.5 bg-card-nested' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='aspect-video bg-card-nested' />
            <Skeleton className='h-3.5 bg-card-nested' />
            <Skeleton className='h-3.5 bg-card-nested' />
          </div>
        </>
      )}
    </div>
  );
}
