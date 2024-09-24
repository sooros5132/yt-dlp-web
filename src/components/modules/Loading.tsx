import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { type ClassValue } from 'clsx';
import { cn } from '@/lib/utils';

export function Loading({ className }: { className?: ClassValue }) {
  return (
    <div className={cn('text-xl flex justify-center', className)}>
      <span className='w-[1em] h-[1em] animate-spin'>
        <AiOutlineLoading3Quarters />
      </span>
    </div>
  );
}
