import { VideoInfo } from '@/types/video';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface VideoPlayerState {
  isVideoPlayerOpen: boolean;
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
}

const initialState: VideoPlayerState = {
  isVideoPlayerOpen: false,
  video: null,
  videoUuid: '',
  currentTime: 0,
  volume: 0.75
};

export const useVideoPlayerStore = create(
  persist<VideoPlayerStore>(
    (set) => ({
      ...initialState,
      open(video) {
        set((prev) => {
          const nextCurrentTime = video && prev?.videoUuid === video?.uuid ? prev.currentTime : 0;

          return {
            isVideoPlayerOpen: true,
            video,
            videoUuid: video?.uuid || '',
            currentTime: nextCurrentTime
          };
        });
      },
      close() {
        set({
          isVideoPlayerOpen: false,
          video: null
        });
      },
      setVolume(volume: number) {
        set({ volume });
      },
      setCurrentTime(currentTime: number) {
        set({ currentTime });
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
  )
);
