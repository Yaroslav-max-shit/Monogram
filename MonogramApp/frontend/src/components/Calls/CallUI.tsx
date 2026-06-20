import React, { useState, useEffect, useRef } from 'react';
import Icon from '../Icon';
import WebRTCManager from './WebRTCManager';

interface CallUIProps {
  callId: string;
  chatName: string;
  type: 'audio' | 'video';
  isIncoming?: boolean;
  ws: WebSocket;
  onEnd: () => void;
}

const CallUI: React.FC<CallUIProps> = ({ callId, chatName, type, isIncoming, ws, onEnd }) => {
  const [status, setStatus] = useState<string>('Соединение...');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcRef = useRef<WebRTCManager>(new WebRTCManager());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    webrtcRef.current.onRemoteStream = (stream) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
    };
    initCall();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      webrtcRef.current.stopCall();
    };
  }, []);

  useEffect(() => {
    if (status === 'В звонке') {
      timerRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  const initCall = async () => {
    try {
      await webrtcRef.current.initLocalStream(type === 'video', type === 'video');
      if (localVideoRef.current) localVideoRef.current.srcObject = webrtcRef.current['localStream'];
      if (isIncoming) {
        setStatus('Входящий звонок...');
      } else {
        setStatus('Вызов...');
        await webrtcRef.current.createOffer(ws, callId);
        setStatus('Соединение...');
      }
      setupWebSocketHandlers();
    } catch (error) {
      setStatus('Ошибка доступа к камере/микрофону');
    }
  };

  const setupWebSocketHandlers = () => {
    const messageHandler = async (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.callId !== callId) return;
      switch (data.type) {
        case 'offer':
          await webrtcRef.current.handleOffer(data.offer, ws, callId);
          setStatus('Соединение...');
          break;
        case 'answer':
          await webrtcRef.current.handleAnswer(data.answer);
          setStatus('В звонке');
          break;
        case 'ice-candidate':
          await webrtcRef.current.handleIceCandidate(data.candidate);
          break;
        case 'accept':
          setStatus('В звонке');
          break;
        case 'reject':
          setStatus('Звонок отклонён');
          setTimeout(() => onEnd(), 2000);
          break;
        case 'end':
          setStatus('Звонок завершён');
          setTimeout(() => onEnd(), 2000);
          break;
      }
    };
    ws.addEventListener('message', messageHandler);
    return () => ws.removeEventListener('message', messageHandler);
  };

  const acceptCall = () => { ws.send(JSON.stringify({ type: 'accept', callId })); setStatus('Соединение...'); };
  const rejectCall = () => { ws.send(JSON.stringify({ type: 'reject', callId })); onEnd(); };
  const endCall = () => { ws.send(JSON.stringify({ type: 'end', callId })); onEnd(); };
  const toggleMute = () => { setIsMuted(webrtcRef.current.toggleMute()); };
  const toggleVideo = () => { setIsVideoOff(webrtcRef.current.toggleVideo()); };
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#111', zIndex: 10000, display: 'flex', flexDirection: 'column', color: 'white' }}>
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)' }}>
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{chatName}</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{status}</div>
          {status === 'В звонке' && <div>{formatTime(duration)}</div>}
        </div>
        <button onClick={endCall} style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer' }}><Icon name="phone-down" size={24} /></button>
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        {type === 'video' ? (
          <>
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            <video ref={localVideoRef} autoPlay playsInline muted style={{ position: 'absolute', bottom: '20px', right: '20px', width: '120px', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.3)' }} />
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 700 }}>{chatName.charAt(0)}</div>
            <div style={{ fontSize: '1.5rem' }}>{chatName}</div>
          </div>
        )}
      </div>
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', gap: '20px', background: 'rgba(0,0,0,0.5)' }}>
        {isIncoming && status === 'Входящий звонок...' ? (
          <>
            <button onClick={acceptCall} style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#10b981', border: 'none', cursor: 'pointer' }}><Icon name="phone" size={32} color="white" /></button>
            <button onClick={rejectCall} style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer' }}><Icon name="phone-down" size={32} color="white" /></button>
          </>
        ) : (
          <>
            <button onClick={toggleMute} style={{ width: '56px', height: '56px', borderRadius: '50%', background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer' }}><Icon name={isMuted ? 'volume-off' : 'mic'} size={24} color="white" /></button>
            {type === 'video' && <button onClick={toggleVideo} style={{ width: '56px', height: '56px', borderRadius: '50%', background: isVideoOff ? '#ef4444' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer' }}><Icon name={isVideoOff ? 'video-off' : 'video'} size={24} color="white" /></button>}
            <button onClick={endCall} style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer' }}><Icon name="phone-down" size={32} color="white" /></button>
          </>
        )}
      </div>
    </div>
  );
};

export default CallUI;