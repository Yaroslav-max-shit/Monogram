import React, { useState, useEffect, useRef, ReactNode } from 'react';
import Icon from '../Icon';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  pullDistance?: number;
  refreshTimeout?: number;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  pullDistance = 80,
  refreshTimeout = 1000
}) => {
  const [startY, setStartY] = useState(0);
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPullable, setIsPullable] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0 && !isRefreshing) {
        touchStartRef.current = e.touches[0].clientY;
        setStartY(e.touches[0].clientY);
        setIsPullable(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullable || isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartRef.current;
      
      if (diff > 0 && container.scrollTop === 0) {
        e.preventDefault();
        const progress = Math.min(diff / pullDistance, 1);
        setPullProgress(progress);
        
        if (container) {
          container.style.transform = `translateY(${diff * 0.5}px)`;
          container.style.transition = 'transform 0.05s linear';
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullable || isRefreshing) {
        resetPull();
        return;
      }

      if (pullProgress >= 0.8) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh error:', error);
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            resetPull();
          }, refreshTimeout);
        }
      } else {
        resetPull();
      }
    };

    const resetPull = () => {
      if (containerRef.current) {
        containerRef.current.style.transform = '';
        containerRef.current.style.transition = 'transform 0.3s ease';
      }
      setPullProgress(0);
      setIsPullable(true);
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, onRefresh, isRefreshing, pullProgress, isPullable]);

  const refreshIconRotation = pullProgress * 360;

  return (
    <div ref={containerRef} style={{ overflowY: 'auto', height: '100%', position: 'relative' }}>
      <div
        className="pull-to-refresh-indicator"
        style={{
          position: 'absolute',
          top: -60,
          left: 0,
          right: 0,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          opacity: pullProgress,
          transform: `translateY(${pullProgress * 60}px)`,
          transition: 'opacity 0.2s, transform 0.2s',
          background: 'transparent'
        }}
      >
        {isRefreshing ? (
          <div className="loading-spinner-small" style={{ width: 24, height: 24 }} />
        ) : (
          <Icon
            name="arrow"
            size={20}
            style={{
              transform: `rotate(${refreshIconRotation}deg)`,
              transition: 'transform 0.2s'
            }}
          />
        )}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
          {isRefreshing ? 'Обновление...' : pullProgress > 0.8 ? 'Отпустите для обновления' : 'Тяните вниз для обновления'}
        </span>
      </div>
      {children}
    </div>
  );
};

export default PullToRefresh;