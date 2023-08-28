import { NextResponse } from 'next/server';
import { getYtDlpVersion } from '@/server/yt-dlp-web';

export const dynamic = 'force-dynamic';

export async function GET() {
  let version = '';

  try {
    version = await getYtDlpVersion();
  } catch (error) {}

  return new Response(version);
}
