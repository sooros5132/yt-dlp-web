import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { type ClassValue } from 'clsx';
import { cn } from '@/lib/utils';

export function Loading({ className }: { className?: ClassValue }) {
  return (
    <div className={cn('text-xl flex justify-center animate-spin', className)}>
      <AiOutlineLoading3Quarters />
    </div>
  );
}
