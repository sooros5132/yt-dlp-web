import { NextResponse } from 'next/server';
import { CacheHelper } from '@/server/helpers/CacheHelper';
import { YtDlpHelper } from '@/server/helpers/YtDlpHelper';
import { randomUUID } from 'crypto';
import type { SelectQuality } from '@/types/video';
import { VIDEO_LIST_FILE } from '@/server/constants';
import { checkRequiredFoldersAreAccessible } from '@/server/helpers/PermissionHelper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const urlObject = new URL(request.url);
  const searchParams = urlObject.searchParams;
  const url = searchParams.get('url')?.trim?.();
  const usingCookies = searchParams.get('usingCookies') === 'true';
  const embedChapters = searchParams.get('embedChapters') === 'true';
  // const embedMetadata = searchParams.get('embedMetadata') === 'true';
  const embedSubs = searchParams.get('embedSubs') === 'true';
  const subLangs = searchParams.getAll('subLangs[]') || searchParams.getAll('subLangs');
  const enableProxy = searchParams.get('enableProxy') === 'true';
  const proxyAddress = searchParams.get('proxyAddress') || '';
  const enableLiveFromStart = searchParams.get('enableLiveFromStart') === 'true';
  const cutVideo = searchParams.get('cutVideo') === 'true';
  const cutStartTime = searchParams.get('cutStartTime') || '';
  const cutEndTime = searchParams.get('cutEndTime') || '';
  const outputFilename = searchParams.get('outputFilename') || '';
  const selectQuality = (searchParams.get('selectQuality') || '') as SelectQuality;
  const enableForceKeyFramesAtCuts = searchParams.get('enableForceKeyFramesAtCuts') === 'true';

  // const url = context?.params?.url;

  try {
    if (typeof url !== 'string') {
      throw 'Param `url` is only string type';
    }
    if (!/^https?:\/?\/?/i.test(url)) {
      throw 'Please add `http://` or `https://`. ex) https://www.youtube.com/xxxxx';
    }

    await checkRequiredFoldersAreAccessible();

    const videoId =
      typeof searchParams.get('videoId') === 'string' ? searchParams.get('videoId') || '' : '';
    const audioId =
      typeof searchParams.get('audioId') === 'string' ? searchParams.get('audioId') || '' : '';

    const _format = `${videoId}${videoId && audioId ? '+' : ''}${audioId}`;
    const format = _format || 'bv+ba/b';

    //? 중복 확인
    // let isAlreadyFormat = false;
    // const uuids = (await CacheHelper.get<string[]>(VIDEO_LIST_FILE)) || [];
    // if (Array.isArray(uuids) && uuids.length) {
    //   const videoList = await Promise.all(uuids.map((uuid) => CacheHelper.get<VideoInfo>(uuid)));
    //   for (const video of videoList) {
    //     if (video?.url === url && video.format === format && !video?.isLive) {
    //       isAlreadyFormat = true;
    //       // throw 'You are already downloading in the same format.';
    //     }
    //   }
    // }
    // if (isAlreadyFormat) {
    //   throw 'You are already downloading in the same format.';
    // }
    //? 중복 확인

    const uuid = randomUUID();
    const ytdlp = new YtDlpHelper({
      url,
      videoId,
      audioId,
      format,
      uuid,
      usingCookies,
      embedChapters,
      // embedMetadata,
      embedSubs,
      subLangs,
      enableProxy,
      enableLiveFromStart,
      cutVideo,
      cutStartTime,
      cutEndTime,
      proxyAddress: typeof proxyAddress === 'string' ? proxyAddress : '',
      outputFilename,
      selectQuality: !videoId && !audioId ? selectQuality : '',
      enableForceKeyFramesAtCuts
    });
    const videoInfo = ytdlp.getVideoInfo();

    const uuidList = (await CacheHelper.get<string[]>(VIDEO_LIST_FILE)) || [];
    uuidList.unshift(uuid);
    await CacheHelper.set(VIDEO_LIST_FILE, uuidList);
    await CacheHelper.set(uuid, videoInfo);

    //! 비동기로 작업, Don't add await
    ytdlp
      .start({
        uuid,
        isDownloadRestart: false
      })
      .catch(() => {});

    return NextResponse.json({
      success: true,
      url,
      status: 'standby',
      timestamp: Date.now()
    });
  } catch (error) {
    return NextResponse.json(
      { error },
      {
        status: 400
      }
    );
  }
}
