import { NextResponse } from 'next/server';
import { CacheHelper } from '@/server/helpers/CacheHelper';
import { ProcessHelper } from '@/server/helpers/ProcessHelper';
import { FFmpegHelper } from '@/server/helpers/FFmpegHelper';
import { promises as fs } from 'fs';
import type { VideoInfo } from '@/types/video';

export const dynamic = 'force-dynamic';

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
    if (videoInfo.status !== 'recording' || !videoInfo?.file?.path) {
      videoInfo.status = 'completed';
      videoInfo.download.progress = '1';
      videoInfo.download.pid = null;
      videoInfo.updatedAt = Date.now();

      await CacheHelper.set(uuid, videoInfo);

      return NextResponse.json({
        uuid: videoInfo.uuid,
        success: true
      });
    }

    try {
      if (videoInfo?.download?.pid && videoInfo?.url) {
        const process = new ProcessHelper({ pid: videoInfo.download.pid });
        const isRunning = await process.isRunningAsYtdlpProcess(videoInfo.url, videoInfo.format);
        if (isRunning) {
          // 프로세스가 실행중이니 SIGINT 전송으로 저장 요청
          process.kill(2);
          videoInfo.download.pid = null;
          videoInfo.updatedAt = Date.now();
          await CacheHelper.set(uuid, videoInfo);
          return NextResponse.json({
            uuid: videoInfo.uuid,
            success: true
          });
        }
      }

      const filePath = videoInfo.file.path;
      const stat = await fs.stat(filePath);
      if (!stat) {
        throw '';
      }

      (async function () {
        const ffmpeg = new FFmpegHelper({
          filePath
        });

        videoInfo.status = 'merging';
        videoInfo.updatedAt = Date.now();
        await CacheHelper.set(uuid, videoInfo);
        await ffmpeg.repair();
        videoInfo.status = 'completed';
        videoInfo.download.pid = null;
        videoInfo.download.progress = '1';
        videoInfo.updatedAt = Date.now();
        await CacheHelper.set(uuid, videoInfo);
        return;
      })();
    } catch (e) {}

    await CacheHelper.set(uuid, videoInfo);

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
