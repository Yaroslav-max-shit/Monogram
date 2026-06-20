import React from 'react';
import Skeleton from './Skeleton';

const SkeletonMessageList: React.FC = () => (
  <div className="skeleton-message-list">
    {[70, 50, 80, 40, 60].map((width, i) => (
      <div key={i} className={`skeleton-message-row ${i % 2 === 0 ? 'own' : 'other'}`}>
        <Skeleton width={`${width}%`} height="36px" borderRadius="12px" />
      </div>
    ))}
  </div>
);

export default SkeletonMessageList;
