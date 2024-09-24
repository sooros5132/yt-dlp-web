'use client';

import axios from 'axios';
import { Suspense } from 'react';
import useSWR from 'swr';
import { Loading } from '@/components/modules/Loading';
import { Progress } from '@/components/ui/progress';
import numeral from 'numeral';
import type { DiskSpace } from '@/types/types';

export const StorageStat = () => {
  return (
    <div>
      <div className='text-sm mb-1'>Storage</div>
      <Suspense fallback={<Loading />}>
        <StorageStatInner />
      </Suspense>
    </div>
  );
};

function StorageStatInner() {
  const {
    data: space,
    error,
    isLoading
  } = useSWR<DiskSpace>(
    '/api/stat/storage',
    async (url) => {
      const data = await axios.get(url).then((res) => res.data);
      return data;
    },
    {
      revalidateOnFocus: true,
      refreshInterval: 10 * 1000,
      errorRetryCount: 1
    }
  );

  if (isLoading) {
    return <Loading />;
  }

  if (!space || error) {
    return <div className='text-xs text-zinc-400'>Unable to get storage information</div>;
  }

  return (
    <div>
      <Progress className='h-2' value={space.usageInPercentage} />
      <div className='text-xs text-foreground/80'>
        {numeral(space.usage).format('0.0b')} of {numeral(space.total).format('0.0b')} used
      </div>
    </div>
  );
}
