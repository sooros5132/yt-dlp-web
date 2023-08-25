import { NextResponse } from 'next/server';
import type { VideoInfo } from '@/types/video';
import { YtDlpHelper } from '@/server/helper/YtDlpHelper';
import { CacheHelper } from '@/server/helper/CacheHelper';
import { ProcessHelper } from '@/server/helper/ProcessHelper';

export const dynamic = 'force-dynamic';

const encoder = new TextEncoder();

// Restart Download
export async function GET(request: Request) {
  const urlObject = new URL(request.url);
  const searchParams = urlObject.searchParams;
  const uuid = searchParams.get('uuid');
  if (typeof uuid !== 'string') {
    return NextResponse.json({ error: 'Param `uuid` is only string type' }, { status: 400 });
  }

  const videoInfo = await CacheHelper.get<VideoInfo>(uuid);
  if (!videoInfo || !videoInfo?.format) {
    return NextResponse.json(
      { error: 'Please delete the video file and retry download.' },
      { status: 400 }
    );
  }
  const url = videoInfo.url;

  if (videoInfo?.download?.pid) {
    new ProcessHelper({ pid: videoInfo.download.pid }).kill();
  }

  const ytdlp = new YtDlpHelper({
    url,
    format: videoInfo.format,
    uuid: videoInfo.uuid,
    usingCookies: videoInfo?.usingCookies || false,
    embedChapters: videoInfo?.embedChapters || false,
    // embedMetadata: videoInfo?.embedMetadata || false,
    embedSubs: videoInfo?.embedSubs || false,
    enableProxy: videoInfo?.enableProxy || false,
    proxyAddress: videoInfo?.proxyAddress || '',
    enableLiveFromStart: videoInfo?.enableLiveFromStart || false,
    cutVideo: videoInfo?.cutVideo || false,
    cutStartTime: videoInfo?.cutStartTime || '',
    cutEndTime: videoInfo?.cutEndTime || '',
    outputFilename: videoInfo?.outputFilename || '',
    selectQuality: videoInfo?.selectQuality || '',
    enableForceKeyFramesAtCuts: videoInfo?.enableForceKeyFramesAtCuts || false
  });

  const stream = new ReadableStream({
    async start(controller) {
      await ytdlp
        .start({
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
          downloadErrorCallback(error) {
            try {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    success: false,
                    url,
                    error: error,
                    timestamp: Date.now()
                  })
                )
              );
              controller?.close?.();
            } catch (e) {}
          },
          processExitCallback() {
            try {
              controller?.close?.();
            } catch (e) {}
          }
        })
        .catch(() => {});
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}
