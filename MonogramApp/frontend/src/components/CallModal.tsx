import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

interface CallModalProps {
  chatId: number;
  chatName: string;
  currentUserId: number;
  type: 'audio' | 'video';
  onClose: () => void;
}

const CallModal: React.FC<CallModalProps> = ({ chatName, type, onClose }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('Звонок...');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  useEffect(() => {
    // Здесь будет WebRTC логика
    const initCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video'
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setStatus('Соединение...');
      } catch (e) {
        setStatus('Ошибка доступа к камере/микрофону');
      }
    };
    initCall();
  }, [type]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#111', zIndex: 10000, display: 'flex',
      flexDirection: 'column', color: 'white'
    }}>
      {/* Верхняя панель */}
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{chatName}</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{status}</div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
          width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem'
        }}>✕</button>
      </div>

      {/* Видео */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        {type === 'video' ? (
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '120px', height: '120px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              margin: '0 auto 20px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '3rem', fontWeight: 700
            }}>
              {chatName.charAt(0)}
            </div>
            <div style={{ fontSize: '1.5rem' }}>{chatName}</div>
          </div>
        )}
        
        {type === 'video' && (
          <video ref={localVideoRef} autoPlay playsInline muted style={{
            position: 'absolute', bottom: '20px', right: '20px',
            width: '150px', height: '100px', borderRadius: '12px',
            objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)'
          }} />
        )}
      </div>

      {/* Нижняя панель с кнопками */}
      <div style={{
        padding: '30px', display: 'flex', justifyContent: 'center', gap: '20px',
        background: 'rgba(0,0,0,0.5)'
      }}>
        <button onClick={() => setIsMuted(!isMuted)} style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.2)',
          border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem'
        }}>
          {isMuted ? '🔇' : '🎤'}
        </button>
        
        <button onClick={() => setIsSpeakerOn(!isSpeakerOn)} style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: isSpeakerOn ? 'rgba(255,255,255,0.2)' : '#ef4444',
          border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem'
        }}>
          {isSpeakerOn ? '🔊' : '🔇'}
        </button>
        
        {type === 'video' && (
          <button style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', border: 'none',
            color: 'white', cursor: 'pointer', fontSize: '1.2rem'
          }}>
            🔄
          </button>
        )}
        
        <button onClick={onClose} style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: '#ef4444', border: 'none', color: 'white',
          cursor: 'pointer', fontSize: '1.5rem'
        }}>
          📞
        </button>
      </div>
    </div>
  );
};

export default CallModal;