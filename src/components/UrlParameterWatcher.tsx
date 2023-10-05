'use client';

import { Suspense, useEffect } from 'react';
import { useDownloadFormStore } from '@/store/downloadForm';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import queryString from 'query-string';
import { toast } from 'react-toastify';
import { mutate } from 'swr';
import { shallow } from 'zustand/shallow';

export function UrlParameterWatcher() {
  /**
   * Entire page / deopted into client-side rendering.
   * https://nextjs.org/docs/messages/deopted-into-client-rendering / static page create
   *
   * useSearchParams가 사용되면 서버사이드 렌더링이 안된다.
   */
  return (
    <Suspense fallback={<></>}>
      <UrlParameterWatcherInner />
    </Suspense>
  );
}

function UrlParameterWatcherInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { isFetching, setFetching, setUrl } = useDownloadFormStore(
    ({ enableDownloadNow, isFetching, setFetching, url, setUrl }) => ({
      enableDownloadNow,
      isFetching,
      setFetching,
      url,
      setUrl
    }),
    shallow
  );

  useEffect(() => {
    const initUrl = searchParams.get('url');
    if (initUrl) {
      setUrl(initUrl);
    }

    setTimeout(async () => {
      if (isFetching) {
        return;
      }
      const isDownload = searchParams.get('download') === 'true';
      if (isDownload) {
        if (!initUrl || !/^https?:\/?\/?/i.test(initUrl)) {
          return;
        }

        try {
          const { url, download, ..._newQueryString } = queryString.parse(searchParams.toString());
          const newQueryString = queryString.stringify(_newQueryString);

          setFetching(true);
          router.replace(`${pathname}?${newQueryString}`);
          const result = await useDownloadFormStore.getState().requestDownload();

          if (result?.error) {
            toast.error(result?.error || 'Download Failed');
          } else if (result?.success) {
            if (result?.status === 'already') {
              toast.info('Already been downloaded');
              return;
            }
            if (['downloading', 'standby'].includes(result?.status)) {
              toast.success('Download Requested!');
            } else if (result?.status === 'restart') {
              toast.success('Download Restart');
            }

            mutate('/api/list');
          }
        } finally {
          setFetching(false);
        }
      }
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <></>;
}
