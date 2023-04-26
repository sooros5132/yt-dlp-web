import { Cache, DOWNLOAD_PATH, VIDEO_LIST_FILE } from '@/server/Cache';
import { YtDlpProcess } from '@/server/YtDlpProcess';
import { VideoInfo } from '@/types/video';
import { NextResponse } from 'next/server';

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
    const format = ['-f', _format || 'bv+ba/b'];

    //? 중복 확인
    const uuids = (await Cache.get<string[]>(VIDEO_LIST_FILE)) || [];
    if (Array.isArray(uuids) && uuids.length) {
      const videoList = await Promise.all(uuids.map((uuid) => Cache.get<VideoInfo>(uuid)));
      for (const video of videoList) {
        if (
          video?.url === url &&
          Array.isArray(video?.download?.format) &&
          video.download.format.filter((x) => format.includes(x))
        ) {
          throw 'You are already downloading in the same format.';
        }
      }
    }

    const stream = new ReadableStream({
      async start(controller) {
        const ytdlp = new YtDlpProcess({
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
          const text = _text?.trim();
          if (!ytdlp.getIsDownloadStarted() && text?.startsWith('[download]')) {
            ytdlp.setIsDownloadStarted(true);
            const alreadyFilePath = /^\[download\]\s(.+)\shas\salready\sbeen\sdownloaded$/.exec(
              text
            )?.[1];

            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  success: true,
                  url,
                  status: alreadyFilePath ? 'already' : 'downloading',
                  timestamp: Date.now()
                })
              )
            );
            const isFileMessage = /^\[download\]\sDestination\:\s(.+)$/.exec(text);
            const initData: Partial<VideoInfo> = {
              status: 'downloading',
              file: {
                name: isFileMessage ? isFileMessage[1].replace?.(DOWNLOAD_PATH + '/', '') : null,
                path: isFileMessage ? isFileMessage[1] : null
              },
              download: {
                format,
                completed: false,
                filesize: null,
                pid: null,
                progress: null,
                speed: null
              }
            };
            ytdlp.writeDownloadStatusToDB(initData);
            try {
              controller?.close?.();
            } catch (e) {
            } finally {
              stdout.off('data', handleStdoutData);
            }
          }
        };
        stdout.setEncoding('utf-8');
        stdout.on('data', handleStdoutData);

        stderr.setEncoding('utf-8');
        stderr.on('data', (data) => {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                error: data?.trim()
              })
            )
          );
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error },
      {
        status: 400
      }
    );
  }
}
