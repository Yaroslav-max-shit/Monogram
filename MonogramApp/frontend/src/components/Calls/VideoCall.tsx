import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '../Icon';
import WebRTCService from '../../services/webRTC';

interface VideoCallProps {
  callId: string;
  chatName: string;
  isIncoming?: boolean;
  ws: WebSocket;
  onEnd: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({
  callId,
  chatName,
  isIncoming = false,
  ws,
  onEnd,
  onAccept,
  onReject
}) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'ended' | 'rejected'>('connecting');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCameraFront, setIsCameraFront] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleRemoteStream = (stream: MediaStream | null) => {
      setRemoteStream(stream);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
    };
    
    const handleLocalStream = (stream: MediaStream | null) => {
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    };
    
    WebRTCService.on('remoteStreamReady', handleRemoteStream);
    WebRTCService.on('localStreamReady', handleLocalStream);
    
    return () => {
      WebRTCService.off('remoteStreamReady', handleRemoteStream);
      WebRTCService.off('localStreamReady', handleLocalStream);
    };
  }, []);

  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    const muted = WebRTCService.toggleMute();
    setIsMuted(muted);
  };

  const toggleVideo = () => {
    const videoOff = WebRTCService.toggleVideo();
    setIsVideoOff(videoOff);
  };

  const switchCamera = () => {
    WebRTCService.switchCamera();
    setIsCameraFront(prev => !prev);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const endCall = () => {
    WebRTCService.endCall();
    setStatus('ended');
    setTimeout(() => onEnd(), 500);
  };

  const acceptCall = () => {
    setStatus('connecting');
    onAccept?.();
  };

  const rejectCall = () => {
    setStatus('rejected');
    onReject?.();
    setTimeout(() => onEnd(), 500);
  };

  if (isIncoming) {
    return (
      <div className="call-overlay" style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        zIndex: 10000, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', color: 'white'
      }}>
        <div className="call-avatar" style={{
          width: '120px', height: '120px', borderRadius: '60px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '3rem', fontWeight: 'bold', marginBottom: '24px'
        }}>
          {chatName.charAt(0).toUpperCase()}
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>{chatName}</div>
        <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '48px' }}>Входящий видеозвонок...</div>
        
        <div style={{ display: 'flex', gap: '32px' }}>
          <button onClick={acceptCall} style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: '#10b981', border: 'none', cursor: 'pointer'
          }}>
            <Icon name="phone" size={32} style={{ filter: 'brightness(0) invert(1)' }} />
          </button>
          <button onClick={rejectCall} style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: '#ef4444', border: 'none', cursor: 'pointer'
          }}>
            <Icon name="phone-down" size={32} style={{ filter: 'brightness(0) invert(1)' }} />
          </button>
        </div>
      </div>
    );
  }

  if (status === 'ended') {
    return (
      <div className="call-overlay" style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.95)', zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Icon name="phone-down" size={64} style={{ marginBottom: '24px', opacity: 0.5 }} />
          <div style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Звонок завершён</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Длительность: {formatTime(duration)}</div>
          <button onClick={onEnd} style={{
            marginTop: '32px', padding: '12px 24px',
            background: 'var(--accent)', border: 'none', borderRadius: '12px',
            color: 'white', cursor: 'pointer'
          }}>Закрыть</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="video-call-container" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#000', zIndex: 10000, display: 'flex', flexDirection: 'column'
    }}>
      {/* Удалённое видео */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          background: '#000'
        }}
      />
      
      {/* Локальное видео (картинка-в-картинке) */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          width: '120px',
          height: '160px',
          borderRadius: '12px',
          objectFit: 'cover',
          border: '2px solid rgba(255,255,255,0.3)',
          zIndex: 10,
          cursor: 'pointer'
        }}
        onClick={() => {
          if (localVideoRef.current) {
            localVideoRef.current.classList.toggle('enlarged');
          }
        }}
      />
      
      {/* Информация о звонке */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10,
        background: 'rgba(0,0,0,0.5)',
        padding: '8px 16px',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ color: 'white', fontWeight: 500 }}>{chatName}</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
          {status === 'connected' ? formatTime(duration) : 'Соединение...'}
        </div>
      </div>
      
      {/* Кнопка завершения */}
      <button onClick={endCall} style={{
        position: 'absolute',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: '#ef4444',
        border: 'none',
        cursor: 'pointer',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
      }}>
        <Icon name="phone-down" size={28} style={{ filter: 'brightness(0) invert(1)' }} />
      </button>
      
      {/* Контролы */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        right: '20px',
        display: 'flex',
        gap: '16px',
        zIndex: 10
      }}>
        <button onClick={toggleMute} style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.2)',
          border: 'none',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)'
        }}>
          <Icon name={isMuted ? 'volume-off' : 'mic'} size={20} style={{ filter: 'brightness(0) invert(1)' }} />
        </button>
        
        <button onClick={toggleVideo} style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: isVideoOff ? '#ef4444' : 'rgba(255,255,255,0.2)',
          border: 'none',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)'
        }}>
          <Icon name={isVideoOff ? 'video-off' : 'video'} size={20} style={{ filter: 'brightness(0) invert(1)' }} />
        </button>
        
        <button onClick={switchCamera} style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)'
        }}>
          <Icon name="refresh" size={20} style={{ filter: 'brightness(0) invert(1)' }} />
        </button>
        
        <button onClick={toggleFullscreen} style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)'
        }}>
          <Icon name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'} size={20} style={{ filter: 'brightness(0) invert(1)' }} />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;