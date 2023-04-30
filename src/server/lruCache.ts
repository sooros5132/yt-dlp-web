import { LRUCache } from 'lru-cache';

// Dev 환경에서는 페이지마다 캐시가 다르다
export const lruCache = new LRUCache({
  max: 2000,
  ttl: 3600000 // 1Hours 1000 * 60 * 60
});
