import { spawn } from 'node:child_process';
import { Stats, promises as fs } from 'fs';
import numeral from 'numeral';
import { throttle } from 'lodash';
import { CACHE_PATH, CacheHelper, DOWNLOAD_PATH } from '@/server/CacheHelper';
import { FFmpegHelper } from '@/server/FFmpegHelper';
import type { VideoFormat, VideoInfo, VideoMetadata } from '@/types/video';

const downloadRegex =
  /^\[download\]\s+([0-9\.]+\%)\s+of\s+~\s+([0-9\.a-zA-Z\/]+)\s+at\s+([0-9a-zA_Z\.\/\ ]+)\s+ETA\s+([0-9a-zA_Z\.\/\:\ ]+)/gim;
const fileRegex = /^\[Merger\]\sMerging\sformats\sinto\s\"(.+)\"$/gm;
const filePathRegex = new RegExp(
  `^(${DOWNLOAD_PATH}/(.+)\\.(avi|flv|mkv|mov|mp4|webm|3gp|part))$`,
  'gm'
);
const streamFilePathRegex = new RegExp(
  `file:(${DOWNLOAD_PATH}/(.+)\\.(avi|flv|mkv|mov|mp4|webm|3gp|part))'$`,
  'gm'
);
const thumbnailRegex = new RegExp(
  `^\\[info\\]\\sWriting\\svideo\\sthumbnail\\s.+\\s(${DOWNLOAD_PATH}/.+)$`,
  'gm'
);
const moveThumbnailMessageRegex = new RegExp(
  `^\\[MoveFiles\\] Moving file .+${CACHE_PATH}/thumbnails/(.+)\\"$`,
  'gm'
);
export class YtDlpHelper {
  public readonly url: string;
  private readonly videoInfo: VideoInfo = {
    status: 'standby',
    uuid: '',
    id: '',
    url: '',
    title: '',
    description: '',
    thumbnail: '',
    localThumbnail: null,
    isLive: false,
    format: 'bv+ba/b',
    updatedAt: Date.now(),
    createdAt: Date.now(),
    file: {
      name: null,
      path: null
    },
    download: {
      pid: null,
      progress: null,
      speed: null
    }
  };
  private isDownloadStarted = false;
  private isFormatExist = false;
  private pid?: number;
  private metadata?: VideoMetadata;

  constructor(querys: { url: string; uuid?: string; format?: string; pid?: number }) {
    this.url = querys.url;
    this.pid = querys.pid;
    this.metadata = undefined;
    this.videoInfo.url = querys.url;
    this.videoInfo.format = querys.format || 'bv+ba/b';
    if (querys.uuid) this.videoInfo.uuid = querys.uuid;
  }

