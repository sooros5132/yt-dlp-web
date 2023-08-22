import { createWithEqualityFn } from 'zustand/traditional';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { VideoInfo } from '@/types/video';
import { shallow } from 'zustand/shallow';

interface VideoPlayerState {
  isVideoPlayerOpen: boolean;
  isNotSupportedCodec: boolean;
  enableWideScreen: boolean;
  enableTopSticky: boolean;
  videoUuid: string;
  video: VideoInfo | null;
  currentTime: number;
  volume: number;
}

interface VideoPlayerStore extends VideoPlayerState {
  open: (video: VideoInfo | null) => void;
  close: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (currentTime: number) => void;
  setNotSupportedCodec: (isNotSupportedCodec: boolean) => void;
  setEnableWideScreen: (enableWideScreen: boolean) => void;
  setEnableTopSticky: (enableTopSticky: boolean) => void;
}

const initialState: VideoPlayerState = {
  isVideoPlayerOpen: false,
  isNotSupportedCodec: false,
  enableWideScreen: false,
  enableTopSticky: false,
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
            isVideoPlayerOpen: true,
            isNotSupportedCodec: false,
            video,
            videoUuid: video?.uuid || '',
            currentTime: nextCurrentTime
          };
        });
      },
      close() {
        set({
          isVideoPlayerOpen: false,
          isNotSupportedCodec: false,
          video: null
        });
      },
      setVolume(volume: number) {
        set({ volume });
      },
      setCurrentTime(currentTime: number) {
        set({ currentTime });
      },
      setNotSupportedCodec(isNotSupportedCodec: boolean) {
        set({ isNotSupportedCodec });
      },
      setEnableWideScreen(enableWideScreen: boolean) {
        set({ enableWideScreen });
      },
      setEnableTopSticky(enableTopSticky: boolean) {
        set({ enableTopSticky });
      }
    }),
    {
      name: 'videoPlayer',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !['isVideoPlayerOpen', 'isNotSupportedCodec'].includes(key)
          )
        ) as VideoPlayerStore,
      version: 0.1
    }
  ),
  shallow
);
