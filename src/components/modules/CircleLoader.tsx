import { cn } from '@/lib/utils';
import type { SVGProps } from 'react';

export const CircleLoader = ({
  className: _className,
  width,
  height,
  ...props
}: Omit<SVGProps<SVGSVGElement>, 'viewBox'>) => {
  const className = cn('animate-[spin_2s_linear_infinite]', _className);
  return (
    <svg
      className={className}
      width={width || '1.7em'}
      height={height || '1.7em'}
      viewBox='25 25 50 50'
      {...props}
    >
      <circle
        className='loader-circle'
        cx='50'
        cy='50'
        r='20'
        fill='none'
        stroke='#70c542'
        strokeWidth='6'
      />
    </svg>
  );
};
