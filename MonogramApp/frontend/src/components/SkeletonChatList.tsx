import React from 'react';
import Skeleton from './Skeleton';

const SkeletonChatList: React.FC = () => (
  <div className="skeleton-chat-list">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="skeleton-chat-row">
        <Skeleton variant="circular" width="48px" height="48px" />
        <div className="skeleton-chat-row-content">
          <Skeleton width="60%" height="14px" />
          <Skeleton width="40%" height="12px" />
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonChatList;
