import { VideoInfo } from '@/types/video';
import { YtDlpProcess } from '../../../server/YtDlpProcess';
import { Cache, DOWNLOAD_PATH } from '@/server/Cache';
import { NextResponse } from 'next/server';
import { Stats, promises as fs } from 'fs';
import numeral from 'numeral';

const encoder = new TextEncoder();

// Restart Download
export async function GET(request: Request, context: { params: { uuid: string } }) {
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

  const videoInfo = await Cache.get<VideoInfo>(uuid);
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
    const ytdlp = new YtDlpProcess({
      url,
      pid: videoInfo.download.pid
    });
    ytdlp.kill();
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
      let isDownloadStarted = false;
      console.log('start', uuid);

      const handleStdoutData = async (_text: string) => {
        const text = _text?.trim();
        console.log(text);

        if (!isDownloadStarted && text?.startsWith('[download]')) {
          isDownloadStarted = true;
          const filePath = /^\[download\]\s(.+)\shas\salready\sbeen\sdownloaded$/.exec(text)?.[1];
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                success: true,
                url,
                status: filePath ? 'already' : 'downloading',
                timestamp: Date.now()
              })
            )
          );
          controller?.close?.();
          try {
            const isCompleted = filePath?.endsWith('.mp4') || false;

            if (filePath && isCompleted) {
              let stat: Stats | null = null;
              try {
                stat = await fs.stat(filePath);
              } catch (e) {}
              const newVideoInfo: VideoInfo = {
                ...videoInfo,
                file: {
                  name: filePath || null,
                  path: filePath?.replace(DOWNLOAD_PATH + '/', '') || null
                },
                download: {
                  ...videoInfo.download,
                  completed: true,
                  progress: '1',
                  pid: null,
                  filesize: stat
                    ? numeral(stat.size).format('0.0b')
                    : videoInfo.download.filesize || ''
                }
              };
              await Cache.set(newVideoInfo.uuid, newVideoInfo);
            } else {
              ytdlp.writeDownloadStatusToDB({ ...videoInfo }, true);
            }
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
}
