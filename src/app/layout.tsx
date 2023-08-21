import './globals.css';
import type { PropsWithChildren } from 'react';
import { Inter } from 'next/font/google';
import classNames from 'classnames';
import type { Metadata } from 'next';
import { ToastContainerWrapper } from '@/components/ToastContainerWrapper';
import { ClientWorks } from '@/components/ClientWorks';
import { VideoPlayer } from '@/components/VideoPlayer';
import { ClientBodyScrollResolver } from '@/components/ClientBodyScrollResolver';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='en'>
      <body className={classNames(inter.className, 'min-w-[var(--site-min-width)]')}>
        <VideoPlayer />
        {/* <Header /> */}
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          {children}
        </ThemeProvider>
        <ToastContainerWrapper />
        <ClientWorks />
        <ClientBodyScrollResolver />
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
  keywords: ['Next.js', 'React', 'JavaScript', 'TypeScript', 'yt-dlp', 'yt-dlp-web'],
  // colorScheme: 'dark',
  authors: [{ name: 'sooros5132', url: 'https://github.com/sooros5132' }],
  creator: 'sooros5132',
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
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#171212' }
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  },
  openGraph: {
    images: '/api/og'
  }
};
