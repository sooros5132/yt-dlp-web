import { spawn } from 'node:child_process';

const ffprobeResolutionRegex = /^([0-9]+)x([0-9]+)$/i;

export class FFmpegHelper {
  public readonly filePath;

  constructor(querys: { filePath: string }) {
    this.filePath = querys.filePath;
  }

  async getVideoResolution() {
    if (!this.filePath) {
      return;
    }

    return new Promise(
      (resolve: (resolution: [number, number]) => void, reject: (message: string) => void) => {
        const ffprobe = spawn('ffprobe', [
          '-v',
          'error',
          '-select_streams',
          'v:0',
          '-show_entries',
          'stream=width,height',
          '-of',
          'csv=s=x:p=0',
          this.filePath
        ]);

        ffprobe.stdout.setEncoding('utf-8');
        ffprobe.stderr.setEncoding('utf-8');

        ffprobe.stdout.on('data', (data) => {
          try {
            const text = data?.trim?.();

            if (!text) {
              return;
            }
            const resolution = ffprobeResolutionRegex.exec(text);
            if (!resolution) {
              throw 'resolution not found ';
            }

            const width = Number(resolution[1]);
            const height = Number(resolution[2]);

            if (typeof width === 'number' && typeof height === 'number') {
              return resolve([width, height]);
            }
            throw 'resolution not found ';
          } catch (e) {
            reject(e as string);
          }
        });
        ffprobe.stderr.on('data', (data) => {
          return reject(data?.trim?.() || '');
        });
      }
    );
  }

  getFilePath() {
    return this.filePath;
  }
}
