import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { YtDlpHelper } from '@/server/YtDlpHelper';
import { CacheHelper, VIDEO_LIST_FILE } from '@/server/CacheHelper';
import { VideoInfo } from '@/types/video';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const urlObject = new URL(request.url);
    const searchParams = urlObject.searchParams;
    const uuid = searchParams.get('uuid');
    // const url = context?.params?.url;

    try {
      if (typeof uuid !== 'string') {
        throw 'Param `uuid` is only string type';
      }
    } catch (e) {
      return new Response(e as string, {
        status: 400
      });
    }

    const videoInfo = await CacheHelper.get<VideoInfo>(uuid);

    const videoPath = videoInfo?.file.path;
    if (!videoPath) {
      throw 'videoPath is not found';
    }

    const stat = await fs.stat(videoPath);

    const file = await fs.open(videoPath);
    const videoStream = file.createReadStream();
    videoStream.on('finish', () => {
      videoStream.close();
    });

    return new Response(videoStream as any, {
      headers: {
        'Content-Length': `${stat.size}`,
        //! WARNING: encodeURIComponent 사용하면 파일이름이 깨짐.
        'Content-Disposition': `attachment; filename=${Buffer.from(
          videoInfo.file.name || 'Untitled.mp4'
        ).toString('binary')};`
      }
    });
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

export async function DELETE(request: Request) {
  try {
    const urlObject = new URL(request.url);
    const searchParams = urlObject.searchParams;
    const uuid = searchParams.get('uuid');
    const deleteFile = searchParams.get('deleteFile') === 'true';
    if (typeof uuid !== 'string') {
      throw 'Param `uuid` is only string type';
    }
    // const video = await prisma.video.findUnique({ where: { uuid } });

    // const videoPath = video?.filePath!;
    // if (!videoPath) {
    //   throw 'videoPath is not found';
    // }
    try {
      // await fs.unlink(videoPath);

      const videoInfo = await CacheHelper.get<VideoInfo>(uuid);
      const videoList = (await CacheHelper.get<string[]>(VIDEO_LIST_FILE)) || [];

      if (!videoInfo) {
        return NextResponse.json({
          id: null,
          success: false
        });
      }

      if (videoInfo?.download?.pid) {
        const ytdlp = new YtDlpHelper({
          url: videoInfo.url,
          pid: videoInfo.download.pid
        });
        ytdlp.kill();
      }

      const newVideoList = videoList.filter((_uuid) => _uuid !== videoInfo.uuid);
      try {
        if (deleteFile && videoInfo.file.path) {
          await fs.unlink(videoInfo.file.path);
        }
      } catch (e) {}
      await CacheHelper.delete(videoInfo.uuid);
      await CacheHelper.set(VIDEO_LIST_FILE, newVideoList);
      return NextResponse.json({
        uuid: videoInfo.uuid,
        success: true
      });
    } catch (e) {}
  } catch (e) {
    return new Response(e as string, {
      status: 400
    });
  }
}
