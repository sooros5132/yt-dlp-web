'use client';

import { useCookiesEditorStore } from '@/store/cookiesEditor';
import { useSiteSettingStore } from '@/store/siteSetting';
import { AxiosResponse } from '@/types/types';
import axios from 'axios';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { AiOutlineInfoCircle } from 'react-icons/ai';
import { toast } from 'react-toastify';
import { shallow } from 'zustand/shallow';

export const CookiesEditor = () => {
  const { hydrated, openCookiesEditor } = useSiteSettingStore(
    ({ hydrated, openCookiesEditor }) => ({ hydrated, openCookiesEditor }),
    shallow
  );

  if (!hydrated || !openCookiesEditor) {
    return null;
  }

  return <CookiesEditorInner />;
};

const CookiesEditorInner = () => {
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

  const handleClickApplyCookiesButton = async () => {
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
      handleClose();
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

  const handleClose = () => {
    useSiteSettingStore.getState().setOpenCookiesEditor(false);
  };

  // const handleEventStopPropagation = (event: React.MouseEvent<HTMLElement>) => {
  //   event.stopPropagation();
  // };

  return (
    <div
      className='fixed top-0 left-0 w-full h-full flex flex-col justify-center items-center z-10 bg-base-100/90 backdrop-blur-xl'
      // onClick={handleClose}
    >
      <div className='min-w-[300px] max-w-3xl w-full p-3'>
        <div
          className='p-6 bg-base-content/5 dark:bg-base-content/10 rounded-md'
          // onClick={handleEventStopPropagation}
        >
          <div>
            <span className='font-bold text-xl'>yt-dlp Cookies Setting</span>{' '}
            <span
              className='tooltip align-text-top text-zinc-500 before:max-w-[220px]'
              data-tip='Cookies can be used to gain access to videos. Get a cookie in Netscape format from your browser and paste it.'
            >
              <AiOutlineInfoCircle />
            </span>
          </div>
          <div className='text-sm text-warning mb-3'>
            Please be careful as cookies may be stolen by others.
          </div>
          <div>
            Secret key{' '}
            <span
              className='tooltip align-text-top text-zinc-500 before:max-w-[220px]'
              data-tip='This secret key will be needed later to modify the cookie. If you forget the Secret key, you will have to create a new cookies.'
            >
              <AiOutlineInfoCircle />
            </span>
          </div>
          <div>
            <input
              className={classNames(
                'input input-sm w-full focus:outline-none rounded-md',
                isLoading && 'input-disabled'
              )}
              required
              placeholder='1 character or more password'
              value={secretKey}
              onChange={handleChangeSecretKey}
              onKeyDown={handleKeyDown}
              readOnly={isLoading}
            />
          </div>
          <div className='mt-1'>
            <span>Cookies</span>{' '}
            <span
              className='tooltip align-text-top text-zinc-500 before:max-w-[220px]'
              data-tip='Please paste the cookies in Netscape format.'
            >
              <AiOutlineInfoCircle />
            </span>
          </div>
          <div className='relative text-[0]'>
            <textarea
              className={classNames(
                'textarea textarea-sm w-full rounded-md leading-5 max-h-[calc(100vh_-_240px)] resize-none focus:outline-none',
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
              readOnly={isLoading}
            />
            {errorMessage && isExisted && (
              <div className='absolute top-0 left-0 w-full h-full flex flex-col gap-y-1 items-center justify-center bg-base-200/50 text-sm rounded-md backdrop-blur-xl'>
                <div className='text-center'>
                  <div className='text-error'>{errorMessage}</div>
                  <div>Modify the secret key above and try again.</div>
                </div>
                <div className='flex gap-x-2'>
                  <button className='btn btn-sm btn-outline normal-case' onClick={getCookies}>
                    Try again
                  </button>
                  <button
                    className='btn btn-sm btn-primary normal-case'
                    onClick={handleClickNewCookiesButton}
                  >
                    New cookies
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className='text-sm text-right text-zinc-500'>Applies to all downloads.</div>
          <div className='flex justify-between items-center'>
            <button className='btn btn-outline btn-sm normal-case' onClick={handleClose}>
              Cancel
            </button>
            <button
              className={classNames(
                'btn btn-primary btn-sm normal-case',
                (isLoading || (errorMessage && isExisted)) && 'btn-disabled'
              )}
              disabled={isLoading || (Boolean(errorMessage) && isExisted)}
              onClick={handleClickApplyCookiesButton}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
