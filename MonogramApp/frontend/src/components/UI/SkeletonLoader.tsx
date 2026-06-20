import React from 'react';

interface SkeletonLoaderProps {
  type?: 'text' | 'avatar' | 'message' | 'chat' | 'image' | 'video';
  count?: number;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'text',
  count = 1,
  width,
  height,
  borderRadius = '8px',
  className = ''
}) => {
  const getDefaultStyles = () => {
    switch (type) {
      case 'avatar':
        return { width: width || '40px', height: height || '40px', borderRadius: '50%' };
      case 'message':
        return { width: width || '70%', height: height || '60px', borderRadius: '12px' };
      case 'chat':
        return { width: width || '100%', height: height || '70px', borderRadius: '12px' };
      case 'image':
        return { width: width || '150px', height: height || '150px', borderRadius: '12px' };
      case 'video':
        return { width: width || '200px', height: height || '120px', borderRadius: '12px' };
      default:
        return { width: width || '100%', height: height || '16px', borderRadius };
    }
  };

  const styles = getDefaultStyles();

  return (
    <div className={`skeleton-wrapper ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="skeleton-item"
          style={{
            ...styles,
            background: 'linear-gradient(90deg, var(--bg-primary) 25%, var(--hover-bg) 50%, var(--bg-primary) 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeletonLoading 1.5s infinite',
            borderRadius: styles.borderRadius,
            marginBottom: index < count - 1 ? '8px' : 0
          }}
        />
      ))}
      <style>{`
        @keyframes skeletonLoading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default SkeletonLoader;