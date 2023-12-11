import './globals.css';
import type { PropsWithChildren } from 'react';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { ToastContainerProvider } from '@/components/provider/ToastContainerProvider';
import { RehydrateProvider } from '@/components/RehydrateProvider';
import { VideoPlayerContainer } from '@/components/modules/VideoPlayer';
import { ThemeProvider } from '@/components/provider/ThemeProvider';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <meta property='og:image' content='/api/og' />
        <link rel='icon' href='/favicon_48x48.png' sizes='48x48' />
        <link rel='icon' href='/favicon_92x92.png' sizes='92x92' />
        <link rel='icon' href='/favicon_144x144.png' sizes='144x144' />
        <link rel='icon' href='/favicon.ico' sizes='14x14' />
      </head>
      <body className={cn(inter.className, 'min-w-[var(--site-min-width)]')}>
        {/* <Header /> */}
        <VideoPlayerContainer />
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <ToastContainerProvider />
        <RehydrateProvider />
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: 'yt-dlp-web',
  description: 'yt-dlp-web',
  generator: 'yt-dlp-web',
  applicationName: 'yt-dlp-web',
  referrer: 'origin-when-cross-origin',
  keywords: ['yt-dlp-web', 'yt-dlp', 'Next.js', 'React'],
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  robots: {
    index: false,
    follow: false,
    nocache: false
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e4e4e7' },
    { media: '(prefers-color-scheme: dark)', color: '#141211' }
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  }
};
