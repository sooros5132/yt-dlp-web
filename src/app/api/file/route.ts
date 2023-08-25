import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import {
  CACHE_PATH,
  CacheHelper,
  DOWNLOAD_PATH,
  VIDEO_LIST_FILE
} from '@/server/helper/CacheHelper';
import { lookup } from 'mime-types';
import { ProcessHelper } from '@/server/helper/ProcessHelper';
import type { VideoInfo } from '@/types/video';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const urlObject = new URL(request.url);
    const searchParams = urlObject.searchParams;
    const uuid = searchParams.get('uuid');
    const isDownload = searchParams.get('download') === 'true';

    try {
      if (typeof uuid !== 'string') {
        throw 'Param `uuid` is only string type';
      }
    } catch (e) {
      return new Response(e as string, {
        status: 404
      });
    }

    const range = request.headers.get('range');

    const videoInfo = await CacheHelper.get<VideoInfo>(uuid);

    const videoPath = videoInfo?.file?.path;
    if (!videoPath) {
      throw 'videoPath is not found';
    }

    const stat = await fs.stat(videoPath);

    const file = await fs.open(videoPath, 'r');
    const videoSize = stat?.size;

    // Video Stream
    if (range && stat) {
      // 1024 * 1024 * 2 = 2MB (4K 이상은 1MB로 부족해서 2MB로 늘렸다.)
      const CHUNK_SIZE = 1024 * 1024 * 2;

      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end =
        parts[1] && parseInt(parts[1]) < CHUNK_SIZE
          ? parseInt(parts[1], 10)
          : Math.min(start + CHUNK_SIZE, videoSize - 1);
      const chunksize = end - start + 1;

      const videoStream = file.createReadStream({ start, end });
      return new Response(videoStream as any, {
        headers: {
          'Content-Range': `bytes ${start}-${end}/${videoSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': `${chunksize}`,
          'Content-Type': lookup(videoPath) || 'video/mp4'
        },
        status: 206
      });
    }

    // File Get
    const videoStream = file.createReadStream();
    videoStream.on('finish', () => {
      try {
        videoStream?.close?.();
      } catch (e) {}
    });

    return new Response(videoStream as any, {
      headers: {
        'Content-Length': `${videoSize}`,
        'Content-Type': lookup(videoPath) || 'video/mp4',
        //! WARNING: encodeURIComponent 사용하면 파일이름이 깨짐.
        'Content-Disposition': `${
          isDownload ? 'attachment; ' : ''
        }filename*=utf-8''${encodeURIComponent(
          videoInfo.file.name || 'Untitled.mp4'
        )}; filename="${Buffer.from(videoInfo.file.name || 'Untitled.mp4').toString('binary')}";`
      },
      status: 200
    });
  } catch (error) {
    return NextResponse.json(
      {
        error
      },
      {
        status: 404
      }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const urlObject = new URL(request.url);
    const searchParams = urlObject.searchParams;
    const uuid = searchParams.get('uuid');
    const deleteFile = searchParams.get('deleteFile') === 'true';
    if (typeof uuid !== 'string') {
      throw 'Param `uuid` is only string type';
    }
    // const video = await prisma.video.findUnique({ where: { uuid } });

    // const videoPath = video?.filePath!;
    // if (!videoPath) {
    //   throw 'videoPath is not found';
    // }
    try {
      // await fs.unlink(videoPath);

      const videoInfo = await CacheHelper.get<VideoInfo>(uuid);
      const videoList = (await CacheHelper.get<string[]>(VIDEO_LIST_FILE)) || [];

      if (!videoInfo) {
        return NextResponse.json({
          id: null,
          success: false
        });
      }

      if (videoInfo?.download?.pid) {
        const helper = new ProcessHelper({
          pid: videoInfo.download.pid
        });
        helper.kill();
      }

      const newVideoList = videoList.filter((_uuid) => _uuid !== videoInfo.uuid);
      try {
        if (deleteFile && videoInfo.file.path) {
          await fs.unlink(videoInfo.file.path);
          if (videoInfo.localThumbnail) {
            if (videoInfo.localThumbnail.startsWith(DOWNLOAD_PATH)) {
              await fs.unlink(videoInfo.localThumbnail);
            } else {
              await fs.unlink(CACHE_PATH + '/thumbnails/' + videoInfo.localThumbnail);
            }
          }
        }
      } catch (e) {}
      await CacheHelper.delete(videoInfo.uuid);
      await CacheHelper.set(VIDEO_LIST_FILE, newVideoList);
      return NextResponse.json({
        uuid: videoInfo.uuid,
        success: true
      });
    } catch (e) {}
  } catch (e) {
    return new Response(e as string, {
      status: 400
    });
  }
}
