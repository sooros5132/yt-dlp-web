import { NextResponse } from 'next/server';
import { YtDlpHelper } from '@/server/helpers/YtDlpHelper';
import { checkRequiredFoldersAreAccessible } from '@/server/helpers/PermissionHelper';

// const encoder = new TextEncoder();

export async function GET(request: Request, context: { params: { url: string } }) {
  const urlObject = new URL(request.url);
  const searchParams = urlObject.searchParams;
  const url = searchParams.get('url');
  const usingCookies = searchParams.get('usingCookies') === 'true';
  const enableProxy = searchParams.get('enableProxy') === 'true';
  const proxyAddress = searchParams.get('proxyAddress') || '';
  // const url = context?.params?.url;
  // const abortController = new AbortController();
  // const { signal } = abortController;

  try {
    if (typeof url !== 'string') {
      throw 'path param is only string type';
    }
    if (!/^https?:\/?\/?/i.test(url)) {
      throw 'Please add `http://` or `https://`. ex) https://www.youtube.com/xxxxx';
    }

    await checkRequiredFoldersAreAccessible();

    const ytdlp = new YtDlpHelper({
      url,
      usingCookies,
      enableProxy,
      proxyAddress: typeof proxyAddress === 'string' ? proxyAddress : ''
    });

    const metadata = await ytdlp.getMetadata();

    return NextResponse.json(metadata, {
      status: 200
    });
    //! WARNING: If the message is very long, it gets fired in the middle. It should be used in a stream manner.
    // const stream = new ReadableStream({
    //   async start(controller) {
    //     const ytDlp = childProcess.spawn(
    //       'yt-dlp',
    //       ['--dump-json', '--wait-for-video', '120', url],
    //       {
    //         signal
    //       }
    //     );

    //     ytDlp.stdout.setEncoding('utf-8');
    //     ytDlp.stdout.on('data', (_text: string) => {
    //       controller.enqueue(encoder.encode(_text));
    //     });

    //     ytDlp.stderr.setEncoding('utf-8');
    //     ytDlp.stderr.on('data', (data) => {
    //       controller.enqueue(encoder.encode(JSON.stringify({ error: data })));
    //       controller.error();
    //       if (!signal.aborted) {
    //         controller?.close?.();
    //         abortController?.abort?.();
    //       }
    //       ytDlp.kill();
    //     });

    //     ytDlp.on('close', () => {
    //       ytDlp.kill();
    //       if (!signal.aborted) {
    //         controller?.close?.();
    //         abortController?.abort?.();
    //       }
    //     });
    //   }
    // });
    //! WARNING: If the message is very long, it gets fired in the middle. It should be used in a stream manner.
    // return new Response(stream, {
    //   headers: {
    //     'Content-Type': 'application/json; charset=utf-8'
    //   }
    // });
  } catch (error) {
    // if (!signal.aborted) {
    //   abortController?.abort?.();
    // }
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
