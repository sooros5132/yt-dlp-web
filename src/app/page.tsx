import React from 'react';
import { DownloadForm } from '../components/DownloadForm';

export default function Home() {
  return (
    <main className='mx-auto max-w-3xl'>
      <h1 className='text-center text-2xl'>yt-dlp-web Download Station</h1>
      <div className='my-2 p-4 text-base-content rounded-md'>
        <DownloadForm />
        {/* <Video /> */}
      </div>
    </main>
  );
}
