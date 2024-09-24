import { NextResponse } from 'next/server';
import { match } from 'path-to-regexp';

import type { NextRequest } from 'next/server';

import { getSession } from '@/server/actions/auth';

const AUTH_SECRET = process.env.AUTH_SECRET;
const CREDENTIAL_USERNAME = process.env.CREDENTIAL_USERNAME;
const CREDENTIAL_PASSWORD = process.env.CREDENTIAL_PASSWORD;
const isRequiredAuthentication = Boolean(AUTH_SECRET && CREDENTIAL_USERNAME && CREDENTIAL_PASSWORD);

const publicApiPaths = new Set([
  // 'cookies',
  // 'd',
  // 'file',
  // 'files',
  // 'image',
  // 'info',
  // 'list',
  'og',
  // 'playlist',
  // 'r',
  // 'recording',
  'stat',
  // 'subtitles',
  // 'sync-cache',
  // 'thumbnail',
  'v'
]);

export async function middleware(request: NextRequest) {
  if (isRequiredAuthentication) {
    if (request.nextUrl.pathname === '/') {
      if (await getSession()) {
        return NextResponse.next();
      }
      let callback = '';
      try {
        callback = encodeURIComponent(`${request.nextUrl.pathname}${request.nextUrl.search}`);
      } catch (e) {}

      return NextResponse.redirect(
        new URL(`/signin${callback ? `?callback=${callback}` : ''}`, request.url)
      );
    } else if (request.nextUrl.pathname === '/signin') {
      return (await getSession())
        ? NextResponse.redirect(new URL('/', request.url))
        : NextResponse.next();
    }

    if (request.nextUrl.pathname.startsWith('/api')) {
      const fn = match('/api/*paths')(request.nextUrl.pathname);

      if (fn && Array.isArray(fn?.params?.paths) && !publicApiPaths.has(fn.params.paths?.[0])) {
        return (await getSession())
          ? NextResponse.next()
          : NextResponse.json({ code: 403, error: 'Forbidden' }, { status: 403 });
      }
    }
  }
  return NextResponse.next();
}