  public async start({
    uuid,
    isDownloadRestart,
    downloadStartCallback,
    downloadErrorCallback,
    processExitCallback
  }: {
    uuid: string;
    isDownloadRestart: boolean;
    downloadStartCallback?: () => void;
    downloadErrorCallback?: (error: string) => void;
    processExitCallback?: () => void;
  }): Promise<void> {
    return new Promise(async (resolve) => {
      const metadata = await this.getMetadata().catch((error: string) => error);

      if (typeof metadata === 'string') {
        const errorMessage = metadata || 'Not found. Please check the url again.';
        this.videoInfo.status = 'failed';
        this.videoInfo.error = errorMessage;
        await CacheHelper.set(uuid, this.videoInfo);
        downloadErrorCallback?.(errorMessage);
        return resolve();
      }

      if (!metadata?.id) {
        const errorMessage = 'Not found. Please check the url again.';
        this.videoInfo.status = 'failed';
        this.videoInfo.error = errorMessage;
        await CacheHelper.set(uuid, this.videoInfo);
        downloadErrorCallback?.(errorMessage);
        return resolve();
      }

      const options = [
        '-f',
        this.videoInfo.format,
        '--no-playlist',
        '--verbose',
        '--progress',
        '--no-continue',
        '--windows-filenames',
        // '--write-thumbnail',
        // '-o',
        // `thumbnail:${CACHE_PATH}/thumbnails/${CACHE_FILE_PREFIX}${uuid}.%(ext)s`,
        '--print',
        'after_move:filepath',
        '--merge-output-format',
        'mp4',
        '-P',
        DOWNLOAD_PATH,
        '-o',
        `%(title)s (%(width)sx%(height)s)(%(id)s).%(ext)s`
      ];

      if (metadata.isLive) options.push('--no-part');

      const ytdlp = spawn('yt-dlp', [...options, this.url], {
        killSignal: 'SIGINT',
        cwd: DOWNLOAD_PATH
      });
      const videoInfo = this.videoInfo;
      const throttleCacheSet = throttle(CacheHelper.set, 500);

      console.log(`new process, \`${ytdlp.pid}\``);
      console.log(`download requested, \`${videoInfo.url}\``);

      let _fileDestination: string | null = null;
      let cachingInterval: NodeJS.Timer | null = null;

      videoInfo.uuid = uuid;
      videoInfo.id = metadata?.id || '';
      videoInfo.url = this.url;
      videoInfo.title = metadata?.title || '';
      videoInfo.description = metadata?.description || '';
      videoInfo.thumbnail = metadata?.thumbnail || '';
      videoInfo.isLive = metadata?.isLive || false;
      videoInfo.updatedAt = Date.now();
      videoInfo.createdAt = Date.now();
      videoInfo.download.pid = ytdlp.pid!;

      ytdlp.stdout.setEncoding('utf-8');
      ytdlp.stderr.setEncoding('utf-8');
      if (process.env.NODE_ENV === 'development') {
        ytdlp.stdout.on('data', (data) => {
          console.log('[stdout]', data?.trim?.());
        });
        ytdlp.stderr.on('data', (data) => {
          console.log('[stderr]', data?.trim?.());
        });
      }

      const initialListener = async (_text: string) => {
        if (this.isDownloadStarted) {
          ytdlp.stdout.off('data', initialListener);
          ytdlp.stderr.off('data', initialListener);
          return;
        }
        const text = _text?.trim?.();
        if (!text) return;

        try {
          // Search Thumbnail
          // if (!videoInfo.localThumbnail) {
          //   const findThumbnail = thumbnailRegex.exec(text)?.[1];
          //   if (findThumbnail) {
          //     videoInfo.localThumbnail = findThumbnail;
          //     return;
          //   }
          // }

          if (text.endsWith('has already been downloaded')) {
            this.isFormatExist = true;
            const error = 'Has already been downloaded';
            this.videoInfo.status = 'failed';
            this.videoInfo.error = error;
            await CacheHelper.set(uuid, this.videoInfo);
            return downloadErrorCallback?.(error);
          }

          if (text.startsWith('ERROR: ')) {
            const error = text?.split('\n')?.[0] || text;
            this.videoInfo.status = 'failed';
            this.videoInfo.error = error;
            await CacheHelper.set(uuid, this.videoInfo);
            return downloadErrorCallback?.(error);
          }

          let fileDestination = '';
          if (metadata.isLive) {
            fileDestination = streamFilePathRegex.exec(text)?.[1] || '';
          } else {
            fileDestination = /^\[download\]\sDestination\:\s(.+)$/gm.exec(text)?.[1] || '';
          }

          if (!fileDestination) {
            return;
          }
          if (metadata.isLive) {
            videoInfo.status = 'recording';
          } else {
            videoInfo.status = 'downloading';
          }
          videoInfo.file.name = fileDestination.replace(DOWNLOAD_PATH + '/', '');
          videoInfo.file.path = fileDestination;

          if (metadata.isLive) {
            cachingInterval = setInterval(async () => {
              videoInfo.updatedAt = Date.now();
              videoInfo.download.pid = ytdlp?.pid || null;
              await throttleCacheSet(uuid, videoInfo);
            }, 3000);
          }

          try {
            // if (!isDownloadRestart) {
            // const uuidList = (await CacheHelper.get<string[]>(VIDEO_LIST_FILE)) || [];
            // uuidList.unshift(uuid);
            // await CacheHelper.set(VIDEO_LIST_FILE, uuidList);
            await CacheHelper.set(uuid, videoInfo);
            // }
          } catch (e) {}

          ytdlp.stdout.off('data', initialListener);
          ytdlp.stderr.off('data', initialListener);
          this.setIsDownloadStarted(true);
          ytdlp.stdout.on('data', downloadListener);
          ytdlp.stderr.on('data', downloadListener);

          downloadStartCallback?.();
        } catch (e) {}
      };

      const streamDownloadListener = async (message: string) => {
        // const movedThumbnailDestination = moveThumbnailMessageRegex.exec(message)?.[1];

        // if (movedThumbnailDestination) {
        //   videoInfo.status = 'merging';
        //   videoInfo.localThumbnail = movedThumbnailDestination.replace(
        //     new RegExp(`^${CACHE_FILE_PREFIX}`),
        //     ''
        //   );
        //   return;
        // }

        if (message.startsWith('[Fixup')) {
          videoInfo.status = 'merging';
          return;
        }

        const fileDestination = filePathRegex.exec(message)?.[1];

        if (fileDestination) {
          videoInfo.download.pid = ytdlp?.pid || null;
          videoInfo.file.path = fileDestination;
          videoInfo.file.name = fileDestination.replace(DOWNLOAD_PATH + '/', '');
          _fileDestination = fileDestination;
          return;
        }
      };

      const videoDownloadListener = async (message: string) => {
        const messageType = /^\[([a-z]+)\]\s/i.exec(message)?.[1];
        if (!messageType) {
          const isFilePathMessage = filePathRegex.test(message);
          if (isFilePathMessage) {
            videoInfo.file.path = message;
            videoInfo.file.name = message.replace(DOWNLOAD_PATH + '/', '');
            videoInfo.download.pid = null;
            videoInfo.download.progress = '1';
            videoInfo.status = 'completed';
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
                videoInfo.status = 'downloading';
                videoInfo.download.pid = ytdlp.pid!;
                videoInfo.download.progress = numeral(progress).format('0.00');
                videoInfo.download.speed = numeral(speed).format('0.0b') + '/s';
                videoInfo.updatedAt = Date.now();
                await throttleCacheSet(uuid, videoInfo);
              }
              break;
            }
            case 'Merger': {
              const filePath = fileRegex.exec(message)?.[1];
              if (!filePath) {
                break;
              }

              videoInfo.file.path = filePath;
              videoInfo.file.name = filePath.replace(DOWNLOAD_PATH + '/', '');
              videoInfo.download.pid = ytdlp.pid!;
              videoInfo.download.progress = '1';
              videoInfo.status = 'merging';
              videoInfo.updatedAt = Date.now();
              await CacheHelper.set(uuid, videoInfo);
              break;
            }

            // case 'MoveFiles': {
            //   const movedThumbnailDestination = moveThumbnailMessageRegex.exec(message)?.[1];
            //   if (movedThumbnailDestination) {
            //     videoInfo.localThumbnail = movedThumbnailDestination.replace(
            //       new RegExp(`^${CACHE_FILE_PREFIX}`),
            //       ''
            //     );
            //   }
            //   break;
            // }
          }
        } catch (e) {}
      };

      const streamDownloadEndListener = async () => {
        if (!this.isDownloadStarted) return;
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
          if (cachingInterval) clearInterval(cachingInterval);

          videoInfo.download.pid = null;
          videoInfo.download.progress = '1';
          videoInfo.status = 'completed';
          videoInfo.file.path = fileDestination;
          videoInfo.file.name = fileDestination.replace(DOWNLOAD_PATH + '/', '');
          videoInfo.file.size = stat.size;
          videoInfo.updatedAt = Date.now();
          await CacheHelper.set(uuid, videoInfo);

          try {
            const ffmpegHelper = new FFmpegHelper({
              filePath: videoInfo.file.path
            });
            const streams = await ffmpegHelper.getVideoStreams();
            videoInfo.file = {
              ...videoInfo.file,
              ...streams
            };
          } catch (error) {}
          videoInfo.updatedAt = Date.now();
          await CacheHelper.set(uuid, videoInfo);
        }
      };

