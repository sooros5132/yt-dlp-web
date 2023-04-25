import { spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import type { Readable } from 'node:stream';
import numeral from 'numeral';
import { Stats, promises as fs } from 'fs';
import { randomUUID } from 'node:crypto';
import { Cache, DOWNLOAD_PATH, VIDEO_LIST_FILE } from './Cache';
import path from 'path';
import { throttle } from 'lodash';
import { VideoInfo } from '@/types/video';

const downloadRegex =
  /^\[download\]\s+([0-9\.]+\%)\s+of\s+~\s+([0-9\.a-zA-Z\/]+)\s+at\s+([0-9a-zA_Z\.\/\ ]+)\s+ETA\s+([0-9a-zA_Z\.\/\:\ ]+)/i;
const fileRegex = /^\[Merger\]\sMerging\sformats\sinto\s\"(.+)\"$/i;

export class YtDlpProcess {
  public readonly url: string;
  public readonly parmas: Array<string>;
  public abortController?: AbortController;
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
          '--merge-output-format',
          'mp4',
          '-o',
          path.join(DOWNLOAD_PATH, `%(title)s (%(id)s).%(ext)s`),
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

      console.log(`new process, \`${this.pid}\``);
      callback?.();
      resolve(this);
    });
  }

  public async getMetadata(): Promise<any> {
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
          const json = JSON.parse(buffer.toString());
          const metadata = {
            id: json.id,
            original_url: json.original_url,
            title: json.title,
            description: json.description,
            thumbnail: json.thumbnail,
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
                ?.map((format: any) => {
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

  async writeDownloadStatusToDB() {
    let mergerIsExecuted = false;
    const stdout = this.stdout;
    const metadata = this.metadata;
    const uuid = randomUUID();

    if (!stdout || !metadata) {
      return;
    }
    const cacheData: VideoInfo = {
      uuid,
      url: this.url,
      title: metadata?.title || '',
      description: metadata?.description || '',
      thumbnail: metadata?.thumbnail || '',
      resolution: null,
      createdAt: Date.now(),
      file: {
        path: null,
        name: null
      },
      download: {
        completed: false,
        pid: null,
        filesize: null,
        progress: null,
        speed: null,
        format: null
      }
    };
    try {
      const uuidList = (await Cache.get<string[]>(VIDEO_LIST_FILE)) || [];
      uuidList.unshift(uuid);
      await Cache.set(VIDEO_LIST_FILE, uuidList);
      const cacheSetThrottle = throttle(Cache.set, 500);

      const handleData = async (_text: string) => {
        const text = _text.trim();

        if (typeof text !== 'string') {
          return;
        }

        if (!text?.startsWith('[download]')) {
          if (text?.startsWith('[Merger]')) {
            const filePath = fileRegex.exec(text)?.[1];
            if (filePath) {
              try {
                mergerIsExecuted = true;
                let stat: Stats | null = null;
                try {
                  stat = await fs.stat(filePath);
                } catch (e) {}

                cacheData.file.path = filePath;
                cacheData.file.name = filePath.replace(DOWNLOAD_PATH + '/', '');
                cacheData.download.pid = this.pid!;
                cacheData.download.progress = '1';
                if (stat) cacheData.download.filesize = numeral(stat.size).format('0.0b');
                await Cache.set(uuid, cacheData);
              } catch (e) {}
            }
          }
          return;
        }

        const execResult = downloadRegex.exec(text);
        if (execResult) {
          // const match = execResult[0];
          const progress = execResult[1];
          const filesize = execResult[2];
          const speed = execResult[3];
          cacheData.download.pid = this.pid!;
          cacheData.download.progress = numeral(progress).format('0.00');
          cacheData.download.filesize = numeral(filesize).format('0.0b');
          cacheData.download.speed = numeral(speed).format('0.0b') + '/s';
          await cacheSetThrottle(uuid, cacheData);
        }
      };

      stdout.setEncoding('utf-8');
      stdout.on('data', handleData);
      stdout.on('end', async () => {
        if (mergerIsExecuted) {
          console.log('complete && pid remove');
          cacheData.download.pid = null;
          cacheData.download.completed = true;
          cacheData.download.progress = '1';
          await Cache.set(uuid, cacheData);
        }
      });
    } catch (e) {
      cacheData.download.progress = null;
      await Cache.set(uuid, cacheData);
      console.error(e);
    }
  }

  async kill() {
    spawn('kill', [String(this.pid)]).on('exit', () => {
      console.log(`stopped process \`${this.pid}\``);
    });
  }
}
