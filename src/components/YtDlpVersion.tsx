'use client';

import axios from 'axios';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import useSWR from 'swr';

export const YtDlpVersion = () => {
  const { data: ytDlpVersion, isValidating } = useSWR<string>(
    '/api/v/yt-dlp',
    async (url) => {
      return await axios.get(url).then((res) => res.data);
    },
    {
      revalidateOnFocus: false,
      errorRetryCount: 1
    }
  );

  return (
    <p>
      <span>yt-dlp version: </span>
      {isValidating ? (
        <AiOutlineLoading3Quarters className='inline animate-spin' />
      ) : ytDlpVersion ? (
        <a
          className='hover:underline'
          href={`https://github.com/yt-dlp/yt-dlp/releases/tag/${ytDlpVersion}`}
          rel='noopener noreferrer'
          target='_blank'
        >
          {ytDlpVersion}
        </a>
      ) : (
        <span>unknown</span>
      )}
    </p>
  );
};
