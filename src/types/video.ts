export interface VideoFormat {
  formatId: string;
  formatNote: string;
  resolution: string;
  fps: string;
  dynamicRange: string;
  vcodec: string;
  acodec: string;
  filesize: string;
  videoExt: string;
  audioExt: string;
  width: string;
  height: string;
}

export interface VideoMetadata {
  id: string;
  originalUrl: string;
  title: string;
  description: string;
  thumbnail: string;
  isLive: boolean;
  best: {
    formatId: string;
    formatNote: string;
    resolution: string;
    fps: string;
    dynamicRange: string;
    vcodec: string;
    acodec: string;
    filesize: string;
    width: string;
    height: string;
  };
  formats: Array<VideoFormat>;
  type: 'video' | 'playlist';
}

export interface VideoInfo {
  uuid: string;
  id: string | null;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  localThumbnail: string | null;
  status: 'standby' | 'failed' | 'downloading' | 'recording' | 'merging' | 'completed';
  error?: string;
  isLive: boolean;
  format: string;
  usingCookies: boolean;
  embedChapters: boolean;
  embedMetadata: boolean;
  embedSubs: boolean;
  enableProxy: boolean;
  enableLiveFromStart: boolean;
  proxyAddress: string;
  file: Streams & {
    path: string | null;
    name: string | null;
    size?: number;
  };
  playlistDirPath?: string;
  playlist: Array<
    Streams & {
      uuid: string;
      path?: string | null;
      name?: string | null;
      size?: number;
      url?: string;
      isLive?: boolean;
      error?: string;
    }
  >;
  download: {
    pid: number | null;
    progress: string | null;
    speed: string | null;
    playlist?: {
      current: number;
      count: number;
    };
  };
  createdAt: number;
  updatedAt: number;
  type?: 'playlist' | 'video';
}

export interface Streams {
  width?: number;
  height?: number;
  rFrameRate?: number;
  colorPrimaries?: string;
  codecName?: string;
  duration?: string;
}

export interface FFmpegStreamsJson {
  programs: any[];
  streams: {
    width: number;
    height: number;
    r_frame_rate: string;
    color_primaries: string;
    codec_name: string;
    duration: string;
  }[];
}

export type PlaylistMetadata = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  playlistCount: number;
  type: 'playlist';
  originalUrl: string;
};
