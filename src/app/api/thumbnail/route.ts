import { CACHE_FILE_PREFIX, CACHE_PATH, CacheHelper } from '@/server/helper/CacheHelper';
import { promises as fs } from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const getUrlObject = new URL(request.url);
    const searchParams = getUrlObject.searchParams;
    const uuid = searchParams.get('uuid');

    try {
      if (typeof uuid !== 'string') {
        throw 'Param `uuid` is only string type';
      }
    } catch (e) {
      return new Response(e as string, {
        status: 404
      });
    }

    try {
      const data = await CacheHelper.get(uuid);
      if (!data) {
        throw 'Not Found';
      }

      const thumbnailPath = CACHE_PATH + '/thumbnails/' + CACHE_FILE_PREFIX + data.localThumbnail;

      const file = await fs.open(thumbnailPath, 'r');
      if (!file) {
        throw 'Not Found';
      }

      // File Get
      const videoStream = file.createReadStream();
      videoStream.on('finish', () => {
        try {
          videoStream?.close?.();
        } catch (e) {}
      });

      return new Response(videoStream as any, {
        status: 200
      });
    } catch (e) {
      return new Response('Not Found', {
        status: 404
      });
    }
  } catch (error) {
    return new Response(error as string, {
      status: 400
    });
  }
}
