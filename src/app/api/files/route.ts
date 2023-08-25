import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import {
  CACHE_PATH,
  CacheHelper,
  DOWNLOAD_PATH,
  VIDEO_LIST_FILE
} from '@/server/helper/CacheHelper';
import { ProcessHelper } from '@/server/helper/ProcessHelper';
import type { VideoInfo } from '@/types/video';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const uuids = body.uuids;
    const deleteFile = body.deleteFile;

    if (!Array.isArray(uuids)) {
      throw 'Param `uuids` is only Array type';
    }
    let videoList = (await CacheHelper.get<string[]>(VIDEO_LIST_FILE)) || [];
    try {
      for (const uuid of uuids) {
        if (typeof uuid !== 'string') {
          continue;
        }
        const videoInfo = await CacheHelper.get<VideoInfo>(uuid);

        if (!videoInfo) {
          await CacheHelper.delete(uuid);
          return NextResponse.json({
            success: false
          });
        }

        if (videoInfo?.download?.pid) {
          const helper = new ProcessHelper({
            pid: videoInfo.download.pid
          });
          helper.kill();
        }

        videoList = videoList.filter((_uuid) => _uuid !== videoInfo.uuid);
        try {
          if (deleteFile) {
            switch (videoInfo.type) {
              case 'video': {
                if (videoInfo.file.path) {
                  await fs.unlink(videoInfo.file.path);
                }
                break;
              }
              case 'playlist': {
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
                break;
              }
            }
          }
        } catch (e) {}

        await CacheHelper.delete(videoInfo.uuid);
      }
    } catch (e) {}
    await CacheHelper.set(VIDEO_LIST_FILE, videoList);
    return NextResponse.json({
      success: true
    });
  } catch (e) {
    return new Response(e as string, {
      status: 400
    });
  }
}
