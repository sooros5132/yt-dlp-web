import childProcess from 'node:child_process';

const encoder = new TextEncoder();

export async function GET(request: Request, context: { params: { url: string } }) {
  // const urlObject = new URL(request.url);
  // const searchParams = urlObject.searchParams;
  // const url = searchParams.get('url');
  const url = context?.params?.url;

  try {
    if (typeof url !== 'string') {
      throw 'path param is only string type';
    }
    if (!/^https?:\/?\/?/i.test(url)) {
      throw 'Please add `http://` or `https://`. ex) https://www.youtube.com/xxxxx';
    }
  } catch (e) {
    return new Response(e as string, {
      status: 400
    });
  }

  const abortController = new AbortController();
  const { signal } = abortController;

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode('start download'));

      const ytDlp = childProcess.spawn(
        'yt-dlp',
        [
          // '-s',
          '--merge-output-format',
          'mp4',
          '-o',
          '/downloads/%(title)s (%(id)s).%(ext)s',
          url
        ],
        {
          signal
        }
      );
      // setTimeout(() => {
      //   ytDlp.kill();
      // }, 3000);

      ytDlp.stdout.setEncoding('utf-8');
      ytDlp.stdout.on('data', (data) => {
        controller.enqueue(encoder.encode(data));
      });

      ytDlp.stderr.setEncoding('utf-8');
      ytDlp.stderr.on('data', (data) => {
        controller.enqueue(encoder.encode(data));
        controller.close();
      });

      ytDlp.on('close', (code) => {
        console.log('close', code);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}
