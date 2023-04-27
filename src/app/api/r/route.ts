import { VideoInfo } from '@/types/video';
import { YtDlpHelper } from '@/server/YtDlpHelper';
import { CacheHelper, DOWNLOAD_PATH } from '@/server/CacheHelper';
import { NextResponse } from 'next/server';
import { Stats, promises as fs } from 'fs';
import { FFmpegHelper } from '@/server/FFmpegHelper';

const encoder = new TextEncoder();
const filePathRegex = new RegExp(`^${DOWNLOAD_PATH}/((.+)\\.(avi|flv|mkv|mov|mp4|webm))$`);

// Restart Download
export async function GET(request: Request) {
  const urlObject = new URL(request.url);
  const searchParams = urlObject.searchParams;
  const uuid = searchParams.get('uuid');
  if (typeof uuid !== 'string') {
    return NextResponse.json(
      {
        error: 'Param `uuid` is only string type'
      },
      {
        status: 400
      }
    );
  }

  const videoInfo = await CacheHelper.get<VideoInfo>(uuid);
  if (!videoInfo || !videoInfo?.download.format) {
    return NextResponse.json(
      {
        error: 'Please delete the video file and retry download.'
      },
      {
        status: 400
      }
    );
  }
  const format = videoInfo.download.format || [];
  const url = videoInfo.url;

  if (videoInfo.download.pid) {
    const ytdlp = new YtDlpHelper({
      url,
      pid: videoInfo.download.pid
    });
    ytdlp.kill();
  }

  const stream = new ReadableStream({
    async start(controller) {
      const ytdlp = new YtDlpHelper({
        url,
        parmas: [...format, '--wait-for-video', '120']
      });

      const metadata = await ytdlp.getMetadata();
      if (!metadata.id) {
        return;
      }
      await ytdlp.start();

      const stdout = ytdlp.getStdout();
      const stderr = ytdlp.getStderr();

      const handleStdoutData = async (_text: string) => {
        const text = _text?.trim?.();

        if (ytdlp.getIsDownloadStarted() || !text) {
          return;
        }

        const fileDestination = filePathRegex.exec(text)?.[0];
        if (!text?.startsWith('[download]') && !fileDestination) {
          return;
        }

        ytdlp.setIsDownloadStarted(true);

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              success: true,
              url,
              status: fileDestination ? 'already' : 'downloading',
              timestamp: Date.now()
            })
          )
        );
        try {
          let stat: Stats | null = null;
          try {
            if (fileDestination) stat = await fs.stat(fileDestination!);
          } catch (e) {}
          const newVideoInfo: VideoInfo = {
            ...videoInfo,
            file: {
              ...videoInfo.file,
              name: fileDestination?.replace?.(DOWNLOAD_PATH + '/', '') || null,
              path: fileDestination || null
            },
            download: {
              ...videoInfo.download,
              completed: false,
              progress: '0',
              pid: null
            }
          };

          if (stat) newVideoInfo.file.size = stat?.size;

          if (stat && fileDestination) {
            const ffmpegHelper = new FFmpegHelper({
              filePath: fileDestination
            });
            const resolution = await ffmpegHelper.getVideoResolution();
            newVideoInfo.file.resolution = resolution;
            newVideoInfo.download.completed = true;
            newVideoInfo.download.progress = '1';
            newVideoInfo.status = 'completed';
            await CacheHelper.set(uuid, newVideoInfo);
          } else {
            ytdlp.writeDownloadStatusToDB(newVideoInfo, true);
          }
        } catch (e) {
        } finally {
          try {
            controller?.close?.();
          } catch (e) {}
          stdout.off('data', handleStdoutData);
        }
      };
      stdout.setEncoding('utf-8');
      stdout.on('data', handleStdoutData);
      stdout.on('end', () => {
        try {
          controller?.close?.();
        } catch (e) {}
      });
      stderr.on('end', () => {
        try {
          controller?.close?.();
        } catch (e) {}
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}
