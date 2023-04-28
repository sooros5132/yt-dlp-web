import { GoPrimitiveDot } from 'react-icons/go';

export const PingSvg = () => {
  return (
    <div className='relative inline-block pointer-events-none text-current'>
      <GoPrimitiveDot className='animate-ping' />
      <GoPrimitiveDot className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ' />
    </div>
  );
};
