import './globals.css';
import type { PropsWithChildren } from 'react';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { ToastContainerProvider } from '@/components/provider/ToastContainerProvider';
import { RehydrateProvider } from '@/components/RehydrateProvider';
import { VideoPlayer } from '@/components/modules/VideoPlayer';
import { BodyScrollControl } from '@/components/BodyScrollControl';
import { ThemeProvider } from '@/components/provider/ThemeProvider';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <meta property='og:image' content='/api/og' />
      </head>
      <body className={cn(inter.className, 'min-w-[var(--site-min-width)]')}>
        <VideoPlayer />
        {/* <Header /> */}
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
        <BodyScrollControl />
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: 'yt-dlp-web Download Station',
  description: 'yt-dlp-web Download Station',
  generator: 'yt-dlp-web',
  applicationName: 'yt-dlp-web',
  referrer: 'origin-when-cross-origin',
  keywords: ['yt-dlp', 'yt-dlp-web', 'Next.js', 'React'],
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
