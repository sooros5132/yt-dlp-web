import { YtDlpProcess } from '../../../server/YtDlpProcess';

const encoder = new TextEncoder();
const downloadRegex =
  /^\[download\]\s+([0-9\.]+)\%\s+of\s+~\s+([0-9\.a-zA-Z\/]+)\s+at\s+([0-9a-zA_Z\.\/\ ]+)\s+ETA\s+([0-9a-zA_Z\.\/\:\ ]+)/i;

export async function GET(request: Request, context: { params: { url: string } }) {
  const urlObject = new URL(request.url);
  const searchParams = urlObject.searchParams;
  const url = searchParams.get('url');
  // const url = context?.params?.url;

  try {
    if (typeof url !== 'string') {
      throw 'Param `url` is only string type';
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

  const videoId =
    typeof searchParams.get('videoId') === 'string' ? searchParams.get('videoId') : '';
  const audioId =
    typeof searchParams.get('audioId') === 'string' ? searchParams.get('audioId') : '';

  const _format = `${videoId}${videoId && audioId ? '+' : ''}${audioId}`;

  const format = ['-f', _format || 'bv+ba/b'];

  const stream = new ReadableStream({
    async start(controller) {
      const ytdlp = new YtDlpProcess({
        url,
        parmas: [...format, '--wait-for-video', '120']
      });

      await ytdlp.start();

      const stdout = ytdlp.getStdout();
      const stderr = ytdlp.getStderr();

      const handleStdoutData = (_text: string) => {
        const text = _text?.trim();
        if (text?.startsWith('[download]')) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                success: true,
                url,
                status: /already been downloaded$/.test(text) ? 'already' : 'downloading',
                timestamp: Date.now()
              })
            )
          );
          try {
            controller?.close?.();
          } catch (e) {}
          stdout.off('data', handleStdoutData);
        }
      };
      stdout.setEncoding('utf-8');
      stdout.on('data', handleStdoutData);

      stderr.setEncoding('utf-8');
      stderr.on('data', (data) => {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              error: data?.trim()
            })
          )
        );
        if (!signal.aborted) {
          controller?.close?.();
          abortController?.abort?.();
        }
        ytdlp.kill();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}
// ytDlp.stdout.setEncoding('utf-8');
// ytDlp.stdout.on('data', (_text: string) => {
//   controller.enqueue(encoder.encode(_text));
//   const text = _text.trim();

//   if (typeof text !== 'string' || !text?.startsWith('[download]')) {
//     return;
//   }
//   const execResult = downloadRegex.exec(text);
//   if (execResult) {
//     // const match = execResult[0];
//     const progress = execResult[1];
//     const size = execResult[2];
//     const downloadSpeed = execResult[3];
//     console.log(progress, size, downloadSpeed);
//   }
// });
