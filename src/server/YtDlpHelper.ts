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
const filePathRegex = new RegExp(`^${DOWNLOAD_PATH}/((.+)\\.(avi|flv|mkv|mov|mp4|webm))$`);

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

  public async start(callback?: Function): Promise<this> {
    return new Promise((resolve) => {
      const abortController = new AbortController();

      const ytdlp = spawn(
        'yt-dlp',
        [
          ...this.parmas,
          '--verbose',
          '--progress',
          '--print',
          'after_move:filepath',
          '--merge-output-format',
          'mp4',
          '-P',
          DOWNLOAD_PATH,
          '-o',
          `%(title)s (%(id)s)(%(width)sx%(height)s).%(ext)s`,
          this.url
        ],
        {
          signal: abortController.signal
        }
      );

      this.abortController = abortController;
      this.pid = ytdlp.pid;
      this.stdout = ytdlp.stdout;
      this.stderr = ytdlp.stderr;
      this.ytdlp = ytdlp;

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
      callback?.();
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
    const ytdlp = spawn('yt-dlp', ['--dump-json', this.url]);

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

              const buf = Buffer.alloc(100);
              const file = await fs.open(cacheData.file.path);
              const { buffer } = await file.read({
                buffer: buf,
                length: 100,
                offset: 0,
                position: 0
              });
              await file.close();

              const start = buffer.indexOf(Buffer.from('mvhd')) + 16;
              const timeScale = buffer.readUInt32BE(start);
              const duration = buffer.readUInt32BE(start + 4);
              const movieLength = Math.floor(duration / timeScale);

              cacheData.file.length = movieLength;
              try {
                const ffmpegHelper = new FFmpegHelper({
                  filePath: cacheData.file.path
                });
                const resolution = await ffmpegHelper.getVideoResolution();
                cacheData.file.resolution = resolution;
              } catch (error) {}
            }
          } catch (e) {}
        }
        await CacheHelper.set(uuid, cacheData);
        this.ytdlp?.kill();
      };

      // stdout
      stdout.setEncoding('utf-8');
      stdout.on('data', handleDataMessage);
      stdout.on('end', handleEndMessage);

      // stderr
      stderr.setEncoding('utf-8');
      stderr.on('data', handleDataMessage);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.log(e);
      }
      cacheData.download.progress = null;
      cacheData.download.pid = null;
      if ((await CacheHelper.get<VideoInfo>(uuid))?.id) {
        await CacheHelper.set(uuid, cacheData);
      }
    }
  }

  async kill() {
    spawn('kill', [String(this.pid)]).on('exit', () => {
      console.log(`stopped process \`${this.pid}\``);
    });
  }
}
