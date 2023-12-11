import { NextResponse } from 'next/server';
import { getVideoList } from '@/server/yt-dlp-web';
import { CacheHelper } from '@/server/helpers/CacheHelper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const clientETagInHeader = request.headers.get('If-None-Match')?.trim?.() || '';
    const lastModified = CacheHelper.getLastModified();
    const responseOptions: ResponseInit = {};

    if (lastModified?.ETag) {
      if (clientETagInHeader) {
        let serverETag = lastModified?.ETag;
        const executed = /^([wW]\/)?"?([^"]+)"?$/.exec(clientETagInHeader);

        if (executed) {
          let [, isWeak, clientETag] = executed;
          if (isWeak) {
            serverETag = serverETag.toLowerCase();
            clientETag = clientETag.toLowerCase();
          }

          if (clientETag === serverETag) {
            return new Response(null, {
              status: 304
            });
          }
        }
      }

      responseOptions.headers = {
        'Cache-Control': 'public, max-age=0, must-revalidate',
        ETag: `"${lastModified.ETag}"`
      };
    }

    const videoList = await getVideoList();

    return NextResponse.json(videoList, responseOptions);
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
