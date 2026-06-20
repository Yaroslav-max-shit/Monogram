import React, { useRef, useState, useCallback } from 'react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onClose?: () => void;
}

const SPEEDS = [0.5, 1, 1.5, 2];

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play();
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setVolume(vol);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = async () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;
    if (!document.fullscreenElement) {
      await container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await vid.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP not supported:', err);
    }
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`video-player-overlay ${isFullscreen ? 'fullscreen' : ''}`} onClick={onClose}>
      <div className="video-player-container" onClick={e => e.stopPropagation()}>
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
          className="video-player-element"
          playsInline
        />
        <div className="video-player-controls">
          <div className="video-progress-bar">
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="video-seek"
              style={{ '--progress': `${progress}%` } as React.CSSProperties}
            />
          </div>
          <div className="video-controls-row">
            <button className="video-control-btn" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
              )}
            </button>
            <span className="video-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
            <div className="video-volume-control">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
                {volume > 0 ? (
                  <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" strokeWidth="2" fill="none" />
                ) : null}
              </svg>
              <input type="range" min={0} max={1} step={0.05} value={volume} onChange={handleVolumeChange} className="video-volume-slider" />
            </div>
            <div className="video-speed-control">
              <button className="video-control-btn" onClick={() => setShowSpeedMenu(!showSpeedMenu)} title="Speed">
                {playbackSpeed}x
              </button>
              {showSpeedMenu && (
                <div className="video-speed-menu">
                  {SPEEDS.map(s => (
                    <button key={s} className={`video-speed-option ${s === playbackSpeed ? 'active' : ''}`} onClick={() => handleSpeedChange(s)}>
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="video-control-btn" onClick={togglePiP} title="Picture in Picture">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" /><rect x="11" y="9" width="9" height="6" rx="1" />
              </svg>
            </button>
            <button className="video-control-btn" onClick={toggleFullscreen} title="Fullscreen">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M8 3H5a2 2 0 00-2 2v3" /><path d="M21 8V5a2 2 0 00-2-2h-3" /><path d="M3 16v3a2 2 0 002 2h3" /><path d="M16 21h3a2 2 0 002-2v-3" />
              </svg>
            </button>
            {onClose && (
              <button className="video-control-btn video-close-btn" onClick={onClose} title="Close">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
