import type { VideoInfo } from '@/types/video';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/Divider';
import { initialDownloadFormState, useDownloadFormStore } from '@/store/downloadForm';
import { isDevelopment, jsonStringifyPrettier, qualityToYtDlpCmdOptions } from '@/lib/utils';

export type DownloadOptionsInfoDialogProps = {
  open: boolean;
  video: VideoInfo;
  onClose: () => void;
};

export function DownloadOptionsInfoDialog({
  open,
  video,
  onClose
}: DownloadOptionsInfoDialogProps) {
  const handleChangeOpen = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleClickApplyOptionsToDownloadFormStore = () => {
    useDownloadFormStore.getState().loadDownloadedOptions(video);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleChangeOpen}>
      <DialogContent className='max-w-3xl max-h-full flex flex-col'>
        <div className='flex-shrink-0'>
          <div className='font-bold text-lg'>Options used when downloading</div>
        </div>
        <Divider></Divider>
        <div className='flex-shrink overflow-auto text-sm'>
          <div className='break-all'>
            Url: <b>{video?.url ?? ''}</b>
          </div>
          <div>
            Download format:{' '}
            {video?.format === 'bv+ba/b' ? (
              <span className='opacity-60'>No formatting options were selected.</span>
            ) : (
              <b>{video?.format}</b>
            )}
          </div>
          <div>
            Up to quality:{' '}
            {video?.selectQuality ? (
              <span>
                <b>{video.selectQuality}</b> -&gt;{' '}
                <code className='bg-foreground/10 px-1 py-0.5'>
                  {qualityToYtDlpCmdOptions(video.selectQuality)?.join?.(' ') || ''}
                </code>
              </span>
            ) : video?.format === 'bv+ba/b' ? (
              <b>{initialDownloadFormState.selectQuality}</b>
            ) : (
              <span className='opacity-60'>You downloaded it by selecting the format option.</span>
            )}
          </div>
          <div>
            Using Cookies: <b>{video.usingCookies ? 'Yes' : 'No'}</b>
          </div>
          <div>
            Output filename:{' '}
            <b>{video.outputFilename ?? initialDownloadFormState.outputFilename}</b>
          </div>
          <div>
            Cut Video: <b>{video.cutVideo ? 'Yes' : 'No'}</b>
          </div>
          <div>
            Cut start time:{' '}
            {video.cutStartTime ? (
              <b>{video.cutStartTime}</b>
            ) : (
              <span className='opacity-60'>Start</span>
            )}
          </div>
          <div>
            Cut end time:{' '}
            {video.cutEndTime ? <b>{video.cutEndTime}</b> : <span className='opacity-60'>End</span>}
          </div>
          <div>
            Force key frames at cuts: <b>{video.enableForceKeyFramesAtCuts ? 'Yes' : 'No'}</b>
          </div>
          <div>
            Embed subtitles: <b>{video.embedSubs ? 'Yes' : 'No'}</b>
          </div>
          <div>
            Embed chapter markers: <b>{video.embedChapters ? 'Yes' : 'No'}</b>
          </div>
          <div>
            Download livestreams from the start: <b>{video.enableLiveFromStart ? 'Yes' : 'No'}</b>
          </div>
          <div>
            Enable Proxy: <b>{video.enableProxy ? 'Yes' : 'No'}</b>
          </div>
          <div>
            Proxy Address:{' '}
            {video.proxyAddress ? (
              <b>{video.proxyAddress}</b>
            ) : (
              <span className='opacity-60'>Not set</span>
            )}
          </div>
          <div className='opacity-60 mt-2'>
            The cookie is used as the value currently stored on the server.
          </div>
          {isDevelopment && (
            <div className='bg-black/80 text-white font-mono'>
              Only visible in development mode.
              <pre className='whitespace-break-spaces'>{jsonStringifyPrettier(video)}</pre>
            </div>
          )}
        </div>
        <Divider />
        <div className='flex flex-shrink-0 justify-end items-center gap-x-3'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={handleClickApplyOptionsToDownloadFormStore}
          >
            Use these options
          </Button>
          <Button type='button' size='sm' onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
