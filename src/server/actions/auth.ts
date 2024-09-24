'use server';

import {
  auth,
  InvalidCredentials,
  signIn as NextAuthSignIn,
  signOut as NextAuthSignOut,
  update
} from '@/auth';

import type { NextAuthResult, Session } from 'next-auth';

export const signIn = async ({
  username,
  password,
  redirectTo
}: {
  username: string;
  password: string;
  redirectTo?: string;
}) => {
  try {
    await NextAuthSignIn('credentials', {
      username,
      password,
      redirectTo: redirectTo ? redirectTo : '/'
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error; // Re-throw to let Next.js handle the redirect
    }

    if (error instanceof InvalidCredentials) {
      return error?.message || 'Unknown server error';
    }
    return 'Unknown server error';
  }
};

export const signInWithCredentials = async (formData: FormData) => {
  try {
    await NextAuthSignIn('credentials', {
      username: formData.get('username') || '',
      password: formData.get('password') || '',
      redirectTo: '/'
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error; // Re-throw to let Next.js handle the redirect
    }

    if (error instanceof InvalidCredentials) {
      return error?.message || 'Unknown server error';
    }
    return 'Unknown server error';
  }
};

export const signOutWithForm = async (/* formData: FormData */) => {
  await NextAuthSignOut();
};

export const isRequiredAuthentication = async (/* formData: FormData */) => {
  const AUTH_SECRET = process.env.AUTH_SECRET;
  const CREDENTIAL_USERNAME = process.env.CREDENTIAL_USERNAME;
  const CREDENTIAL_PASSWORD = process.env.CREDENTIAL_PASSWORD;

  return Boolean(AUTH_SECRET && CREDENTIAL_USERNAME && CREDENTIAL_PASSWORD);
};

const _getSession = async (...args: Parameters<NextAuthResult['auth']>) => {
  return auth(...args);
};

const getSession = _getSession as unknown as (() => Promise<Session>) &
  ((...args: Parameters<NextAuthResult['auth']>) => Promise<Session>);

export { getSession, update as updateSession };
