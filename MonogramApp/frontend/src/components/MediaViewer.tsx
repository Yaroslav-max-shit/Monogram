import React, { useEffect } from 'react';
import Icon from './Icon';
import './MediaViewer.css';

interface MediaViewerProps {
  src: string;
  type?: 'image' | 'video';
  onClose: () => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({ src, type = 'image', onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getFileType = (): 'image' | 'video' => {
    if (type) return type;
    const ext = src.split('.').pop()?.toLowerCase();
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext || '')) return 'video';
    return 'image';
  };

  const fileType = getFileType();

  return (
    <div className="media-viewer-overlay" onClick={onClose}>
      <button className="media-viewer-close" onClick={onClose}>
        <Icon name="close" size={24} />
      </button>
      
      <div className="media-viewer-content" onClick={(e) => e.stopPropagation()}>
        {fileType === 'image' ? (
          <img src={src} alt="Media" className="media-viewer-image" />
        ) : (
          <video src={src} controls autoPlay className="media-viewer-video" />
        )}
      </div>
    </div>
  );
};

export default MediaViewer;