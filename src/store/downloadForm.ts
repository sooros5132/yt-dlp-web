import { AxiosResponse, DownloadResponse } from '@/types/types';
import { VideoMetadata } from '@/types/video';
import axios from 'axios';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface State {
  url: string;
  enabledBestFormat: boolean;
  usingCookies: boolean;
}

interface Store extends State {
  setUrl: (url: string) => void;
  enableBestFormat: () => void;
  disableBestFormat: () => void;
  requestDownload: (params?: {
    url: string;
    videoId?: string;
    audioId?: string;
  }) => Promise<AxiosResponse<DownloadResponse>>;
  getMetadata: () => Promise<AxiosResponse<VideoMetadata>>;
  setUsingCookies: (usingCookies: boolean) => void;
}

const initialState: State = {
  url: '',
  enabledBestFormat: true,
  usingCookies: false
};

export const useDownloadFormStore = create(
  persist<Store>(
    (set, get) => ({
      ...initialState,
      setUrl(url) {
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
      },
      async requestDownload(params) {
        const { url, usingCookies } = get();
        const result = await axios
          .get('/api/d', {
            params: {
              ...params,
              url: params?.url || url,
              usingCookies
            }
          })
          .then((res) => res.data)
          .catch((res) => res.response.data);

        return result as AxiosResponse<DownloadResponse>;
      },
      async getMetadata() {
        const { url, usingCookies } = get();
        const metadata = await axios
          .get('/api/info', {
            params: {
              url,
              usingCookies
            }
          })
          .then((res) => res.data)
          .catch((res) => res.response.data);

        return metadata as AxiosResponse<VideoMetadata>;
      },
      setUsingCookies(usingCookies) {
        set({ usingCookies });
      }
    }),
    {
      name: 'downloadForm',
      storage: createJSONStorage(() => localStorage),
      version: 0.1,
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) =>
            ['enabledBestFormat', 'usingCookie'].includes(key)
          )
        ) as Store
    }
  )
);
