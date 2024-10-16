import path from 'path';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';

import { lruCache } from '@/server/lruCache';
import { CACHE_PATH, DOWNLOAD_PATH, WRITE_TEST_FILE } from '@/server/constants';

const MOUNT_TEST = 'mount-test';

async function checkCacheFolderIsAccessible() {
  const filePath = path.resolve(CACHE_PATH, WRITE_TEST_FILE);
  try {
    const cacheData = lruCache.get(WRITE_TEST_FILE);

    if (cacheData) {
      return true;
    }
    //! fs.access는 실제 권한이 없어도 사용 가능하다고 뜬다. writeFile로 사용하기
    await fs.writeFile(filePath, WRITE_TEST_FILE, 'utf-8');

    lruCache.set(filePath, WRITE_TEST_FILE, {
      ttl: 60 * 60 * 1000 // 1 hour
    });

    await fs.unlink(filePath);

    return true;
  } catch (e) {
    lruCache.delete(filePath);
    return false;
  }
}

async function checkDownloadFolderIsAccessible() {
  const filePath = path.resolve(DOWNLOAD_PATH, WRITE_TEST_FILE);
  try {
    const cacheData = lruCache.get(WRITE_TEST_FILE);

    if (cacheData) {
      return true;
    }
    //! fs.access는 실제 권한이 없어도 사용 가능하다고 뜬다. writeFile로 사용하기
    await fs.writeFile(filePath, WRITE_TEST_FILE, 'utf-8');

    lruCache.set(filePath, WRITE_TEST_FILE, {
      ttl: 60 * 60 * 1000 // 1 hour
    });

    await fs.unlink(filePath);

    return true;
  } catch (e) {
    lruCache.delete(filePath);
    return false;
  }
}

export async function checkRequiredFoldersAreAccessible() {
  const [downloadsFolderIsAccessible, cacheFolderIsAccessible] = await Promise.all([
    checkDownloadFolderIsAccessible(),
    checkCacheFolderIsAccessible()
  ]);

  const folders: string[] = [];

  if (!downloadsFolderIsAccessible) {
    folders.push('`downloads`');
  }
  if (!cacheFolderIsAccessible) {
    folders.push('`cache`');
  }
  if (folders.length) {
    throw `Please grant read and write permissions to the ${folders.join(', ')} folder${
      folders.length > 1 ? 's' : ''
    }.`;
  }
}

export async function checkRequiredFoldersAreMounted() {
  try {
    const cacheData = lruCache.get(MOUNT_TEST);

    if (cacheData) {
      return true;
    }

    lruCache.set(MOUNT_TEST, MOUNT_TEST, {
      ttl: 24 * 60 * 60 * 1000 // 24 hour
    });

    return new Promise((resolve: (result: boolean) => void, reject: (message: string) => void) => {
      const process = spawn("cat /proc/mounts | grep -E -i '/downloads|/cache'", {
        shell: true
      });

      let stdoutChunks = '';

      process.stdout.setEncoding('utf-8');
      process.stdout.on('data', (data) => {
        const text = data?.trim?.();
        if (text) stdoutChunks += text;
      });

      process.stderr.setEncoding('utf-8');
      process.stderr.on('data', (data) => {
        return reject(data?.trim?.() || '');
      });

      process.on('exit', () => {
        if (!stdoutChunks) {
          return reject('The `/downloads`, `/cache` folders does not appear to be mounted.');
        }
        if (!stdoutChunks.includes('/downloads')) {
          return reject('The `/downloads` folder does not appear to be mounted.');
        }
        if (!stdoutChunks.includes('/cache')) {
          return reject('The `/cache` folder does not appear to be mounted.');
        }

        return resolve(true);
      });
    });
  } catch (err) {
    lruCache.delete(MOUNT_TEST);
    throw typeof err === 'string' ? err : 'Unable to check mount information';
  }
}
