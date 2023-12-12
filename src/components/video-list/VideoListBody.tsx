import { memo } from 'react';
import { VideoGridItem } from '@/components/video-list/VideoGridItem';
import { useVideoListStore } from '@/store/videoList';
import { Skeleton } from '@/components/ui/skeleton';
import { type VideoListProps } from '@/components/containers/VideoList';
import { isPropsEquals } from '@/lib/utils';
import { VirtuosoGrid } from 'react-virtuoso';

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
  const gridClassName =
    'grid gap-x-3 gap-y-6 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3';
  return !isLoading && items && orders ? (
    <>
      {orders.length === 0 && (
        <div className='flex items-center justify-center w-full min-h-[40vh] col-start-1 col-end-4 py-10'>
          <span className='text-3xl text-muted-foreground opacity-50 select-none'>Empty</span>
        </div>
      )}
      <VirtuosoGrid
        useWindowScroll
        style={{ height: '100%', width: '100%' }}
        data={orders}
        listClassName={gridClassName}
        itemClassName=''
        itemContent={(index, uuid) => <VideoGridItemWithMemo video={items[uuid]} />}
      />
    </>
  ) : (
    <div className={gridClassName}>
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
    </div>
  );
}

const VideoGridItemWithMemo = memo(VideoGridItem, isPropsEquals);
