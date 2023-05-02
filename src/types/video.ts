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
}

export interface VideoInfo {
  uuid: string;
  id: string | null;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  localThumbnail: string | null;
  status: 'stanby' | 'downloading' | 'recording' | 'merging' | 'completed';
  isLive: boolean;
  format: string;
  file: Streams & {
    path: string | null;
    name: string | null;
    size?: number;
  };
  download: {
    pid: number | null;
    progress: string | null;
    speed: string | null;
  };
  createdAt: number;
  updatedAt: number;
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
