import React, { useState, useEffect, useRef } from 'react';

interface CallScreenProps {
  chatId: number;
  userId: number;
  peerId: number;
  peerName: string;
  onEnd: () => void;
}

type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

const CallScreen: React.FC<CallScreenProps> = ({ chatId, userId, peerId, peerName, onEnd }) => {
  const [callState, setCallState] = useState<CallState>('calling');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    startCall();
    return () => { cleanup(); };
  }, []);

  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    } catch (err) { console.error('Media error:', err); }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = isMuted; });
      setIsMuted(!isMuted);
    }
  };

  const toggleSpeaker = () => { setIsSpeakerOn(!isSpeakerOn); };

  const cleanup = () => {
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="call-screen-container">
      <div className="call-screen-content">
        <div className="call-avatar" style={{ animation: callState === 'calling' || callState === 'ringing' ? 'pulse 1.5s infinite' : 'none' }}>
          {peerName.charAt(0).toUpperCase()}
        </div>
        <div className="call-peer-name">{peerName}</div>
        <div className="call-status">
          {callState === 'calling' && 'Calling...'}
          {callState === 'ringing' && 'Ringing...'}
          {callState === 'connected' && formatDuration(duration)}
          {callState === 'ended' && 'Call ended'}
        </div>
      </div>
      <div className="call-controls">
        <button className={`call-btn ${isMuted ? 'danger' : ''}`} onClick={toggleMute}>
          {isMuted ? 'MUTE' : 'MIC'}
        </button>
        <button className={`call-btn ${isSpeakerOn ? '' : 'danger'}`} onClick={toggleSpeaker}>
          {isSpeakerOn ? 'SPK' : 'MUT'}
        </button>
        <button className="call-btn end-call" onClick={onEnd}>END</button>
      </div>
      <video ref={localVideoRef} autoPlay playsInline muted style={{ display: 'none' }} />
    </div>
  );
};

export default CallScreen;