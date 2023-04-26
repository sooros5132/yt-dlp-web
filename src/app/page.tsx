import { DownloadForm } from '@/components/DownloadForm';
import { VideoList } from '@/components/VideoList';
import { Cache, VIDEO_LIST_FILE } from '@/server/Cache';
import type { VideoInfo } from '@/types/video';

export const dynamic = 'force-dynamic';

async function getVideoListData(): Promise<VideoInfo[]> {
  const uuids = (await Cache.get<string[]>(VIDEO_LIST_FILE)) || [];

  if (!Array.isArray(uuids) || !uuids.length) {
    return [];
  }

  const videoList = (await Promise.all(uuids.map((uuid) => Cache.get<VideoInfo>(uuid)))).filter(
    (video) => video
  ) as VideoInfo[];

  return videoList;
}

export default async function Home() {
  const videoList = await getVideoListData();

  return (
    <main className='mx-auto max-w-3xl pb-10'>
      <h1 className='text-center text-2xl mt-16 mb-8'>yt-dlp-web Download Station</h1>
      <div className='p-4 text-base-content rounded-md'>
        <DownloadForm />
        <VideoList videoList={videoList} />
      </div>
    </main>
  );
}
