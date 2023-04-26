import React from 'react';
import { DownloadForm } from '@/components/DownloadForm';
import { VideoList } from '@/components/VideoList';

export default function Home() {
  return (
    <main className='mx-auto max-w-3xl pb-10'>
      <h1 className='text-center text-2xl mt-16 mb-8'>yt-dlp-web Download Station</h1>
      <div className='p-4 text-base-content rounded-md'>
        <DownloadForm />
        <VideoList />
      </div>
    </main>
  );
}
