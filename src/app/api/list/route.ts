import { NextResponse } from 'next/server';
import { getVideoList } from '@/server/yt-dlp-web';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const videoList = await getVideoList();

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
