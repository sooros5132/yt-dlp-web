import { CacheHelper } from '@/server/CacheHelper';
import { YtDlpHelper } from '@/server/YtDlpHelper';
import { VideoInfo } from '@/types/video';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, context: any) {
  try {
    const body = await request.json();
    const uuid = body.uuid;
    if (typeof uuid !== 'string') {
      throw 'Param `uuid` is only string type';
    }
    const videoInfo = await CacheHelper.get<VideoInfo>(uuid);

    if (!videoInfo) {
      return NextResponse.json({
        uuid: null,
        success: false
      });
    }

    const pid = videoInfo.download.pid;
    const newVideoInfo: VideoInfo = {
      ...videoInfo,
      download: { ...videoInfo.download },
      file: { ...videoInfo.file }
    };
    newVideoInfo.download.completed = true;
    newVideoInfo.status = 'completed';
    newVideoInfo.download.progress = '1';
    newVideoInfo.download.pid = null;
    newVideoInfo.updatedAt = Date.now();

    CacheHelper.set(uuid, newVideoInfo);

    if (pid) {
      const ytdlp = new YtDlpHelper({
        url: videoInfo.url,
        pid: pid
      });
      ytdlp.kill();
    }
    return NextResponse.json({
      uuid: videoInfo.uuid,
      success: true
    });
  } catch (e) {
    return new Response(e as string, {
      status: 400
    });
  }
}
