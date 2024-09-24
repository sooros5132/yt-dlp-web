import { YtDlpVersion } from '@/components/YtDlpVersion';

export function Footer() {
  return (
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
  );
}
