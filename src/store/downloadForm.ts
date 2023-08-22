import { AxiosResponse, DownloadResponse } from '@/types/types';
import { VideoInfo, VideoMetadata } from '@/types/video';
import axios from 'axios';
import { createWithEqualityFn } from 'zustand/traditional';
import { persist, createJSONStorage } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

interface State {
  url: string;
  enableBestFormat: boolean;
  usingCookies: boolean;
  // embedMetadata: boolean;
  embedChapters: boolean;
  embedSubs: boolean;
  enableProxy: boolean;
  proxyAddress: string;
  enableLiveFromStart: boolean;
  sliceByTime: boolean;
  sliceStartTime: string;
  sliceEndTime: string;
}

interface Store extends State {
  setUrl: (url: string) => void;
  setEnableBestFormat: (enableBestFormat: boolean) => void;
  requestDownload: (params?: {
    url: string;
    videoId?: string;
    audioId?: string;
  }) => Promise<AxiosResponse<DownloadResponse>>;
  getMetadata: () => Promise<AxiosResponse<VideoMetadata>>;
  setUsingCookies: (usingCookies: boolean) => void;
  setEmbedSubs: (embedSubs: boolean) => void;
  // setEmbedMetadata: (embedMetadata: boolean) => void;
  setEmbedChapters: (embedChapters: boolean) => void;
  setEnableProxy: (enableProxy: boolean) => void;
  setProxyAddress: (proxyAddress: string) => void;
  setEnableLiveFromStart: (enableLiveFromStart: boolean) => void;
  setSliceByTime: (sliceByTime: boolean) => void;
  setSliceStartTime: (sliceStartTime: string) => void;
  setSliceEndTime: (sliceEndTime: string) => void;
}

const initialState: State = {
  url: '',
  enableBestFormat: true,
  usingCookies: false,
  // embedMetadata: false,
  embedChapters: false,
  embedSubs: false,
  enableProxy: false,
  proxyAddress: '',
  enableLiveFromStart: false,
  sliceByTime: false,
  sliceStartTime: '',
  sliceEndTime: ''
};

export const useDownloadFormStore = createWithEqualityFn(
  persist<Store>(
    (set, get) => ({
      ...initialState,
      setUrl(url) {
        set({
          url
        });
      },
      setEnableBestFormat(enableBestFormat: boolean) {
        set({
          enableBestFormat
        });
      },
      async requestDownload(_params) {
        const {
          url,
          usingCookies,
          embedChapters,
          // embedMetadata,
          embedSubs,
          enableProxy,
          proxyAddress,
          enableLiveFromStart,
          sliceByTime,
          sliceStartTime,
          sliceEndTime
        } = get();

        const params: Partial<Record<keyof VideoInfo, any>> = {
          ..._params,
          url: _params?.url || url,
          usingCookies,
          embedChapters,
          // embedMetadata,
          embedSubs,
          enableProxy,
          proxyAddress,
          enableLiveFromStart
        };
        if (sliceByTime) {
          params.sliceByTime = sliceByTime;
          params.sliceStartTime = sliceStartTime;
          params.sliceEndTime = sliceEndTime;
        }

        const result = await axios
          .get('/api/d', {
            params
          })
          .then((res) => res.data)
          .catch((res) => res.response.data);

        return result as AxiosResponse<DownloadResponse>;
      },
      async getMetadata() {
        const { url, usingCookies, enableProxy, proxyAddress } = get();
        const metadata = await axios
          .get('/api/info', {
            params: {
              url,
              usingCookies,
              enableProxy,
              proxyAddress
            }
          })
          .then((res) => res.data)
          .catch((res) => res.response.data);

        return metadata as AxiosResponse<VideoMetadata>;
      },
      setUsingCookies(usingCookies) {
        set({ usingCookies });
      },
      // setEmbedMetadata(embedMetadata) {
      // set({ embedMetadata });
      // },
      setEmbedChapters(embedChapters) {
        set({ embedChapters });
      },
      setEmbedSubs(embedSubs) {
        set({ embedSubs });
      },
      setEnableProxy(enableProxy) {
        set({ enableProxy });
      },
      setProxyAddress(proxyAddress) {
        set({ proxyAddress });
      },
      setEnableLiveFromStart(enableLiveFromStart) {
        set({ enableLiveFromStart });
      },
      setSliceByTime(sliceByTime) {
        set({ sliceByTime });
      },
      setSliceStartTime(sliceStartTime) {
        set({ sliceStartTime });
      },
      setSliceEndTime(sliceEndTime) {
        set({ sliceEndTime });
      }
    }),
    {
      name: 'downloadForm',
      storage: createJSONStorage(() => localStorage),
      version: 0.1,
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) =>
            [
              // 'url',
              'enableBestFormat',
              'usingCookies',
              // 'embedMetadata',
              'embedChapters',
              'embedSubs',
              'enableProxy',
              'proxyAddress',
              'enableLiveFromStart'
            ].includes(key)
          )
        ) as Store
    }
  ),
  shallow
);
