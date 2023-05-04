import { CacheHelper, DOWNLOAD_PATH, VIDEO_LIST_FILE } from '@/server/CacheHelper';
import { YtDlpHelper } from '@/server/YtDlpHelper';
import { VideoInfo } from '@/types/video';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const encoder = new TextEncoder();

export async function GET(request: Request) {
  const urlObject = new URL(request.url);
  const searchParams = urlObject.searchParams;
  const url = searchParams.get('url')?.trim?.();
  // const url = context?.params?.url;

  try {
    if (typeof url !== 'string') {
      throw 'Param `url` is only string type';
    }
    if (!/^https?:\/?\/?/i.test(url)) {
      throw 'Please add `http://` or `https://`. ex) https://www.youtube.com/xxxxx';
    }

    const videoId =
      typeof searchParams.get('videoId') === 'string' ? searchParams.get('videoId') : '';
    const audioId =
      typeof searchParams.get('audioId') === 'string' ? searchParams.get('audioId') : '';

    const _format = `${videoId}${videoId && audioId ? '+' : ''}${audioId}`;
    const format = _format || 'bv+ba/b';

    let isAlreadyFormat = false;

    //? 중복 확인
    const uuids = (await CacheHelper.get<string[]>(VIDEO_LIST_FILE)) || [];
    if (Array.isArray(uuids) && uuids.length) {
      const videoList = await Promise.all(uuids.map((uuid) => CacheHelper.get<VideoInfo>(uuid)));
      for (const video of videoList) {
        if (video?.url === url && video.format === format) {
          isAlreadyFormat = true;
          // throw 'You are already downloading in the same format.';
        }
      }
    }

    const ytdlp = new YtDlpHelper({
      url,
      format
    });

    const metadata = await ytdlp.getMetadata();

    if (!metadata.id) {
      throw 'Not found. Please check the url again.';
    }

    //? 중복 확인
    if (isAlreadyFormat) {
      throw 'You are already downloading in the same format.';
    }

    const stream = new ReadableStream({
      async start(controller) {
        const uuid = randomUUID();

        await ytdlp.start({
          uuid,
          isDownloadRestart: false,
          downloadStartCallback() {
            try {
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
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
    // return NextResponse.json({
    //   success: true,
    //   url,
    //   status: 'stanby',
    //   timestamp: Date.now()
    // });

    // return new Response(stream, {
    //   headers: {
    //     'Content-Type': 'text/plain; charset=utf-8'
    //   }
    // });
  } catch (error) {
    return NextResponse.json(
      { error },
      {
        status: 400
      }
    );
  }
}
