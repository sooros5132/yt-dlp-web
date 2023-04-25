import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { VideoInfo } from '@/types/video';
import { Cache } from '@/server/Cache';

export async function GET(request: Request) {
  try {
    const urlObject = new URL(request.url);
    const searchParams = urlObject.searchParams;
    const id = searchParams.get('id');
    // const url = context?.params?.url;

    try {
      if (typeof id !== 'string') {
        throw 'Param `id` is only string type';
      }
    } catch (e) {
      return new Response(e as string, {
        status: 400
      });
    }
    const range = request.headers.get('range');

    if (!range) {
      throw 'Requires Range header';
    }

    const videoInfo = await Cache.get<VideoInfo>(id);

    const videoPath = videoInfo?.file.path!;
    if (!videoPath) {
      throw 'videoPath is not found';
    }

    const stat = await fs.stat(videoPath);
    const videoSize = stat.size;

    const CHUNK_SIZE = 1024 * 1024 * 3; // 3MB (4K 는 1MB로 부족하다.)
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
