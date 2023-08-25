import React from 'react';
import { VideoListGridCard } from '@/components/video-list/VideoListGridCard';
import { useVideoListStore } from '@/store/videoList';
import { VideoListProps } from '@/components/containers/VideoList';

type VideoListBodyProps = VideoListProps;

export const VideoListBody = ({ items, orders }: VideoListBodyProps) => {
  const { layoutMode } = useVideoListStore();

  if (!orders || !orders?.length) {
    return (
      <div className='py-10 text-3xl text-center text-muted-foreground opacity-50 select-none'>
        List is empty
      </div>
    );
  }

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
      return (
        <div className='grid gap-x-3 gap-y-6 grid-cols-1 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3'>
          {orders.map((uuid) => {
            const video = items[uuid];
            if (!video) {
              return <React.Fragment key={uuid} />;
            }
            return <VideoListGridCard key={uuid} video={video} />;
          })}
        </div>
      );
    }
    default: {
      return <div>Not Supported</div>;
    }
  }
};
