import { DownloadContainer } from '@/components/containers/DownloadContainer';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { VideoList } from '@/components/containers/VideoList';
import { YtDlpVersion } from '@/components/YtDlpVersion';
import { UrlParameterWatcher } from '@/components/UrlParameterWatcher';

export default function Home() {
  return (
    <main className='mx-auto max-w-8xl pb-5'>
      <UrlParameterWatcher />
      <div className='flex justify-between p-4'>
        <h1 className='flex items-center text-2xl'>yt-dlp-web Download Station</h1>
        <ThemeToggle />
      </div>
      <div className='p-4 pt-0 lg:flex lg:gap-3'>
        <div className='lg:flex flex-col lg:shrink-0 lg:w-96 lg:py-8 lg:supports-[max-height:100dvh]:max-h-[100dvh] lg:max-h-[100vh] lg:sticky lg:top-0 lg:left-0'>
          <DownloadContainer />
        </div>
        <div className='lg:grow'>
          <VideoList />
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
        <YtDlpVersion />
      </div>
    </main>
  );
}
