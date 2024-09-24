import { DownloadContainer } from '@/components/containers/DownloadContainer';
import { VideoList } from '@/components/containers/VideoList';
import { UrlParameterWatcher } from '@/components/UrlParameterWatcher';
import { Header } from '@/components/modules/Header';
import { Footer } from '@/components/modules/Footer';

export default async function Home() {
  return (
    <main className='flex flex-col h-full mx-auto max-w-8xl p-4 space-y-4'>
      <UrlParameterWatcher />
      <Header />
      <div className='flex flex-col gap-4 lg:flex-row'>
        <div className='lg:flex flex-col lg:shrink-0 lg:w-96 lg:py-4 lg:max-h-screen lg:sticky lg:top-0 lg:left-0'>
          <DownloadContainer />
        </div>
        <div className='lg:grow lg:py-4'>
          <VideoList />
        </div>
      </div>
      <Footer />
    </main>
  );
}
