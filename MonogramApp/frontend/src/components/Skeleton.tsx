import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  count?: number;
  variant?: 'text' | 'circular' | 'rectangular';
}

const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius,
  count = 1,
  variant = 'text',
}) => {
  const style: React.CSSProperties = {
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height: height || (variant === 'text' ? '14px' : variant === 'circular' ? '40px' : '100px'),
    borderRadius: borderRadius || (variant === 'circular' ? '50%' : variant === 'rectangular' ? '8px' : '4px'),
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={style} />
      ))}
    </>
  );
};

export default Skeleton;
