'use client';

import { useRef, useState } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { Card } from '@/components/ui/card';
import { VideoListHeader } from '@/components/video-list/VideoListHeader';
import { VideoListBody } from '@/components/video-list/VideoListBody';
import { GetVideoList } from '@/server/yt-dlp-web';

const MAX_INTERVAL_Time = 120 * 1000;
const MIN_INTERVAL_Time = 3 * 1000;

export type VideoListProps = Partial<GetVideoList>;

export function VideoList() {
  const refreshIntervalTimeRef = useRef(MIN_INTERVAL_Time);
  const [search, setSearch] = useState('');

  const {
    data: newData,
    isValidating,
    isLoading,
    mutate
  } = useSWR<GetVideoList>(
    '/api/list',
    async () => {
      const data = await axios.get<GetVideoList>('/api/list').then((res) => res.data);

      if (!data) {
        return {
          orders: [],
          items: {}
        };
      }

      let nextIntervalTime = Math.min(
        Math.max(MIN_INTERVAL_Time, refreshIntervalTimeRef.current * 2),
        MAX_INTERVAL_Time
      );
      const { items } = data;
      const videos = Object.values(items);
      for (const video of videos) {
        if (
          video.download &&
          ['downloading', 'recording', 'merging', 'standby'].includes(video.status)
        ) {
          nextIntervalTime = 3 * 1000;
          break;
        }
      }
      refreshIntervalTimeRef.current = nextIntervalTime;
      return data;
    },
    {
      refreshInterval: refreshIntervalTimeRef.current,
      errorRetryCount: 1
    }
  );

  const handleClickReloadButton = mutate;

  const filteredOrder =
    newData && search
      ? newData.orders.filter((uuid) => {
          const item = newData.items[uuid];
          if (!item) return false;
          const lowerCaseSearch = search.toLowerCase();
          const title = item?.title?.toLowerCase();
          const filename = item?.file?.name?.toLowerCase();
          if (title?.includes(lowerCaseSearch) || filename?.includes(lowerCaseSearch)) {
            return true;
          }
          return false;
        })
      : newData?.orders;

  return (
    <Card className='p-4 overflow-hidden border-none shadow-md'>
      <VideoListHeader
        orders={newData?.orders}
        isValidating={isValidating}
        search={search}
        setSearch={setSearch}
        onClickReloadButton={handleClickReloadButton}
      />
      <VideoListBody orders={filteredOrder} items={newData?.items} isLoading={isLoading} />
    </Card>
  );
}
