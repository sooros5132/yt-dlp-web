import { NextResponse } from 'next/server';
import { YtDlpHelper } from '@/server/helpers/YtDlpHelper';

export async function GET(request: Request, context: { params: { url: string } }) {
  const urlObject = new URL(request.url);
  const searchParams = urlObject.searchParams;
  const url = searchParams.get('url');
  const usingCookies = searchParams.get('usingCookies') === 'true';
  const enableProxy = searchParams.get('enableProxy') === 'true';
  const proxyAddress = searchParams.get('proxyAddress') || '';

  try {
    if (typeof url !== 'string') {
      throw 'path param is only string type';
    }
    if (!/^https?:\/?\/?/i.test(url)) {
      throw 'Please add `http://` or `https://`. ex) https://www.youtube.com/xxxxx';
    }

    const ytdlp = new YtDlpHelper({
      url,
      usingCookies,
      enableProxy,
      proxyAddress: typeof proxyAddress === 'string' ? proxyAddress : ''
    });

    const metadata = await ytdlp.getMetadata();

    if (metadata.type === 'playlist') {
      throw 'No Subtitles.';
    }
    return NextResponse.json(metadata?.subtitles || {}, {
      status: 200
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
