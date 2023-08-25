import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import isEquals from 'react-fast-compare';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isPropsEquals = isEquals;

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';
