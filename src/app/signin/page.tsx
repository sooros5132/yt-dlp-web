'use client';

import { signIn } from '@/server/actions/auth';

import { useState, useTransition } from 'react';

import type { FormEvent } from 'react';
import type { PageContext } from '@/types/types';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TypographyH1 } from '@/components/ui/typography';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Footer } from '@/components/modules/Footer';
import { Loading } from '@/components/modules/Loading';

export default function SignInPage(context: PageContext<{}>) {
  const callback = Array.isArray(context.searchParams.callback)
    ? context.searchParams.callback[0]
    : context.searchParams.callback;

  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (evt: FormEvent<HTMLFormElement>) => {
    evt.stopPropagation();
    evt.preventDefault();
    startTransition(async () => {
      if (!isPending) {
        const target = evt.target as HTMLFormElement;

        await signIn({
          username: target.username.value,
          password: target.password.value,
          redirectTo: callback ? decodeURIComponent(callback || '') : undefined
        }).then((res) => {
          if (typeof res === 'string') {
            setErrorMessage(res);
          }
        });
      }
    });
  };

  return (
    <main className='h-full flex flex-col max-w-xs mx-auto px-3 py-4'>
      <div className='grow flex flex-col justify-center space-y-6'>
        <div>
          <div className='flex items-center justify-between'>
            <TypographyH1 className='text-base sm:text-lg lg:text-lg'>yt-dlp-web</TypographyH1>
            <ThemeToggle />
          </div>
          <form className='space-y-2' onSubmit={handleSubmit}>
            <Input name='username' type='text' placeholder='Username' autoComplete='off' />
            <Input name='password' type='password' placeholder='Password' autoComplete='off' />
            <div className='text-xs'>
              {/* If you forgot your password, reset it in the{' '}
                    <TypographyInlineCode>docker-compose.yml</TypographyInlineCode> file. */}
            </div>
            <div className='h-4 text-sm leading-4'>
              {isPending ? (
                <Loading className='justify-start h-4 text-sm leading-none' />
              ) : (
                <span className='text-rose-500'>
                  {typeof errorMessage === 'string' && errorMessage}
                </span>
              )}
            </div>
            <Button className='flex w-fit ml-auto' type='submit'>
              Sign in
            </Button>
          </form>
        </div>
        <Footer />
      </div>
    </main>
  );
}
