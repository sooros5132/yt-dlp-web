'use client';

import { useDownloadFormStore } from '@/store/downloadForm';
import { useSiteSettingStore } from '@/store/siteSetting';
import { MdSettings } from 'react-icons/md';
import { shallow } from 'zustand/shallow';

export function Header() {
  const { usingCookies, setUsingCookies } = useDownloadFormStore(
    ({ usingCookies, setUsingCookies }) => ({ usingCookies, setUsingCookies }),
    shallow
  );
  const { openCookiesEditor, setOpenCookiesEditor } = useSiteSettingStore(
    ({ openCookiesEditor, setOpenCookiesEditor }) => ({ openCookiesEditor, setOpenCookiesEditor }),
    shallow
  );

  const handleClickMenuItem =
    (menu: 'usingCookies' | 'cookieSettings') => (event: React.MouseEvent<HTMLElement>) => {
      switch (menu) {
        case 'usingCookies': {
          setUsingCookies(!usingCookies);
          return;
        }
        case 'cookieSettings': {
          setOpenCookiesEditor(!openCookiesEditor);
          break;
        }
      }
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && typeof activeElement?.blur === 'function') {
        activeElement?.blur?.();
      }
    };

  return (
    <header className='max-w-3xl min-h-6 p-2 mx-auto'>
      <div className='flex justify-between items-center w-full'>
        <div></div>
        <div>
          <div className='dropdown dropdown-end'>
            <label tabIndex={0} className='btn btn-sm btn-circle btn-ghost text-xl'>
              <MdSettings />
            </label>
            <ul
              tabIndex={0}
              className='dropdown-content menu p-2 shadow bg-base-200 rounded-box w-52'
            >
              <li>
                <button
                  onClick={handleClickMenuItem('usingCookies')}
                  className='items-center justify-between normal-case'
                  title='Using Cookies'
                >
                  <span>Using Cookies</span>
                  <input
                    type='checkbox'
                    checked={usingCookies}
                    readOnly
                    className='checkbox checkbox-sm rounded-md'
                  />
                </button>
              </li>
              <li>
                <button onClick={handleClickMenuItem('cookieSettings')} title='Cookie Settings'>
                  Edit Cookies
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
