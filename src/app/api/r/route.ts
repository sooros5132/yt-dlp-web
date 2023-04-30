import { VideoInfo } from '@/types/video';
import { YtDlpHelper } from '@/server/YtDlpHelper';
import { CacheHelper, DOWNLOAD_PATH } from '@/server/CacheHelper';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const encoder = new TextEncoder();

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
  if (!videoInfo || !videoInfo?.format) {
    return NextResponse.json(
      {
        error: 'Please delete the video file and retry download.'
      },
      {
        status: 400
      }
    );
  }
  const url = videoInfo.url;

  if (videoInfo.download.pid) {
    const ytdlp = new YtDlpHelper({
      url,
      pid: videoInfo.download.pid
    });
    ytdlp.kill();
  }

  const ytdlp = new YtDlpHelper({
    url,
    format: videoInfo.format
  });

  const metadata = await ytdlp.getMetadata();
  if (!metadata.id) {
    return;
  }

  const stream = new ReadableStream({
    async start(controller) {
      await ytdlp.start({
        uuid,
        isDownloadRestart: true,
        downloadStartCallback() {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                success: true,
                url,
                status: ytdlp.getIsFormatExist() ? 'already' : 'downloading',
                timestamp: Date.now()
              })
            )
          );
          try {
            controller?.close?.();
          } catch (e) {}
        },
        processExitCallback() {
          try {
            controller?.close?.();
          } catch (e) {}
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}
