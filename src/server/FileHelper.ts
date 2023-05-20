import { promises as fs } from 'fs';
import { CACHE_PATH, getCacheFilePath } from '@/server/CacheHelper';

export const COOKIES_FILE = 'cookies';

export async function getYtDlpCookies<T>() {
  try {
    const filePath = getCacheFilePath(COOKIES_FILE, 'txt');
    const content = await fs.readFile(filePath, 'utf-8');

    return content as T;
  } catch (e) {
    return;
  }
}

export async function setYtDlpCookies(content: string) {
  try {
    const filePath = getCacheFilePath(COOKIES_FILE, 'txt');

    try {
      await fs.access(filePath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (e) {
      await fs.mkdir(CACHE_PATH, { recursive: true });
    }

    await fs.writeFile(filePath, content, 'utf-8');

    return true;
  } catch (e) {
    return false;
  }
}

export async function deleteYtDlpCookies() {
  const filePath = getCacheFilePath(COOKIES_FILE, 'txt');

  try {
    await fs.unlink(filePath);
    return true;
  } catch (e) {
    return false;
  }
}
