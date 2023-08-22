'use client';

import { useCookiesEditorStore } from '@/store/cookiesEditor';
import { useSiteSettingStore } from '@/store/siteSetting';
import { AxiosResponse } from '@/types/types';
import axios from 'axios';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { AiOutlineInfoCircle } from 'react-icons/ai';
import { toast } from 'react-toastify';
import { DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

export type CookiesEditorProps = {
  open: boolean;
  onClose: () => void;
};

export const CookiesEditor = (props: CookiesEditorProps) => {
  const hydrated = useSiteSettingStore(({ hydrated }) => hydrated);
  if (!hydrated) {
    return null;
  }

  return <CookiesEditorInner open={props.open} onClose={props.onClose} />;
};

const CookiesEditorInner = ({ open, onClose }: CookiesEditorProps) => {
  const _initSecretKey = useCookiesEditorStore.getState().secretKey;
  const [cookies, setCookies] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [isExisted, setExisted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [secretKey, setSecretKey] = useState(_initSecretKey);

  useEffect(() => {
    getCookies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCookies = async () => {
    if (isLoading) {
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setExisted(false);
    const response = await axios
      .get<AxiosResponse<{ content: string }>>('/api/cookies', {
        params: {
          secretKey
        }
      })
      .then((res) => res.data)
      .catch((res) => res.response.data)
      .finally(() => {
        setLoading(false);
      });

    if (response?.success) {
      setCookies(response.content);
      useCookiesEditorStore.getState().setSecretKey(secretKey);
    } else {
      if (response?.error) {
        setExisted(response?.existed || false);
        setErrorMessage(response.error);
      }
    }
  };

  const handleChangeCookies = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCookies(event.target.value || '');
  };

  const handleClickApplyCookiesButton = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!secretKey) {
      toast.error('Please enter your secret key.');
      return;
    }
    const response = await axios
      .post<AxiosResponse>('/api/cookies', {
        content: cookies,
        secretKey
      })
      .then((res) => res.data)
      .catch((res) => res.response.data);

    if (response?.success) {
      toast.success('Cookies have been set.');
      useCookiesEditorStore.getState().setSecretKey(secretKey);
      onClose();
    } else {
      if (response?.error) {
        toast.error(response.error);
      }
    }
  };

  const handleChangeSecretKey = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSecretKey(event.target.value || '');
  };

  const handleClickNewCookiesButton = () => {
    setErrorMessage('');
    setExisted(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      getCookies();
    }
  };

  return (
    <div>
      <div className='mb-3'>
        <div className='font-bold text-xl'>yt-dlp Cookies Setting</div>
        <div className='text-sm text-warning-foreground'>
          Please be careful as cookies may be stolen by others.
        </div>
        <div className='text-muted-foreground text-xs'>
          Cookies can be used to gain access to videos. Get a cookie in Netscape format from your
          browser and paste it.
        </div>
      </div>
      <div>
        <div className='font-bold'>Secret key</div>
        <div className='text-muted-foreground text-xs'>
          This secret key will be needed later to modify the cookie. If you forget the Secret key,
          you will have to create a new cookies.
        </div>
      </div>
      <div>
        <Input
          required
          placeholder='1 character or more password'
          value={secretKey}
          onChange={handleChangeSecretKey}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
      </div>
      <div className='mt-1'>
        <div className='font-bold'>Cookies</div>
        <div className='text-muted-foreground text-xs'>
          Please paste the cookies in Netscape format.
        </div>
      </div>
      <div className='relative text-[0] border'>
        <Textarea
          className={classNames(
            'border-none leading-5 max-h-[calc(100vh_-_240px)] resize-none',
            isLoading && 'textarea-disabled'
          )}
          rows={10}
          required
          placeholder={
            isLoading
              ? 'Loading...'
              : `# Netscape HTTP Cookie File
Format)
<host> <subdomains> <path> <isSecure> <expiry> <name> <value>

Example)
.youtube.com	TRUE	/	FALSE	1718945057	APISID	****************
.youtube.com	TRUE	/	TRUE	1688878085	DEVICE_INFO	****************
.youtube.com	TRUE	/	FALSE	1718945057	HSID	****************
.youtube.com	TRUE	/	TRUE	1712316408	LOGIN_INFO	****************`
          }
          value={cookies}
          onChange={handleChangeCookies}
          disabled={isLoading}
        />
        {errorMessage && isExisted && (
          <div className='absolute top-0 left-0 w-full h-full flex flex-col gap-y-1 items-center justify-center bg-base-200/50 text-sm rounded-md backdrop-blur-xl'>
            <div className='text-center'>
              <div className='text-error-foreground'>{errorMessage}</div>
              <div>Modify the secret key above and try again.</div>
            </div>
            <div className='flex gap-x-4'>
              <Button variant='outline' size='sm' className='rounded-full' onClick={getCookies}>
                Try again
              </Button>
              <Button size='sm' className='rounded-full' onClick={handleClickNewCookiesButton}>
                New cookies
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className='text-sm text-right text-muted-foreground mb-1'>
        The cookie setting applies to all downloads.
      </div>
      <div className='flex justify-end items-center gap-x-4'>
        <Button variant='outline' size='sm' className='rounded-full' onClick={onClose}>
          Cancel
        </Button>
        <Button
          size='sm'
          className={classNames(
            'rounded-full',
            (isLoading || (errorMessage && isExisted)) && 'btn-disabled'
          )}
          disabled={isLoading || (Boolean(errorMessage) && isExisted)}
          onClick={handleClickApplyCookiesButton}
        >
          Save
        </Button>
      </div>
    </div>
  );
};
