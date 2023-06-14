import { AxiosResponse, DownloadResponse } from '@/types/types';
import { VideoMetadata } from '@/types/video';
import axios from 'axios';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface State {
  url: string;
  enabledBestFormat: boolean;
  usingCookies: boolean;
  embedMetadata: boolean;
  embedChapters: boolean;
  embedSubs: boolean;
  enableProxy: boolean;
  proxyAddress: string;
  enableLiveFromStart: boolean;
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
  setEmbedSubs: (embedSubs: boolean) => void;
  setEmbedMetadata: (embedMetadata: boolean) => void;
  setEmbedChapters: (embedChapters: boolean) => void;
  setEnableProxy: (enableProxy: boolean) => void;
  setProxyAddress: (proxyAddress: string) => void;
  setEnableLiveFromStart: (enableLiveFromStart: boolean) => void;
}

const initialState: State = {
  url: '',
  enabledBestFormat: true,
  usingCookies: false,
  embedMetadata: false,
  embedChapters: false,
  embedSubs: false,
  enableProxy: false,
  proxyAddress: '',
  enableLiveFromStart: false
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
        const {
          url,
          usingCookies,
          embedChapters,
          embedMetadata,
          embedSubs,
          enableProxy,
          proxyAddress,
          enableLiveFromStart
        } = get();
        const result = await axios
          .get('/api/d', {
            params: {
              ...params,
              url: params?.url || url,
              usingCookies,
              embedChapters,
              embedMetadata,
              embedSubs,
              enableProxy,
              proxyAddress,
              enableLiveFromStart
            }
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
      setEmbedMetadata(embedMetadata) {
        set({ embedMetadata });
      },
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
              'enabledBestFormat',
              'usingCookies',
              'embedMetadata',
              'embedChapters',
              'embedSubs',
              'enableProxy',
              'proxyAddress',
              'enableLiveFromStart'
            ].includes(key)
          )
        ) as Store
    }
  )
);
