import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { VideoInfo } from '@/types/video';
import { Cache } from '@/server/Cache';

export async function GET(request: Request) {
  try {
    const urlObject = new URL(request.url);
    const searchParams = urlObject.searchParams;
    const uuid = searchParams.get('uuid');
    // const url = context?.params?.url;

    if (typeof uuid !== 'string') {
      throw '`uuid` can only be string type.';
    }
    const range = request.headers.get('range');

    if (!range) {
      throw 'Requires Range header';
    }

    const videoInfo = await Cache.get<VideoInfo>(uuid);

    const videoPath = videoInfo?.file?.path;
    if (!videoPath) {
      throw 'videoPath is not found';
    }

    const stat = await fs.stat(videoPath);
    const videoSize = stat.size;

    // 1024 * 1024 * 3 = 3MB (4K 이상은 1MB로 부족해서 3으로 늘렸다.)
    const CHUNK_SIZE = 1024 * 1024 * 3;
    const start = Number(range.replace(/\D/g, ''));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    const contentLength = end - start + 1;

    const file = await fs.open(videoPath, 'r');
    const videoStream = file.createReadStream({ start, end });

    return new Response(videoStream as any, {
      headers: {
        'Content-Range': `bytes ${start}-${end}/${videoSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': `${contentLength}`,
        'Content-Type': 'video/mp4'
      },
      status: 206
    });
  } catch (error) {
    return NextResponse.json(
      {
        error
      },
      {
        status: 400
      }
    );
  }
}
