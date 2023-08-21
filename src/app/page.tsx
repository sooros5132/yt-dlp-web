import { DownloadForm } from '@/components/DownloadForm';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VideoList } from '@/components/VideoList';
import { CacheHelper, VIDEO_LIST_FILE } from '@/server/CacheHelper';
import type { VideoInfo } from '@/types/video';

export const dynamic = 'force-dynamic';

async function getVideoListData(): Promise<VideoInfo[]> {
  const uuids = (await CacheHelper.get<string[]>(VIDEO_LIST_FILE)) || [];

  if (!Array.isArray(uuids) || !uuids.length) {
    return [];
  }

  const videoList = (
    await Promise.all(uuids.map((uuid) => CacheHelper.get<VideoInfo>(uuid)))
  ).filter((video) => video) as VideoInfo[];

  return videoList;
}

export default async function Home() {
  const videoList = await getVideoListData();

  return (
    <main className='mx-auto max-w-3xl pb-5'>
      <div className='flex justify-end pt-2 px-2'>
        <ThemeToggle />
      </div>
      <h1 className='text-center text-2xl mt-14 mb-8'>yt-dlp-web Download Station</h1>
      <div className='p-4 text-base-content rounded-md'>
        <DownloadForm />
        <VideoList videoList={videoList} />
      </div>
      <p className='mt-10 text-center text-xs text-zinc-500'>
        Powered By{' '}
        <a
          className='link link-hover'
          href='https://github.com/sooros5132/yt-dlp-web'
          rel='noopener noreferrer'
          target='_blank'
        >
          yt-dlp-web
        </a>
      </p>
    </main>
  );
}
