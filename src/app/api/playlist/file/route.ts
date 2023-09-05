import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { CacheHelper, VIDEO_LIST_FILE } from '@/server/helpers/CacheHelper';
import { lookup } from 'mime-types';
import { ProcessHelper } from '@/server/helpers/ProcessHelper';
import type { VideoInfo } from '@/types/video';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const urlObject = new URL(request.url);
    const searchParams = urlObject.searchParams;
    const uuid = searchParams.get('uuid');
    const itemIndex = searchParams.get('itemIndex') ? Number(searchParams.get('itemIndex')) : NaN;
    const itemUuid = searchParams.get('itemUuid');
    const isDownload = searchParams.get('download') === 'true';

    try {
      if (typeof uuid !== 'string' || !uuid.length) {
        throw '`uuid` is required and can only be of string type.';
      }
      if (typeof itemUuid !== 'string' || !itemUuid.length) {
        throw '`itemUuid` is required and can only be of string type.';
      }
      if (searchParams.get('itemIndex') && Number.isNaN(itemIndex)) {
        throw '`itemIndex` only accepts numeric types';
      }
    } catch (e) {
      return new Response(e as string, {
        status: 404
      });
    }

    const range = request.headers.get('range');

    const videoInfo = await CacheHelper.get<VideoInfo>(uuid);

    const video =
      itemIndex &&
      videoInfo?.playlist?.[itemIndex] &&
      videoInfo.playlist[itemIndex]?.uuid === itemUuid
        ? videoInfo?.playlist?.[itemIndex]
        : videoInfo?.playlist?.find((item) => item.uuid === itemUuid);

    const videoPath = video?.path;
    if (!videoPath) {
      throw 'not found';
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
          video.name || 'Untitled.mp4'
        )}; filename="${Buffer.from(video.name || 'Untitled.mp4').toString('binary')}";`
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

    try {
      const videoInfo = await CacheHelper.get<VideoInfo>(uuid);
      const videoList = (await CacheHelper.get<string[]>(VIDEO_LIST_FILE)) || [];

      if (!videoInfo) {
        return NextResponse.json({
          id: null,
          success: false
        });
      }

      if (videoInfo?.download?.pid) {
        const process = new ProcessHelper({
          pid: videoInfo.download.pid
        });
        process.kill();
      }

      const newVideoList = videoList.filter((_uuid) => _uuid !== videoInfo.uuid);
      try {
        if (deleteFile) {
          if (Array.isArray(videoInfo.playlist)) {
            for await (const item of videoInfo.playlist) {
              if (item?.path) {
                await fs.unlink(item.path);
              }
            }
          }
          if (videoInfo.playlistDirPath) {
            const dir = await fs.readdir(videoInfo.playlistDirPath, 'utf-8');
            if (dir.length === 0) {
              await fs.rmdir(videoInfo.playlistDirPath);
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
