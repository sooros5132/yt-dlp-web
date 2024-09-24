import { getSession, isRequiredAuthentication, signOutWithForm } from '@/server/actions/auth';

import Link from 'next/link';

import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { StorageStat } from '@/components/StorageStat';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { LuLogIn, LuLogOut } from 'react-icons/lu';

export async function Header() {
  const [session, isRequiredAuth] = await Promise.all([getSession(), isRequiredAuthentication()]);

  return (
    <div className='flex gap-x-1 sm:gap-x-2 items-center justify-between'>
      <h1 className='grow shrink-0 inline-flex sm:text-lg whitespace-nowrap'>yt-dlp-web</h1>
      <div className='flex-auto max-w-[--site-min-width] ml-auto text-right'>
        <StorageStat />
      </div>
      <ThemeToggle />
      {isRequiredAuth && (
        <>
          <Separator className='h-4' orientation='vertical' />
          {session?.user ? (
            <form action={signOutWithForm}>
              <Button type='submit' variant='ghost' size='icon' className='text-lg rounded-full'>
                <LuLogOut />
              </Button>
            </form>
          ) : (
            <Button variant='ghost' size='icon' className='text-lg rounded-full' asChild>
              <Link href='/signin'>
                <LuLogIn />
              </Link>
            </Button>
          )}
        </>
      )}
    </div>
  );
}
