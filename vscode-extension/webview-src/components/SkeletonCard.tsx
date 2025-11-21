import React from 'react';

interface SkeletonCardProps {
  count?: number;
}

export const SkeletonCard: React.FC = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-header">
        <div className="skeleton-title"></div>
        <div className="skeleton-id"></div>
      </div>
      <div className="skeleton-tags">
        <div className="skeleton-tag"></div>
        <div className="skeleton-tag"></div>
      </div>
      <div className="skeleton-meta">
        <div className="skeleton-text"></div>
      </div>
    </div>
  );
};

export const SkeletonCards: React.FC<SkeletonCardProps> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </>
  );
};
