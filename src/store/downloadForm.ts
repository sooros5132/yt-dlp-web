import { AxiosResponse, DownloadResponse } from '@/types/types';
import { SelectQuality, VideoInfo, VideoMetadata } from '@/types/video';
import axios from 'axios';
import { createWithEqualityFn } from 'zustand/traditional';
import { persist, createJSONStorage } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { isDevelopment } from '@/lib/utils';

interface State {
  hydrated: boolean;
  isFetching: boolean;
  url: string;
  format: string;
  enableDownloadNow: boolean;
  usingCookies: boolean;
  // embedMetadata: boolean;
  embedChapters: boolean;
  embedSubs: boolean;
  enableProxy: boolean;
  proxyAddress: string;
  enableLiveFromStart: boolean;
  cutVideo: boolean;
  cutStartTime: string;
  cutEndTime: string;
  enableOutputFilename: boolean;
  outputFilename: string;
  selectQuality: SelectQuality;
  enableForceKeyFramesAtCuts: boolean;
}

interface Store extends State {
  setHydrated: () => void;
  setFetching: (isFetching: boolean) => void;
  setUrl: (url: string) => void;
  setFormat: (format: string) => void;
  setEnableDownloadNow: (enableDownloadNow: boolean) => void;
  requestDownload: (params?: {
    url: string;
    videoId?: string;
    audioId?: string;
  }) => Promise<AxiosResponse<DownloadResponse>>;
  getMetadata: () => Promise<AxiosResponse<VideoMetadata>>;
  setUsingCookies: (usingCookies: boolean) => void;
  setEmbedSubs: (embedSubs: boolean) => void;
  setEmbedChapters: (embedChapters: boolean) => void;
  setEnableProxy: (enableProxy: boolean) => void;
  setProxyAddress: (proxyAddress: string) => void;
  setEnableLiveFromStart: (enableLiveFromStart: boolean) => void;
  setCutVideo: (cutVideo: boolean) => void;
  setCutStartTime: (cutStartTime: string) => void;
  setCutEndTime: (cutEndTime: string) => void;
  setEnableOutputFilename: (enableOutputFilename: boolean) => void;
  setOutputFilename: (outputFilename: string) => void;
  setSelectQuality: (selectQuality: SelectQuality) => void;
  setForceKeyFramesAtCuts: (enableForceKeyFramesAtCuts: boolean) => void;
  loadDownloadedOptions: (video: VideoInfo) => void;
}

const initialState: State = {
  hydrated: false,
  isFetching: false,
  url: '',
  format: '',
  enableDownloadNow: true,
  usingCookies: false,
  embedChapters: false,
  embedSubs: false,
  enableProxy: false,
  proxyAddress: '',
  enableLiveFromStart: false,
  cutVideo: false,
  cutStartTime: '',
  cutEndTime: '',
  enableOutputFilename: false,
  outputFilename: '%(title)s (%(id)s)',
  selectQuality: 'best',
  enableForceKeyFramesAtCuts: false
};

export const initialDownloadFormState = { ...initialState };

export const useDownloadFormStore = createWithEqualityFn(
  persist<Store>(
    (set, get) => ({
      ...initialState,
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
          cutVideo,
          cutStartTime,
          cutEndTime,
          enableOutputFilename,
          outputFilename,
          enableDownloadNow,
          selectQuality,
          enableForceKeyFramesAtCuts
        } = get();

        const params: Partial<Record<keyof VideoInfo, any>> = {
          ..._params,
          url: _params?.url || url,
          usingCookies,
          embedChapters,
          embedSubs,
          enableLiveFromStart,
          enableForceKeyFramesAtCuts
        };

        if (enableOutputFilename) {
          params.outputFilename = `${outputFilename}.%(ext)s`;
        }
        if (enableDownloadNow) {
          params.selectQuality = selectQuality;
        }
        if (enableProxy) {
          params.enableProxy = enableProxy;
          params.proxyAddress = proxyAddress;
        }
        if (cutVideo) {
          params.cutVideo = cutVideo;
          params.cutStartTime = cutStartTime;
          params.cutEndTime = cutEndTime;
          params.enableForceKeyFramesAtCuts = enableForceKeyFramesAtCuts;
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
      setHydrated() {
        set({ hydrated: true });
      },
      setFetching(isFetching) {
        set({ isFetching });
      },
      setUrl(url) {
        set({ url });
      },
      setFormat(format) {
        set({ format });
      },
      setEnableDownloadNow(enableDownloadNow: boolean) {
        set({ enableDownloadNow });
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
      setCutVideo(cutVideo) {
        set({ cutVideo });
      },
      setCutStartTime(cutStartTime) {
        set({ cutStartTime });
      },
      setCutEndTime(cutEndTime) {
        set({ cutEndTime });
      },
      setEnableOutputFilename(enableOutputFilename) {
        set({ enableOutputFilename });
      },
      setOutputFilename(outputFilename) {
        set({ outputFilename });
      },
      setSelectQuality(selectQuality: SelectQuality) {
        set({ selectQuality });
      },
      setForceKeyFramesAtCuts(enableForceKeyFramesAtCuts) {
        set({ enableForceKeyFramesAtCuts });
      },
      loadDownloadedOptions(video) {
        const newOutputFilename =
          video.outputFilename?.replace?.(/\.\%\(ext\)s$/, '') || '%(title)s (%(id)s)';
        const newOptions: Partial<State> = {
          url: video.url,
          enableDownloadNow: !video.format || video.format === 'bv+ba/b',
          selectQuality: video.selectQuality || 'best',
          enableOutputFilename: Boolean(
            video.outputFilename && video.outputFilename !== '%(title)s (%(id)s).%(ext)s'
          ),
          outputFilename: newOutputFilename,
          usingCookies: video.usingCookies ?? initialState.usingCookies,
          cutVideo: video.cutVideo ?? initialState.cutVideo,
          cutStartTime: video.cutStartTime ?? initialState.cutStartTime,
          cutEndTime: video.cutEndTime ?? initialState.cutEndTime,
          enableForceKeyFramesAtCuts:
            video.enableForceKeyFramesAtCuts ?? initialState.enableForceKeyFramesAtCuts,
          embedSubs: video.embedSubs ?? initialState.embedSubs,
          embedChapters: video.embedChapters ?? initialState.embedChapters,
          enableLiveFromStart: video.enableLiveFromStart ?? initialState.enableLiveFromStart,
          enableProxy: video.enableProxy ?? initialState.enableProxy,
          proxyAddress: video.enableProxy
            ? video.proxyAddress ?? initialState.proxyAddress
            : initialState.proxyAddress
        };
        set({
          ...newOptions
        });
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
          'selectQuality',
          // 'cutVideo',
          // 'cutStartTime',
          // 'cutEndTime',
          'enableForceKeyFramesAtCuts'
        ];
        if (isDevelopment) {
          keys.push('url', 'enableOutputFilename', 'cutVideo', 'cutStartTime', 'cutEndTime');
        }
        return Object.fromEntries(
          Object.entries(state).filter(([key]) => keys.includes(key))
        ) as Store;
      },
      skipHydration: true,
      onRehydrateStorage() {
        return (state, error) => {
          if (!error && typeof state?.hydrated !== 'undefined' && !state?.hydrated) {
            state?.setHydrated?.();
          }
        };
      }
    }
  ),
  shallow
);
