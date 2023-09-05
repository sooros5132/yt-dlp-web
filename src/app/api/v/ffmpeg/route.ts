import { getFfmpegVersion } from '@/server/yt-dlp-web';

export const dynamic = 'force-dynamic';

export async function GET() {
  let version = '';

  try {
    version = await getFfmpegVersion();
  } catch (error) {}

  return new Response(version);
}
