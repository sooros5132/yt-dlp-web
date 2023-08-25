import { DownloadForm } from '@/components/containers/DownloadForm';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { VideoList } from '@/components/containers/VideoList';
import { getYtDlpVersion } from '@/server/yt-dlp-web';
import { getVideoList } from '@/server/yt-dlp-web';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [videoList, ytDlpVersion] = await Promise.all([getVideoList(), getYtDlpVersion()]);

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
          <VideoList {...videoList} />
        </div>
      </div>
      <div className='mt-10 text-center text-xs text-muted-foreground/70 space-y-2'>
        <p>
          Powered By{' '}
          <a
            className='hover:underline'
            href='https://github.com/sooros5132/yt-dlp-web'
            rel='noopener noreferrer'
            target='_blank'
          >
            yt-dlp-web
          </a>
        </p>
        {ytDlpVersion && (
          <p>
            <span>yt-dlp version </span>
            <a
              className='hover:underline'
              href={`https://github.com/yt-dlp/yt-dlp/releases/tag/${ytDlpVersion}`}
              rel='noopener noreferrer'
              target='_blank'
            >
              v{ytDlpVersion}
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
