import { NextResponse } from 'next/server';
import { CacheHelper, VIDEO_LIST_FILE } from '@/server/CacheHelper';
import type { VideoInfo } from '@/types/video';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const uuids = (await CacheHelper.get<string[]>(VIDEO_LIST_FILE)) || [];

    if (!Array.isArray(uuids) || !uuids.length) {
      return NextResponse.json([]);
    }

    const videoList = (
      await Promise.all(
        uuids.map((uuid) =>
          // one more retry
          CacheHelper.get<VideoInfo>(uuid).then(
            async (res) => res || (await CacheHelper.get<VideoInfo>(uuid))
          )
        )
      )
    ).filter((video) => video);

    return NextResponse.json(videoList);
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
