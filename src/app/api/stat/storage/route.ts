import { DOWNLOAD_PATH } from '@/server/constants';
import { NextResponse } from 'next/server';
import numeral from 'numeral';
import checkDiskSpace from 'check-disk-space';

export const dynamic = 'force-dynamic';

export async function GET() {
  /**
   * ! fs.statfs로 사용량을 확인하면 실제와 다름.
   *
   * const stat = await fs.statfs(DOWNLOAD_PATH);
   * const total = stat.blocks * stat.bsize;
   * const available = stat.bavail * stat.bsize;
   * const free = stat.bfree * stat.bsize;
   * const usage = total - free;
   * const usageInPercentage = (usage / total) * 100;
   */

  const space = await checkDiskSpace(DOWNLOAD_PATH);

  const total = space.size;
  const free = space.free;
  const usage = total - free;
  const usageInPercentage = (usage / total) * 100;

  try {
    return NextResponse.json({
      total,
      free,
      usage,
      usageInPercentage: Number(usageInPercentage.toFixed(2))
    });
  } catch (error) {
    return new Response(error as string, {
      status: 400
    });
  }
}