      const videoDownloadEndListener = async () => {
        if (!this.isDownloadStarted) return;
        if (videoInfo.file.path) {
          let stat: Stats | null = null;
          try {
            stat = await fs.stat(videoInfo.file.path);
            if (stat) {
              videoInfo.download.pid = null;
              videoInfo.download.progress = '1';
              videoInfo.status = 'completed';
              videoInfo.file.size = stat.size;

              const ffmpegHelper = new FFmpegHelper({
                filePath: videoInfo.file.path
              });
              const streams = await ffmpegHelper.getVideoStreams();
              videoInfo.file = {
                ...videoInfo.file,
                ...streams
              };
            }
          } catch (e) {}
        }
        videoInfo.updatedAt = Date.now();
        await CacheHelper.set(uuid, videoInfo);
      };

      const downloadListener = async (_text: string) => {
        const message = _text?.trim?.();
        if (!message) return;

        if (metadata.isLive) {
          await streamDownloadListener(message);
        } else {
          await videoDownloadListener(message);
        }
      };

      ytdlp.stdout.on('data', initialListener);
      ytdlp.stderr.on('data', initialListener);
      ytdlp.stdout.on(
        'end',
        metadata.isLive ? streamDownloadEndListener : videoDownloadEndListener
      );

      ytdlp?.on('exit', async () => {
        if (cachingInterval) clearInterval(cachingInterval);
        processExitCallback?.();
      });

