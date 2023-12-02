import { createWithEqualityFn } from 'zustand/traditional';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { VideoInfo } from '@/types/video';
import { shallow } from 'zustand/shallow';

interface VideoPlayerState {
  openVideoPlayer: boolean;
  isNotSupportedCodec: boolean;
  isWideScreen: boolean;
  isTopSticky: boolean;
  isLoopVideo: boolean;
  videoUuid: string;
  video: VideoInfo | null;
  currentTime: number;
  volume: number;
}

export interface VideoPlayerStore extends VideoPlayerState {
  open: (video: VideoInfo | null) => void;
  close: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (currentTime: number) => void;
  setNotSupportedCodec: (isNotSupportedCodec: boolean) => void;
  setWideScreen: (isWideScreen: boolean) => void;
  setTopSticky: (isTopSticky: boolean) => void;
  setLoopVideo: (isLoopVideo: boolean) => void;
}

const initialState: VideoPlayerState = {
  openVideoPlayer: false,
  isNotSupportedCodec: false,
  isWideScreen: false,
  isTopSticky: false,
  isLoopVideo: false,
  video: null,
  videoUuid: '',
  currentTime: 0,
  volume: 0.75
};

export const useVideoPlayerStore = createWithEqualityFn(
  persist<VideoPlayerStore>(
    (set) => ({
      ...initialState,
      open(video) {
        set((prev) => {
          const nextCurrentTime = video && prev?.videoUuid === video?.uuid ? prev.currentTime : 0;

          return {
            openVideoPlayer: true,
            isNotSupportedCodec: false,
            video,
            videoUuid: video?.uuid || '',
            currentTime: nextCurrentTime
          };
        });
      },
      close() {
        set({
          openVideoPlayer: false,
          isNotSupportedCodec: false,
          video: null
        });
      },
      setVolume(volume) {
        set({ volume });
      },
      setCurrentTime(currentTime) {
        set({ currentTime });
      },
      setNotSupportedCodec(isNotSupportedCodec) {
        set({ isNotSupportedCodec });
      },
      setWideScreen(isWideScreen) {
        set({ isWideScreen });
      },
      setTopSticky(isTopSticky) {
        set({ isTopSticky });
      },
      setLoopVideo(isLoopVideo) {
        set({ isLoopVideo });
      }
    }),
    {
      name: 'videoPlayer',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !['openVideoPlayer', 'isNotSupportedCodec'].includes(key)
          )
        ) as VideoPlayerStore,
      version: 0.1,
      skipHydration: true
    }
  ),
  shallow
);
