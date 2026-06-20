import { useEffect, useRef, useCallback, RefObject } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

export const useInfiniteScroll = ({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 200,
  rootMargin = '0px',
  enabled = true
}: UseInfiniteScrollOptions): RefObject<HTMLDivElement> => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isObserverConnected = useRef(false);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !isLoading && enabled) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore, enabled]);

  useEffect(() => {
    if (!enabled) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
      isObserverConnected.current = false;
    }

    observerRef.current = new IntersectionObserver(handleObserver, {
      rootMargin,
      threshold: threshold / 100
    });

    if (loadMoreRef.current && !isObserverConnected.current) {
      observerRef.current.observe(loadMoreRef.current);
      isObserverConnected.current = true;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
        isObserverConnected.current = false;
      }
    };
  }, [handleObserver, rootMargin, threshold, enabled]);

  useEffect(() => {
    if (loadMoreRef.current && observerRef.current && !isObserverConnected.current && enabled) {
      observerRef.current.observe(loadMoreRef.current);
      isObserverConnected.current = true;
    }
  }, [enabled]);

  return loadMoreRef;
};

export default useInfiniteScroll;