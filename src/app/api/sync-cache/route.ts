import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { CacheHelper } from '@/server/helpers/CacheHelper';
import { FFmpegHelper } from '@/server/helpers/FFmpegHelper';
import type { Stats } from 'fs';
import type { VideoInfo } from '@/types/video';
import { VIDEO_LIST_FILE, CACHE_PATH, CACHE_FILE_PREFIX } from '@/server/constants';

export const dynamic = 'force-dynamic';

const uuidRegex = /[0-9a-f]{8}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{12}/i;
const cacheFileRegex =
  /yt\-dlp\-cache\-[0-9a-f]{8}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{12}.json/i;

export async function POST() {
  try {
    const uuids = (await CacheHelper.get<string[]>(VIDEO_LIST_FILE)) || [];

    if (!Array.isArray(uuids) || !uuids.length) {
      return NextResponse.json({
        success: true
      });
    }

    const cachefileNameList = (await fs.readdir(CACHE_PATH, 'utf-8')).filter((f) =>
      cacheFileRegex.test(f)
    );

    const newUuids = uuids.filter((uuid) => {
      const filename = `${CACHE_FILE_PREFIX}${uuid}.json`;
      if (cachefileNameList.includes(filename)) {
        return true;
      }
      return false;
    });

    const aliveFileName: string[] = [];
    const deleteFileNameList = cachefileNameList.filter((filename) => {
      const uuid = uuidRegex.exec(filename)?.[0];
      if (uuid && uuids.includes(uuid)) {
        aliveFileName.push(filename);
        return false;
      }
      return true;
    });

    await Promise.all(
      deleteFileNameList.map((filename) => {
        fs.unlink(path.join(CACHE_PATH, filename)).catch(() => {});
      })
    );
    await CacheHelper.set(VIDEO_LIST_FILE, newUuids);

    {
      await Promise.all(
        aliveFileName.map(async (filename) => {
          let stat: Stats | null = null;
          try {
            const uuid = uuidRegex.exec(filename)?.[0];

            if (!uuid) {
              return;
            }

            const data = await CacheHelper.get<VideoInfo>(uuid);

            if (!data?.file?.path) {
              return;
            }
            if (data.status === 'recording') {
              return;
            }

            const filePath = data?.file?.path;
            stat = await fs.stat(filePath);

            if (!stat) {
              return;
            }

            const size = stat.size;

            data.file.size = size;
            data.status = 'completed';
            data.updatedAt = Date.now();

            try {
              const ffmpeg = new FFmpegHelper({
                filePath
              });
              const streams = await ffmpeg.getVideoStreams();
              data.file = {
                ...data.file,
                ...streams
              };
            } catch (error) {}
            await CacheHelper.set(uuid, data);
          } catch (e) {}
        })
      );

      return NextResponse.json({
        success: true,
        deleteUuidCount: uuids.length - newUuids.length,
        newUuids,
        deleteCacheFileCount: deleteFileNameList.length,
        deleteFileNameList
      });
    }
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
