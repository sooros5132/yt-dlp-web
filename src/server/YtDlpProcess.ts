import { spawn } from 'node:child_process';
import type { Readable } from 'node:stream';

export class YtDlpProcess {
  public readonly url: string;
  public readonly parmas: Array<string>;
  public abortController?: AbortController;
  private pid?: number;
  private metadata?: any;
  private stdout: Readable;
  private stderr: Readable;

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

      const ytldp = spawn(
        'yt-dlp',
        [
          ...this.parmas,
          '--merge-output-format',
          'mp4',
          '-o',
          '/downloads/%(title)s (%(id)s).%(ext)s',
          this.url
        ],
        {
          signal: abortController.signal
        }
      );

      this.abortController = abortController;
      this.pid = ytldp.pid;
      this.stdout = ytldp.stdout;
      this.stderr = ytldp.stderr;

      console.log('proc', `Spawned a new process, pid: ${this.pid}`);
      callback?.();
      resolve(this);
    });
  }

  public async getMetadata() {
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
          resolve(metadata);
          this.metadata = metadata;
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
    return this.stdout;
  }

  getStderr(): Readable {
    return this.stderr;
  }

  async kill() {
    spawn('kill', [String(this.pid)]).on('exit', () => {
      console.log('proc', `Stopped ${this.pid} because SIGKILL`);
    });
  }
}
