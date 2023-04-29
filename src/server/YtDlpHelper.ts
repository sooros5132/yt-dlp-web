import { spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import type { Readable } from 'node:stream';
import numeral from 'numeral';
import { Stats, promises as fs } from 'fs';
import { randomUUID } from 'node:crypto';
import { CacheHelper, DOWNLOAD_PATH, VIDEO_LIST_FILE } from './CacheHelper';
import { throttle } from 'lodash';
import { VideoFormat, VideoInfo, VideoMetadata } from '@/types/video';
import { FFmpegHelper } from './FFmpegHelper';

const downloadRegex =
  /^\[download\]\s+([0-9\.]+\%)\s+of\s+~\s+([0-9\.a-zA-Z\/]+)\s+at\s+([0-9a-zA_Z\.\/\ ]+)\s+ETA\s+([0-9a-zA_Z\.\/\:\ ]+)/i;
const fileRegex = /^\[Merger\]\sMerging\sformats\sinto\s\"(.+)\"$/i;
const filePathRegex = new RegExp(`^(${DOWNLOAD_PATH}/(.+)\\.(avi|flv|mkv|mov|mp4|webm|part))$`);
const streamFilePathRegex = new RegExp(
  `file:(${DOWNLOAD_PATH}/(.+)\\.(avi|flv|mkv|mov|mp4|webm|part))'$`
);

export class YtDlpHelper {
  public readonly url: string;
  public readonly parmas: Array<string>;
  public abortController?: AbortController;
  private isDownloadStarted = false;
  private ytdlp?: ChildProcessWithoutNullStreams;
  private pid?: number;
  private metadata?: any;
  private stdout?: Readable;
  private stderr?: Readable;

  constructor(querys: { url: string; parmas?: Array<string>; pid?: number }) {
    this.url = querys.url;
    this.pid = querys.pid;
    this.metadata = undefined;
    this.abortController = undefined;
    this.parmas = querys.parmas || [];
  }

  public async start(type: 'stream' | 'video' = 'video'): Promise<this> {
    return new Promise((resolve) => {
      const abortController = new AbortController();

      const options = [
        ...this.parmas,
        '--no-playlist',
        '--verbose',
        '--progress',
        '--no-continue',
        '--windows-filenames',
        '--print',
        'after_move:filepath',
        '--merge-output-format',
        'mp4',
        '-P',
        DOWNLOAD_PATH,
        '-o',
        `%(title)s (%(width)sx%(height)s)(%(id)s).%(ext)s`,
        this.url
      ];

      if (type === 'stream') options.push('--no-part');

      const ytdlp = spawn('yt-dlp', options, {
        killSignal: 'SIGINT',
        cwd: DOWNLOAD_PATH
      });

      this.abortController = abortController;
      this.pid = ytdlp.pid;
      this.stdout = ytdlp.stdout;
      this.stderr = ytdlp.stderr;
      this.ytdlp = ytdlp;
      this.stdout.setEncoding('utf-8');
      this.stderr.setEncoding('utf-8');

      if (process.env.NODE_ENV === 'development') {
        ytdlp.stderr.on('data', (data) => {
          console.log('[stderr]', data?.trim?.());
        });
      }
      if (process.env.NODE_ENV === 'development') {
        ytdlp.stdout.on('data', (data) => {
          console.log('[stdout]', data?.trim?.());
        });
      }

      console.log(`new process, \`${this.pid}\``);

      resolve(this);
    });
  }

  public async getMetadata(): Promise<VideoMetadata> {
    if (this.metadata) {
      return new Promise((resolve) => {
        resolve(this.metadata!);
      });
    }
    let stdoutChunks = [] as Array<any>;
    const ytdlp = spawn('yt-dlp', ['--dump-json', '--no-playlist', this.url]);

    ytdlp.stdout.on('data', (data) => {
      stdoutChunks.push(data);
    });

    return new Promise((resolve, reject) => {
      ytdlp.on('exit', () => {
        try {
          const buffer = Buffer.concat(stdoutChunks);
          if (!buffer.length) {
            reject('Not found. Please check the url again.');
            return;
          }

          const json = JSON.parse(buffer.toString());
          const metadata: VideoMetadata = {
            id: json.id || '',
            original_url: json.original_url || '',
            title: json.title || '',
            description: json.description || '',
            thumbnail: json.thumbnail || '',
            is_live: json.is_live || false,
            best: {
              format_id: json.format_id ?? '',
              format_note: json.format_note ?? '',
              fps: json.fps ?? '',
              resolution: json.resolution ?? '',
              vcodec: json.vcodec ?? '',
              acodec: json.acodec ?? '',
              filesize: json.filesize ?? ''
            },
            formats:
              json.formats
                ?.map((format: VideoFormat) => {
                  return {
                    format_id: format.format_id ?? '',
                    format_note: format.format_note ?? '',
                    fps: format.fps ?? '',
                    resolution: format.resolution ?? '',
                    vcodec: format.vcodec ?? '',
                    acodec: format.acodec ?? '',
                    filesize: format.filesize ?? '',
                    video_ext: format?.video_ext ?? '',
                    audio_ext: format?.audio_ext ?? ''
                  };
                })
                .filter((format: any) => format.format_note !== 'storyboard') || []
          };
          this.metadata = metadata;
          resolve(metadata);
        } catch (e) {
          reject('failed fetching formats, downloading best available');
        }
      });
    });
  }

  getPid(): number {
    if (!this.pid) {
      throw "Process isn't started";
    }
    return this.pid;
  }

  getStdout(): Readable {
    return this.stdout!;
  }

  getStderr(): Readable {
    return this.stderr!;
  }

  getIsDownloadStarted() {
    return this.isDownloadStarted;
  }

  setIsDownloadStarted(isDownloadStarted: boolean) {
    this.isDownloadStarted = isDownloadStarted;
  }

  async writeDownloadStatusToDB(_cacheData?: Partial<VideoInfo>, isRestartDownload = false) {
    const stdout = this.stdout;
    const stderr = this.stderr;
    const metadata = this.metadata;
    const uuid = _cacheData?.uuid || randomUUID();

    if (!stderr || !stdout || !metadata) {
      return;
    }
    const cacheData: VideoInfo = {
      uuid,
      id: metadata?.id || '',
      url: this.url,
      title: metadata?.title || '',
      description: metadata?.description || '',
      thumbnail: metadata?.thumbnail || '',
      is_live: metadata.is_live,
      updatedAt: Date.now(),
      createdAt: Date.now(),
      status: 'downloading',
      file: {
        path: null,
        name: null
      },
      download: {
        completed: false,
        pid: null,
        progress: null,
        speed: null,
        format: _cacheData?.download?.format || null
      },
      ..._cacheData
    };
    try {
      if (!isRestartDownload) {
        const uuidList = (await CacheHelper.get<string[]>(VIDEO_LIST_FILE)) || [];
        uuidList.unshift(uuid);
        await CacheHelper.set(VIDEO_LIST_FILE, uuidList);
        await CacheHelper.set(uuid, cacheData);
      }
      const cacheSetThrottle = throttle(CacheHelper.set, 500);

      const handleDataMessage = async (_text: string) => {
        const message = _text?.trim?.();

        if (typeof message !== 'string' || !message) {
          return;
        }

        const messageType = /^\[([a-z]+)\]\s/i.exec(message)?.[1];
        if (!messageType) {
          const isFilePathMessage = filePathRegex.test(message);
          if (isFilePathMessage) {
            cacheData.file.path = message;
            cacheData.file.name = message.replace(DOWNLOAD_PATH + '/', '');
            cacheData.download.pid = null;
            cacheData.download.completed = true;
            cacheData.download.progress = '1';
            cacheData.status = 'completed';
          }
          return;
        }
        try {
          switch (messageType) {
            case 'download': {
              const execResult = downloadRegex.exec(message);
              if (execResult) {
                // const match = execResult[0];
                const progress = execResult[1];
                // const filesize = execResult[2];
                const speed = execResult[3];
                cacheData.status = 'downloading';
                cacheData.download.pid = this.pid!;
                cacheData.download.progress = numeral(progress).format('0.00');
                cacheData.download.completed = false;
                cacheData.download.speed = numeral(speed).format('0.0b') + '/s';
                cacheData.updatedAt = Date.now();
                await cacheSetThrottle(uuid, cacheData);
              }
              break;
            }
            case 'Merger': {
              const filePath = fileRegex.exec(message)?.[1];
              if (!filePath) {
                break;
              }

              cacheData.file.path = filePath;
              cacheData.file.name = filePath.replace(DOWNLOAD_PATH + '/', '');
              cacheData.download.pid = this.pid!;
              cacheData.download.progress = '1';
              cacheData.download.completed = false;
              cacheData.status = 'merging';
              cacheData.updatedAt = Date.now();
              await CacheHelper.set(uuid, cacheData);
              break;
            }
          }
        } catch (e) {}
      };

      const handleEndMessage = async (_text: string) => {
        console.log('complete && pid remove');
        if (cacheData.file.path) {
          let stat: Stats | null = null;
          try {
            stat = await fs.stat(cacheData.file.path);
            if (stat) {
              cacheData.download.pid = null;
              cacheData.download.completed = true;
              cacheData.download.progress = '1';
              cacheData.status = 'completed';
              cacheData.file.size = stat.size;

              try {
                const ffmpegHelper = new FFmpegHelper({
                  filePath: cacheData.file.path
                });
                const streams = await ffmpegHelper.getVideoStreams();
                cacheData.file = {
                  ...cacheData.file,
                  ...streams
                };
              } catch (error) {}
            }
          } catch (e) {}
        }
        cacheData.updatedAt = Date.now();
        await CacheHelper.set(uuid, cacheData);
      };

      // stdout
      stdout.on('data', handleDataMessage);
      stdout.on('end', handleEndMessage);

      // stderr
      stderr.on('data', handleDataMessage);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.log(e);
      }
      cacheData.download.progress = null;
      cacheData.download.pid = null;
      if ((await CacheHelper.get<VideoInfo>(uuid))?.id) {
        cacheData.updatedAt = Date.now();
        await CacheHelper.set(uuid, cacheData);
      }
    }
  }

  async writeStreamDownloadStatusToDB(_cacheData?: Partial<VideoInfo>) {
    const stdout = this.stdout;
    const stderr = this.stderr;
    const metadata = this.metadata;
    const uuid = _cacheData?.uuid || randomUUID();

    if (!stderr || !stdout || !metadata) {
      return;
    }

    const cacheData: VideoInfo = {
      uuid,
      id: metadata?.id || '',
      url: this.url,
      title: metadata?.title || '',
      description: metadata?.description || '',
      thumbnail: metadata?.thumbnail || '',
      is_live: metadata.is_live,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'recording',
      file: {
        path: null,
        name: null
      },
      download: {
        completed: false,
        pid: null,
        progress: null,
        speed: null,
        format: _cacheData?.download?.format || null
      },
      ..._cacheData
    };

    const cacheInterval = setInterval(async () => {
      cacheData.updatedAt = Date.now();
      cacheData.download.pid = this.ytdlp?.pid || null;
      await CacheHelper.set(uuid, cacheData);
    }, 3000);
    try {
      const uuidList = (await CacheHelper.get<string[]>(VIDEO_LIST_FILE)) || [];
      uuidList.unshift(uuid);
      await CacheHelper.set(VIDEO_LIST_FILE, uuidList);
      await CacheHelper.set(uuid, cacheData);
      let _fileDestination: string | null = null;

      const handleDataMessage = async (_text: string) => {
        const message = _text?.trim?.();

        if (typeof message !== 'string' || !message) {
          return;
        }
        const fileDestination =
          filePathRegex.exec(message)?.[1] || streamFilePathRegex.exec(message)?.[1];
        if (fileDestination) {
          cacheData.download.pid = this.ytdlp?.pid || null;
          cacheData.file.path = fileDestination;
          cacheData.file.name = fileDestination.replace(DOWNLOAD_PATH + '/', '');
          _fileDestination = fileDestination;
          return;
        }
      };

      const handleEnd = async () => {
        const fileDestination = _fileDestination;
        if (!fileDestination) {
          return;
        }
        let stat: Stats | null = null;
        _fileDestination = null;
        try {
          stat = await fs.stat(fileDestination);
        } catch (e) {}
        if (stat) {
          if (cacheInterval) clearInterval(cacheInterval);
          cacheData.download.pid = null;
          cacheData.download.completed = true;
          cacheData.download.progress = '1';
          cacheData.status = 'completed';
          cacheData.file.path = fileDestination;
          cacheData.file.name = fileDestination.replace(DOWNLOAD_PATH + '/', '');
          cacheData.file.size = stat.size;
          cacheData.updatedAt = Date.now();
          await CacheHelper.set(uuid, cacheData);

          try {
            const ffmpegHelper = new FFmpegHelper({
              filePath: cacheData.file.path
            });
            const streams = await ffmpegHelper.getVideoStreams();
            cacheData.file = {
              ...cacheData.file,
              ...streams
            };
          } catch (error) {}
          cacheData.updatedAt = Date.now();
          await CacheHelper.set(uuid, cacheData);
        }
      };

      stdout.on('data', handleDataMessage);
      stdout.on('end', handleEnd);
      stdout.on('close', handleEnd);

      stderr.on('data', handleDataMessage);
      stderr.on('end', handleEnd);
      stderr.on('close', handleEnd);

      this.ytdlp?.on('exit', async () => {
        if (cacheInterval) clearInterval(cacheInterval);
      });
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.log(e);
      }
    }
  }

  // 2와 15 사용을 추천, 9번은 클린업 코드가 실행 안된다.

  /**
   *
   * @param code SIGCODE
   *
   * 1	= SIGHUP							종료(연결끊기, 실행종료)
   *
   * 2	= SIGINT		CTRL + C	종료(, 인터럽트)
   *
   * 3	= SIGQUIT		CTRL + \	종료+코어 덤프
   *
   * 9	=	SIGKILL							강제종료(클린업 핸들러 불가능)
   *
   * 15	=	SIGTERM							정상종료
   *
   * 18	= SIGCONT							정리된 프로세스 재실행
   *
   * 19	=	SIGSTOP							정지(클린업 핸들러 불가능)
   *
   * 20	= SIGTSTP		CTRL + Z	정지
   */
  async kill(code = 2) {
    spawn('kill', [`-${code}`, String(this.pid)]).on('exit', () => {
      console.log(`stopped process \`${this.pid}\``);
    });
  }
}
