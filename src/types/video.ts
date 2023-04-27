export interface VideoFormat {
  format_id: string;
  format_note: string;
  fps: string;
  resolution: string;
  vcodec: string;
  acodec: string;
  filesize: string;
  video_ext: string;
  audio_ext: string;
}

export interface VideoMetadata {
  id: string;
  original_url: string;
  title: string;
  description: string;
  thumbnail: string;
  best: {
    format_id: string;
    format_note: string;
    fps: string;
    resolution: string;
    vcodec: string;
    acodec: string;
    filesize: string;
  };
  formats: Array<VideoFormat>;
}

export interface VideoInfo {
  uuid: string;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  createdAt: number;
  status: 'downloading' | 'merging' | 'completed';
  file: {
    path: string | null;
    name: string | null;
    size?: number;
    length?: number;
    resolution?: [number, number];
  };
  download: {
    completed: boolean;
    pid: number | null;
    filesize: string | null;
    progress: string | null;
    speed: string | null;
    format: string[] | null;
  };
}
