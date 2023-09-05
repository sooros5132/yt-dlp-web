import { NextResponse } from 'next/server';
import { CacheHelper } from '@/server/helpers/CacheHelper';
import { Cookie } from '@/types/types';
import { compareSecretkey, encryptSecretkey } from '@/server/crypto';
import { COOKIES_FILE, getYtDlpCookies, setYtDlpCookies } from '@/server/helpers/CookieFileHelper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const urlObject = new URL(request.url);
  const searchParams = urlObject.searchParams;
  const secretKey = searchParams.get('secretKey');

  try {
    const cookieInfo = await CacheHelper.get<Cookie>(COOKIES_FILE);
    const cookies = await getYtDlpCookies();

    if (!cookieInfo || !cookieInfo.secretKey || !cookies) {
      return NextResponse.json({
        success: true,
        cookies: '',
        existed: false
      });
    }

    try {
      if (typeof secretKey !== 'string' || !secretKey) {
        throw 'Secret key is incorrect.';
      }
      await compareSecretkey(secretKey, cookieInfo.secretKey).catch(() => {
        throw 'Secret key is incorrect.';
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error,
          existed: true
        },
        {
          status: 403
        }
      );
    }

    return NextResponse.json({
      success: true,
      content: cookies,
      existed: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error
      },
      {
        status: 400
      }
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    secretKey: string;
    content: string;
  };
  const secretKey = body.secretKey;
  const content = body.content;

  try {
    if (typeof secretKey !== 'string' || !secretKey) {
      throw '`secretKey` is required and can only be of string type.';
    }
    if (typeof content !== 'string') {
      throw '`content` is required and can only be of string type.';
    }

    const savedCookies = await setYtDlpCookies(content);
    if (!savedCookies) {
      throw 'Failed save cookies';
    }
    const result = await CacheHelper.set(COOKIES_FILE, {
      secretKey: encryptSecretkey(secretKey)
    });

    return NextResponse.json({
      success: result
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: e
    });
  }
}
