'use client';

import { useVideoPlayerStore } from '@/store/videoPlayer';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { VideoPlayer } from '@/components/modules/VideoPlayer';

export type VideoPlayerContainerProps = {
  onClose?: () => void;
};

export function VideoPlayerContainer() {
  const {
    openVideoPlayer,
    isLoopVideo,
    isNotSupportedCodec,
    isTopSticky,
    isWideScreen,
    volume,
    video,
    close
  } = useVideoPlayerStore();

  if (!video?.uuid || !openVideoPlayer) {
    return null;
  }

  if (video.type !== 'playlist' && isTopSticky) {
    return (
      <>
        <div className='min-h-[200px] h-[35vh] md:h-[30vh]'></div>
        <div className='z-[51] fixed w-full top-0 left-0 min-h-[200px] h-[35vh] md:h-[30vh] bg-black/90 dark:bg-black/70 backdrop-blur-lg'>
          <div className='z-[51] absolute top-0 left-0 w-full h-full'>
            <VideoPlayer
              isLoopVideo={isLoopVideo}
              isNotSupportedCodec={isNotSupportedCodec}
              isTopSticky={isTopSticky}
              isWideScreen={isWideScreen}
              volume={volume}
              videoInfo={video}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <Dialog
      open={Boolean(video?.uuid)}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        className='h-screen max-w-none p-0 border-none rounded-none bg-transparent transition-none'
        overlayClassName='bg-black/90 dark:bg-black/70 backdrop-blur-lg'
        onOpenAutoFocus={(evt) => evt.preventDefault()}
        hideCloseButton
      >
        <VideoPlayer
          isLoopVideo={isLoopVideo}
          isNotSupportedCodec={isNotSupportedCodec}
          isTopSticky={isTopSticky}
          isWideScreen={isWideScreen}
          volume={volume}
          videoInfo={video}
        />
      </DialogContent>
    </Dialog>
  );
}
