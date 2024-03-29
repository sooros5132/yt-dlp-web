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
  url: string;
}

export interface VideoMetadata {
  id: string;
  originalUrl: string;
  title: string;
  description: string;
  thumbnail: string;
  isLive: boolean;
  duration: number;
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
  subtitles: Record<string, Array<Subtitle>>;
  type: 'video' | 'playlist';
}

export interface Subtitle {
  ext: string;
  url: string;
  name: string;
}

export type SelectQuality =
  | ''
  | 'best'
  | '4320p'
  | '2160p'
  | '1440p'
  | '1080p'
  | '720p'
  | '480p'
  | 'audio';

export interface VideoInfo {
  uuid: string;
  id: string | null;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  localThumbnail: string | null;
  status: 'standby' | 'failed' | 'downloading' | 'recording' | 'merging' | 'completed' | 'already';
  error?: string;
  isLive: boolean;
  videoId?: string;
  audioId?: string;
  format: string;
  usingCookies: boolean;
  embedChapters: boolean;
  // embedMetadata: boolean;
  embedSubs: boolean;
  subLangs: Array<string>;
  enableProxy: boolean;
  enableLiveFromStart: boolean;
  proxyAddress: string;
  cutVideo: boolean;
  cutStartTime: string;
  cutEndTime: string;
  outputFilename: string;
  selectQuality: SelectQuality;
  enableForceKeyFramesAtCuts: boolean;
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
    ffmpeg?: {
      frame: string;
      fps: string;
      q: string;
      sizeType: string;
      size: string;
      time: string;
      bitrate: string;
      speed: string;
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
