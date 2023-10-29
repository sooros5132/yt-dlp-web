'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { TbMoon, TbSun, TbDeviceMobileCog } from 'react-icons/tb';

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='rounded-full'>
          <TbSun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
          <TbMoon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
          <span className='sr-only'>Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem className='gap-x-2 cursor-pointer' onClick={() => setTheme('light')}>
          <TbSun className='text-[1.2rem]' />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem className='gap-x-2 cursor-pointer' onClick={() => setTheme('dark')}>
          <TbMoon className='text-[1.2rem]' />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem className='gap-x-2 cursor-pointer' onClick={() => setTheme('system')}>
          <TbDeviceMobileCog className='text-[1.2rem]' />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
