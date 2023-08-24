import { AxiosResponse, DownloadResponse } from '@/types/types';
import { SelectQuality, VideoInfo, VideoMetadata } from '@/types/video';
import axios from 'axios';
import { createWithEqualityFn } from 'zustand/traditional';
import { persist, createJSONStorage } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

interface State {
  url: string;
  enableDownloadNow: boolean;
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
  enableOutputFilename: boolean;
  outputFilename: string;
  selectQuality: SelectQuality;
}

interface Store extends State {
  setUrl: (url: string) => void;
  setEnableDownloadNow: (enableDownloadNow: boolean) => void;
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
  setEnableOutputFilename: (enableOutputFilename: boolean) => void;
  setOutputFilename: (outputFilename: string) => void;
  setSelectQuality: (selectQuality: SelectQuality) => void;
}

const initialState: State = {
  url: '',
  enableDownloadNow: true,
  usingCookies: false,
  // embedMetadata: false,
  embedChapters: false,
  embedSubs: false,
  enableProxy: false,
  proxyAddress: '',
  enableLiveFromStart: false,
  sliceByTime: false,
  sliceStartTime: '',
  sliceEndTime: '',
  enableOutputFilename: false,
  outputFilename: '%(title)s (%(id)s)',
  selectQuality: 'best'
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
      setEnableDownloadNow(enableDownloadNow: boolean) {
        set({
          enableDownloadNow
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
          sliceEndTime,
          enableOutputFilename,
          outputFilename,
          enableDownloadNow,
          selectQuality
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

        if (enableOutputFilename) {
          params.outputFilename = `${outputFilename}.%(ext)s`;
        }
        if (enableDownloadNow) {
          params.selectQuality = selectQuality;
        }

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
      },
      setEnableOutputFilename(enableOutputFilename) {
        set({ enableOutputFilename });
      },
      setOutputFilename(outputFilename) {
        set({ outputFilename });
      },
      setSelectQuality(selectQuality: SelectQuality) {
        set({ selectQuality });
      }
    }),
    {
      name: 'downloadForm',
      storage: createJSONStorage(() => localStorage),
      version: 0.1,
      partialize: (state) => {
        const keys = [
          'enableDownloadNow',
          'usingCookies',
          'embedChapters',
          'embedSubs',
          'enableProxy',
          'proxyAddress',
          'enableLiveFromStart',
          'enableOutputFilename',
          'outputFilename',
          'selectQuality'
        ];
        if (process.env.NODE_ENV === 'development') {
          keys.push('url', 'enableOutputFilename', 'sliceByTime', 'sliceStartTime', 'sliceEndTime');
        }
        return Object.fromEntries(
          Object.entries(state).filter(([key]) => keys.includes(key))
        ) as Store;
      }
    }
  ),
  shallow
);
