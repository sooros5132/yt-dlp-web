import { CACHE_FILE_PREFIX, CACHE_PATH, Cache, VIDEO_LIST_FILE } from '@/server/Cache';
import { NextResponse } from 'next/server';
import { Stats, promises as fs } from 'fs';
import path from 'path';
import { VideoInfo } from '@/types/video';
import { FFmpegHelper } from '@/server/FFmpegHelper';

export const dynamic = 'force-dynamic';

const uuidRegex = /[0-9a-f]{8}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{12}/i;
const cacheFileRegex =
  /yt\-dlp\-cache\-[0-9a-f]{8}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{12}.json/i;

export async function POST() {
  try {
    const uuids = (await Cache.get<string[]>(VIDEO_LIST_FILE)) || [];

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
    await Cache.set(VIDEO_LIST_FILE, newUuids);

    {
      await Promise.all(
        aliveFileName.map(async (filename) => {
          let stat: Stats | null = null;
          try {
            const uuid = uuidRegex.exec(filename)?.[0];

            if (!uuid) {
              return;
            }

            const data = await Cache.get<VideoInfo>(uuid);

            if (!data?.file?.path) {
              return;
            }

            const filePath = data?.file?.path;
            stat = await fs.stat(filePath);

            if (!stat) {
              return;
            }

            const buf = Buffer.alloc(100);
            const file = await fs.open(filePath);
            const { buffer } = await file.read({
              buffer: buf,
              length: 100,
              offset: 0,
              position: 0
            });
            await file.close();

            const start = buffer.indexOf(Buffer.from('mvhd')) + 16;
            const timeScale = buffer.readUInt32BE(start);
            const duration = buffer.readUInt32BE(start + 4);
            const movieLength = Math.floor(duration / timeScale);

            const size = stat.size;
            const length = movieLength;

            data.file.size = size;
            data.file.length = length;

            try {
              const ffmpegHelper = new FFmpegHelper({
                filePath
              });
              const resolution = await ffmpegHelper.getVideoResolution();
              data.file.resolution = resolution;
            } catch (error) {}
            await Cache.set(uuid, data);
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
