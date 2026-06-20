import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '../Icon';
import WebRTCService from '../../services/webRTC';
import CallUI from './CallUI';

interface AudioCallProps {
  callId: string;
  chatName: string;
  isIncoming?: boolean;
  ws: WebSocket;
  onEnd: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}

const AudioCall: React.FC<AudioCallProps> = ({
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
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [status]);

  const setupVolumeMeter = useCallback(async () => {
    const localStream = WebRTCService.getLocalStream();
    if (!localStream) return;

    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(localStream);
      sourceRef.current.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        let avg = sum / dataArray.length;
        let level = Math.min(1, avg / 128);
        setVolumeLevel(level);
        animationRef.current = requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
    } catch (err) {
      console.error('Failed to setup volume meter:', err);
    }
  }, []);

  useEffect(() => {
    if (status === 'connected') {
      setupVolumeMeter();
    }
  }, [status, setupVolumeMeter]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    const muted = WebRTCService.toggleMute();
    setIsMuted(muted);
  };

  const toggleSpeaker = () => {
    setSpeakerEnabled(prev => !prev);
    // Реализация переключения динамика
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
        <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '48px' }}>Входящий аудиозвонок...</div>
        
        <div style={{ display: 'flex', gap: '32px' }}>
          <button onClick={acceptCall} style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: '#10b981', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon name="phone" size={32} style={{ filter: 'brightness(0) invert(1)' }} />
          </button>
          <button onClick={rejectCall} style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: '#ef4444', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
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
    <div className="call-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      zIndex: 10000, display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{chatName}</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{status === 'connected' ? formatTime(duration) : 'Соединение...'}</div>
        </div>
        <button onClick={endCall} style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: '#ef4444', border: 'none', cursor: 'pointer'
        }}>
          <Icon name="phone-down" size={24} style={{ filter: 'brightness(0) invert(1)' }} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div className="audio-visualizer" style={{
          width: '200px', height: '200px', borderRadius: '100px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '32px', position: 'relative'
        }}>
          <div className="pulse-ring" style={{
            position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
            animation: 'pulse 1.5s infinite', background: 'rgba(102,126,234,0.3)'
          }} />
          <div style={{ fontSize: '3rem', fontWeight: 'bold', zIndex: 2 }}>{chatName.charAt(0).toUpperCase()}</div>
        </div>
        
        <div className="volume-meter" style={{ width: '80%', maxWidth: '300px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${volumeLevel * 100}%`, height: '100%', background: '#10b981', transition: 'width 0.05s linear' }} />
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', gap: '24px' }}>
        <button onClick={toggleMute} style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.2)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon name={isMuted ? 'volume-off' : 'mic'} size={24} style={{ filter: 'brightness(0) invert(1)' }} />
        </button>
        <button onClick={toggleSpeaker} style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: speakerEnabled ? 'rgba(255,255,255,0.2)' : '#ef4444',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon name="volume" size={24} style={{ filter: 'brightness(0) invert(1)' }} />
        </button>
        <button onClick={endCall} style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: '#ef4444', border: 'none', cursor: 'pointer'
        }}>
          <Icon name="phone-down" size={28} style={{ filter: 'brightness(0) invert(1)' }} />
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default AudioCall;