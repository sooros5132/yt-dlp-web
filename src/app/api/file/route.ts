import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { YtDlpProcess } from '@/server/YtDlpProcess';
import { Cache, VIDEO_LIST_FILE } from '@/server/Cache';
import { VideoInfo } from '@/types/video';

export async function GET(request: Request) {
  try {
    const urlObject = new URL(request.url);
    const searchParams = urlObject.searchParams;
    const id = searchParams.get('id');
    // const url = context?.params?.url;

    try {
      if (typeof id !== 'string') {
        throw 'Param `id` is only string type';
      }
    } catch (e) {
      return new Response(e as string, {
        status: 400
      });
    }

    const videoInfo = await Cache.get<VideoInfo>(id);

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
    const id = searchParams.get('id');
    if (typeof id !== 'string') {
      throw 'Param `id` is only string type';
    }
    // const video = await prisma.video.findUnique({ where: { id } });

    // const videoPath = video?.filePath!;
    // if (!videoPath) {
    //   throw 'videoPath is not found';
    // }

    try {
      // await fs.unlink(videoPath);

      const videoInfo = await Cache.get<VideoInfo>(id);
      const videoList = (await Cache.get<string[]>(VIDEO_LIST_FILE)) || [];

      if (!videoInfo) {
        return NextResponse.json({
          id: null,
          success: false
        });
      }

      if (videoInfo?.download?.pid) {
        const ytdlp = new YtDlpProcess({
          url: videoInfo.url,
          pid: videoInfo.download.pid
        });
        ytdlp.kill();
      }

      const newVideoList = videoList.filter((uuid) => uuid !== videoInfo.uuid);
      await Cache.delete(videoInfo.uuid);
      await Cache.set(VIDEO_LIST_FILE, newVideoList);
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
