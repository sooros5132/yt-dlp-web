import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';

type targetType = HTMLElement | null;

export type useIntersectionObserverType = (parmas?: {
  onIntersectCallback?: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
}) => {
  isIntersecting: boolean;
  setTarget: Dispatch<SetStateAction<targetType>>;
};

export const useIntersectionObserver: useIntersectionObserverType = (params) => {
  const isIntersectionObserverSupported =
    !Boolean('IntersectionObserver' in window) &&
    !Boolean('IntersectionObserverEntry' in window) &&
    !Boolean('intersectionRatio' in window.IntersectionObserverEntry.prototype);

  const { onIntersectCallback, options } = params || {};
  const [isIntersecting, setIsIntersecting] = useState<boolean>(!isIntersectionObserverSupported);
  const [target, setTarget] = useState<targetType>(null);
  const { root, rootMargin = '0px', threshold = 0 } = options || {};

  useEffect(() => {
    if (!target) return;

    const handleIntersectDefaultCallback: IntersectionObserverCallback = (entries) => {
      const newIsIntersecting = entries?.[0]?.isIntersecting || false;
      setIsIntersecting(newIsIntersecting);
    };

    const onIntersect = onIntersectCallback || handleIntersectDefaultCallback;

    const observer: IntersectionObserver = new IntersectionObserver(onIntersect, {
      root,
      rootMargin,
      threshold
    });
    observer.observe(target);

    return () => {
      observer.unobserve(target);
      observer.disconnect();
    };
  }, [onIntersectCallback, root, rootMargin, target, threshold]);

  return { isIntersecting, setTarget };
};
