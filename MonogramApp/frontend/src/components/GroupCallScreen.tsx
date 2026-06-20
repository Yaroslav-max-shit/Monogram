import React, { useRef } from 'react';
import { useGroupCall } from '../hooks/useGroupCall';

interface GroupCallScreenProps {
  roomId: string;
  userId: number;
  onEnd: () => void;
}

const GroupCallScreen: React.FC<GroupCallScreenProps> = ({ roomId, userId, onEnd }) => {
  const { participants, localStream, isMuted, isVideoOff, toggleMute, toggleVideo, shareScreen, endCall } = useGroupCall(roomId, userId);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isScreenSharing, setIsScreenSharing] = React.useState(false);

  React.useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleEnd = () => {
    endCall();
    onEnd();
  };

  const total = participants.length + 1;
  const gridCols = total <= 2 ? 2 : total <= 4 ? 2 : total <= 6 ? 3 : 3;

  return (
    <div className="group-call-screen">
      <div className="group-call-grid" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
        <div className="group-call-tile local-tile">
          <video ref={localVideoRef} autoPlay playsInline muted className="call-video" />
          <div className="tile-label">Вы {isMuted ? '(🔇)' : ''}</div>
        </div>
        {participants.filter(p => p.stream).map(p => (
          <div key={p.id} className="group-call-tile">
            <video autoPlay playsInline ref={el => { if (el && p.stream) el.srcObject = p.stream; }} className="call-video" />
            <div className="tile-label">User {p.id}</div>
          </div>
        ))}
      </div>
      <div className="group-call-controls">
        <button className={`call-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute}>
          {isMuted ? '🔇' : '🎤'}
        </button>
        <button className={`call-btn ${isVideoOff ? 'active' : ''}`} onClick={toggleVideo}>
          {isVideoOff ? '📷❌' : '📷'}
        </button>
        <button className={`call-btn ${isScreenSharing ? 'active' : ''}`} onClick={() => { shareScreen(); setIsScreenSharing(!isScreenSharing); }}>
          🖥️
        </button>
        <button className="call-btn end-call" onClick={handleEnd}>
          📞
        </button>
      </div>
    </div>
  );
};

export default GroupCallScreen;
