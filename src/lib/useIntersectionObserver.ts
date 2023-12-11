import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';

type targetType = HTMLElement | null;

export type useIntersectionObserverType = (
  onIntersect: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) => {
  setTarget: Dispatch<SetStateAction<targetType>>;
};

export const useIntersectionObserver: useIntersectionObserverType = (onIntersect, options) => {
  const [target, setTarget] = useState<targetType>(null);
  const { root, rootMargin = '0px', threshold = 0 } = options || {};

  useEffect(() => {
    if (!target) return;

    const observer: IntersectionObserver = new IntersectionObserver(onIntersect, {
      root,
      rootMargin,
      threshold
    });
    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [onIntersect, root, rootMargin, target, threshold]);

  return { setTarget };
};