      return resolve();
    });
  }

  public async getMetadata(): Promise<VideoMetadata> {
    if (this.metadata) {
      return new Promise((resolve) => {
        resolve(this.metadata!);
      });
    }
    let stdoutChunks = [] as Array<any>;
    let stderrMessage = '';
    const ytdlp = spawn('yt-dlp', ['--dump-json', '--no-playlist', this.url]);

    ytdlp.stdout.on('data', (data) => {
      stdoutChunks.push(data);
    });

    ytdlp.stderr.setEncoding('utf-8');
    ytdlp.stderr.on('data', (data) => {
      const text = data?.trim?.();
      if (text.startsWith('ERROR: ')) {
        stderrMessage = text?.split('\n')?.[0] || text;
      }
    });

    return new Promise((resolve, reject) => {
      ytdlp.on('exit', () => {
        try {
          const buffer = Buffer.concat(stdoutChunks);
          if (!buffer.length) {
            reject(stderrMessage || 'Not found. Please check the url again.');
            return;
          }

          const json = JSON.parse(buffer.toString());

          const metadata: VideoMetadata = {
            id: json.id || '',
            originalUrl: json.original_url || '',
            title: json.title || '',
            description: json.description || '',
            thumbnail: json.thumbnail || '',
            isLive: json.is_live || false,
            best: {
              formatId: json.format_id ?? '',
              formatNote: json.format_note ?? '',
              fps: json.fps ?? '',
              resolution: json.resolution ?? '',
              width: json.width ?? '',
              height: json.height ?? '',
              dynamicRange: json.dynamic_range ?? '',
              vcodec: json.vcodec ?? '',
              acodec: json.acodec ?? '',
              filesize: json.filesize ?? ''
            },
            formats:
              json.formats
                ?.map((format: any) => {
                  return {
                    formatId: format.format_id ?? '',
                    formatNote: format.format_note ?? '',
                    resolution: format.resolution ?? '',
                    fps: format.fps ?? '',
                    dynamicRange: format.dynamic_range ?? '',
                    vcodec: format.vcodec ?? '',
                    acodec: format.acodec ?? '',
                    filesize: format.filesize ?? '',
                    videoExt: format?.video_ext ?? '',
                    audioExt: format?.audio_ext ?? '',
                    width: format?.width ?? '',
                    height: format?.height ?? ''
                  } as VideoFormat;
                })
                .filter((format: any) => format.format_note !== 'storyboard') || []
          };
          this.metadata = metadata;
          resolve(metadata);
        } catch (e) {
          reject(e || 'failed fetching formats, downloading best available');
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

  getVideoInfo() {
    return this.videoInfo;
  }

  getIsDownloadStarted() {
    return this.isDownloadStarted;
  }

  setIsDownloadStarted(isDownloadStarted: boolean) {
    this.isDownloadStarted = isDownloadStarted;
  }

  getIsFormatExist() {
    return this.isFormatExist;
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
