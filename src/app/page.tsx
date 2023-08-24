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
    <main className='mx-auto max-w-8xl pb-5'>
      <div className='flex justify-between p-4'>
        <h1 className='flex items-center text-2xl'>yt-dlp-web Download Station</h1>
        <ThemeToggle />
      </div>
      <div className='p-4 pt-0 lg:flex lg:gap-3'>
        <div className='lg:shrink-0 lg:w-96'>
          <DownloadForm />
        </div>
        <div>
          <VideoList videoList={videoList} />
        </div>
      </div>
      <p className='mt-10 text-center text-xs text-muted-foreground'>
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
