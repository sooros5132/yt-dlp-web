import path from 'path';
import { promises as fs } from 'fs';

export const DOWNLOAD_PATH = path.join('/', 'downloads');
export const CACHE_PATH = path.join('/', 'downloads', '.cache');
export const VIDEO_LIST_FILE = 'video-list';

function getCacheFilePath(uuid: string) {
  return path.join(CACHE_PATH, `${uuid}.json`);
}

export class Cache {
  static async list() {
    return [];
  }
  static async get<T = any>(uuid: string) {
    try {
      const filePath = getCacheFilePath(uuid);
      const content = await fs.readFile(filePath, 'utf-8');
      const parsedData = JSON.parse(content);

      console.log(`Get cache \`${filePath}\``);

      return parsedData as T;
    } catch (e) {
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

      await fs.writeFile(filePath, JSON.stringify(content), 'utf-8');
      console.log(`Saved content to ${filePath}.`);
      return true;
    } catch (e) {
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
      console.log(`Delete cache \`${filePath}\``);
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
      return true;
    } catch (e) {
      return false;
    }
  }
}
