export interface VideoInfo {
  uuid: string;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  resolution: string | null;
  createdAt: number;
  file: {
    path: string | null;
    name: string | null;
  };
  download: {
    completed: boolean;
    pid: number | null;
    filesize: string | null;
    progress: string | null;
    speed: string | null;
    format: string | null;
  };
}
