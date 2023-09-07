import path from 'path';
import { promises as fs } from 'fs';
import { lruCache } from '@/server/lruCache';
import { CACHE_PATH, CACHE_FILE_PREFIX } from '@/server/constants';

export function getCacheFilePath(uuid: string, extention = 'json') {
  return path.join(CACHE_PATH, `${CACHE_FILE_PREFIX}${uuid}.${extention}`);
}

export class CacheHelper {
  static async get<T = any>(uuid: string) {
    const cacheData = lruCache.get(uuid);

    if (cacheData) {
      return cacheData as T;
    }

    try {
      const filePath = getCacheFilePath(uuid);

      const content = await fs.readFile(filePath, 'utf-8');
      const parsedData = JSON.parse(content);

      lruCache.set(uuid, parsedData);

      return parsedData as T;
    } catch (e) {
      lruCache.delete(uuid);
      return;
    }
  }

  static async set(uuid: string, content: any) {
    try {
      const filePath = getCacheFilePath(uuid);

      try {
        await fs.access(filePath, fs.constants.R_OK | fs.constants.W_OK);
      } catch (e) {
        await fs.mkdir(CACHE_PATH, { recursive: true });
      }

      const parsedData = JSON.stringify(content);

      await fs.writeFile(filePath, parsedData, 'utf-8');
      lruCache.set(uuid, content);

      return true;
    } catch (e) {
      lruCache.delete(uuid);
      return false;
    }
  }
  static async access(uuid: string) {
    const cachePath = getCacheFilePath(uuid);

    try {
      await fs.access(cachePath, (fs.constants || fs).R_OK);

      return true;
    } catch (e) {
      return false;
    }
  }

  static async stat(uuid: string) {
    const cachePath = getCacheFilePath(uuid);

    try {
      await fs.access(cachePath, (fs.constants || fs).R_OK);

      return true;
    } catch (e) {
      return false;
    }
  }

  static async delete(uuid: string) {
    const filePath = getCacheFilePath(uuid);

    try {
      await fs.unlink(filePath);
      lruCache.delete(uuid);

      return true;
    } catch (e) {
      return false;
    }
  }

  static async deleteCacheDirectory() {
    if (path.resolve(CACHE_PATH) === '/') {
      return false;
    }

    try {
      await fs.rm(CACHE_PATH, { recursive: true, force: true, maxRetries: 1 });
      lruCache.clear();
      return true;
    } catch (e) {
      return false;
    }
  }
}
