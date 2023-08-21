import { GoDotFill } from 'react-icons/go';

export const PingSvg = () => {
  return (
    <div className='relative inline-block pointer-events-none text-current'>
      <GoDotFill className='animate-ping' />
      <GoDotFill className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' />
    </div>
  );
};
