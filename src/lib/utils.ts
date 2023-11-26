import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import isEquals from 'react-fast-compare';
import type { SelectQuality } from '@/types/video';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isPropsEquals = isEquals;

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

export function jsonStringifyPrettier(object: {}) {
  return JSON.stringify(object, null, '\t');
}

/**
 *
 * @returns 마지막 인덱스는 foramt 옵션의 값 입니다.
 */
export function qualityToYtDlpCmdOptions(resolution: SelectQuality) {
  switch (resolution) {
    case 'audio': {
      return ['-f', 'ba'];
    }
    case '4320p':
    case '2160p':
    case '1440p':
    case '1080p':
    case '720p':
    case '480p': {
      const res = resolution.replace('p', '');
      return ['-S', `res:${res},codec,br,fps`, '-f', 'bv+ba/b'];
    }
    case 'best':
    default: {
      return ['-f', 'bv+ba/b'];
    }
  }
}
