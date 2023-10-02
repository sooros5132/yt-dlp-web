import { cn, isPropsEquals } from '@/lib/utils';
import { type VideoInfo } from '@/types/video';
import { LinkIcon } from 'lucide-react';
import numeral from 'numeral';
import { memo } from 'react';
import { AiOutlineCloudDownload } from 'react-icons/ai';
import { Divider } from '@/components/Divider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export type PlaylistViewerProps = { open: boolean; video: VideoInfo; onClose: () => void };

export const PlaylistViewer = memo(({ open, video, onClose }: PlaylistViewerProps) => {
  const handleEventStopPropagation = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const handleChangeOpen = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleChangeOpen}>
      <DialogContent className='max-w-3xl max-h-full flex flex-col'>
        <div className='flex flex-col overflow-hidden' onClick={handleEventStopPropagation}>
          <DialogTitle className='flex-auto pl-2 py-1 text-xl'>
            <a
              className='inline-flex gap-x-1 items-center hover:underline'
              href={video.url || ''}
              rel='noopener noreferrer'
              target='_blank'
              title='Open Original Link'
            >
              <LinkIcon className='inline shrink-0 text-base' size='1em' />
              <span className='font-bold line-clamp-2'>{video.title || video.url} </span>
              <span className='text-sm shrink-0'>
                {video.download.playlist?.count && `(${video.download.playlist?.count})`}
              </span>
            </a>
          </DialogTitle>
          <Divider className='shrink-0 mt-0 mb-2' />
          <div className='flex flex-col flex-auto gap-y-1 overflow-y-auto'>
            {video.playlist.map((item, i) => {
              if (!item) {
                return (
                  <div
                    key={i}
                    className='flex gap-x-1 p-1 hover:bg-foreground/10 rounded-md text-muted-foreground'
                  >
                    <div className='min-w-[2em] shrink-0 text-center font-bold'>{i + 1}</div>
                    <div>No Data</div>
                  </div>
                );
              }

              return (
                <div
                  key={item?.uuid ?? i}
                  className='flex gap-x-1 p-1 hover:bg-foreground/10 rounded-md'
                >
                  <div
                    className={cn(
                      'min-w-[2em] shrink-0 text-center font-bold',
                      item.error && 'text-error-foreground',
                      !item.error && item.isLive && 'text-muted-foreground line-through'
                    )}
                  >
                    {i + 1}
                  </div>
                  <div className='flex items-center justify-between gap-x-1 flex-auto'>
                    <div className='line-clamp-3 shrink'>
                      {item.error ? (
                        <span className='text-error-foreground' title={item.error}>
                          {item.error}
                        </span>
                      ) : item.isLive ? (
                        <span className='text-muted-foreground'>Live has been excluded.</span>
                      ) : (
                        <span title={item.name || ''}>{item.name}</span>
                      )}
                    </div>
                    <span className='shrink-0'>
                      {item.size && numeral(item.size).format('0.0b')}
                    </span>
                  </div>
                  <div className='flex items-center shrink-0 leading-4'>
                    <a
                      href={item.url || ''}
                      className={cn(!item.url && 'pointer-events-none')}
                      rel='noopener noreferrer'
                      target='_blank'
                      title='Open Item Link'
                    >
                      <Button
                        size='sm'
                        className='h-[1.5em] text-lg bg-info hover:bg-info/90 rounded-xl rounded-r-none'
                      >
                        <LinkIcon className='text-base' size='1em' />
                      </Button>
                    </a>
                    <a
                      className={cn(
                        (item?.error || !item.uuid || !item.path || !item.size || item.isLive) &&
                          'opacity-30 pointer-events-none'
                      )}
                      href={`/api/playlist/file?uuid=${video.uuid}&itemUuid=${item.uuid}&itemIndex=${i}&download=true`}
                      rel='noopener noreferrer'
                      target='_blank'
                      download={item.name}
                      title='Download Video'
                    >
                      <Button size='sm' className='h-[1.5em] text-lg rounded-xl rounded-l-none'>
                        <AiOutlineCloudDownload />
                      </Button>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}, isPropsEquals);

PlaylistViewer.displayName = 'PlaylistViewer';
