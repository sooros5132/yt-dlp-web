import { cn } from '@/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';

import * as React from 'react';

export interface DividerProps
  extends React.ButtonHTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dividerVariants> {}

const dividerVariants = cva(
  'flex items-center [&:not(:empty)]:gap-4 before:content-[""] before:grow before:bg-foreground/20 after:content-[""] after:grow after:bg-foreground/20',
  {
    variants: {
      variant: {
        default: 'before:h-[1px] after:h-[1px]',
        horizontal: 'flex-col before:w-[1px] after:w-[1px]'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ variant, className, children, ...props }, ref) => (
    <div ref={ref} className={cn(dividerVariants({ variant, className }))} {...props}>
      {children}
    </div>
  )
);
Divider.displayName = 'Divider';

export { Divider, dividerVariants };
