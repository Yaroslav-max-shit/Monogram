import React, { useState } from 'react';
import Icon from './Icon';

interface FileMessageProps {
  file: {
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number;
    caption?: string;
  };
  onMediaClick: (url: string) => void;
}

const FileMessage: React.FC<FileMessageProps> = ({ file, onMediaClick }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('video/')) return 'video';
    if (fileType.startsWith('audio/')) return 'mic';
    if (fileType.includes('pdf')) return 'file-pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'file-doc';
    if (fileType.includes('sheet') || fileType.includes('excel')) return 'file-xls';
    return 'file';
  };

  const handleClick = () => {
    if (file.file_type.startsWith('image/') || file.file_type.startsWith('video/')) {
      onMediaClick(file.file_url);
    } else {
      handleDownload();
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="file-message" onClick={handleClick}>
      <div className="file-icon">
        <Icon name={getFileIcon(file.file_type)} size={32} />
      </div>
      <div className="file-info">
        <div className="file-name">{file.file_name}</div>
        <div className="file-size">{formatFileSize(file.file_size)}</div>
        {file.caption && <div className="file-caption">{file.caption}</div>}
      </div>
      <button className="file-download-btn" onClick={handleDownload} disabled={isDownloading}>
        <Icon name={isDownloading ? 'loader' : 'download'} size={20} />
      </button>
    </div>
  );
};

export default FileMessage;