import React, { useEffect } from 'react';

interface LiveMascot3DProps {
  onComplete: () => void;
}

const LiveMascot3D: React.FC<LiveMascot3DProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="live-mascot-container">
      <div className="live-mascot-spinner" />
      <p>Загрузка...</p>
    </div>
  );
};

export default LiveMascot3D;
