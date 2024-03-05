import { DownloadContainer } from '@/components/containers/DownloadContainer';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { VideoList } from '@/components/containers/VideoList';
import { YtDlpVersion } from '@/components/YtDlpVersion';
import { UrlParameterWatcher } from '@/components/UrlParameterWatcher';
import { StorageStat } from '@/components/StorageStat';

export default function Home() {
  return (
    <main className='mx-auto max-w-8xl p-4 space-y-4'>
      <UrlParameterWatcher />
      <div className='flex gap-x-2 items-center justify-between'>
        <h1 className='grow flex items-center text-2xl'>yt-dlp-web</h1>
        <div className='grow max-w-[--site-min-width] ml-auto text-right'>
          <StorageStat />
        </div>
        <ThemeToggle />
      </div>
      <div className='flex flex-col gap-4 lg:flex-row '>
        <div className='lg:flex flex-col lg:shrink-0 lg:w-96 lg:py-4 lg:max-h-screen lg:sticky lg:top-0 lg:left-0'>
          <DownloadContainer />
        </div>
        <div className='lg:grow lg:py-4'>
          <VideoList />
        </div>
      </div>
      <div className='text-center text-xs text-muted-foreground/70 space-y-2'>
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
