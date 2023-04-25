import { YtDlpProcess } from '../../../server/YtDlpProcess';

const encoder = new TextEncoder();
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

      const metadata = await ytdlp.getMetadata();
      if (!metadata.id) {
        return;
      }
      await ytdlp.start();

      const stdout = ytdlp.getStdout();
      const stderr = ytdlp.getStderr();
      let isDownloadStarted = false;

      const handleStdoutData = async (_text: string) => {
        const text = _text?.trim();
        if (!isDownloadStarted && text?.startsWith('[download]')) {
          isDownloadStarted = true;
          const isAlready = /already been downloaded$/.test(text);
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                success: true,
                url,
                status: isAlready ? 'already' : 'downloading',
                timestamp: Date.now()
              })
            )
          );
          controller?.close?.();
          try {
            if (!isAlready) {
              ytdlp.writeDownloadStatusToDB({
                download: {
                  format,
                  completed: false,
                  filesize: null,
                  pid: null,
                  progress: null,
                  speed: null
                }
              });
            }
          } catch (e) {
          } finally {
            stdout.off('data', handleStdoutData);
          }
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
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}
