import { useState, useEffect, useRef, useCallback } from 'react';

interface Participant {
  id: number;
  stream?: MediaStream;
  muted: boolean;
}

export function useGroupCall(roomId: string, userId: number) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnections = useRef<Map<number, RTCPeerConnection>>(new Map());

  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/calls/room/${roomId}/${userId}`;

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setLocalStream(stream);
      } catch {
        console.warn('Could not get media');
      }
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'peer_joined') {
        setParticipants(prev => [...prev, { id: data.user_id, muted: false }]);
      } else if (data.type === 'peer_left') {
        const pc = peerConnections.current.get(data.user_id);
        if (pc) { pc.close(); peerConnections.current.delete(data.user_id); }
        setParticipants(prev => prev.filter(p => p.id !== data.user_id));
      } else if (data.type === 'offer') {
        handleOffer(data);
      } else if (data.type === 'answer') {
        handleAnswer(data);
      } else if (data.type === 'ice-candidate') {
        handleIceCandidate(data);
      }
    };

    ws.onclose = () => endCall();

    return () => {
      ws.close();
      localStream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const sendSignal = (data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  const createPeerConnection = async (peerId: number) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    peerConnections.current.set(peerId, pc);
    if (localStream) localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal({ type: 'ice-candidate', candidate: e.candidate, target: peerId });
    };
    pc.ontrack = (e) => {
      setParticipants(prev => prev.map(p => p.id === peerId ? { ...p, stream: e.streams[0] } : p));
    };
    return pc;
  };

  const handleOffer = async (data: any) => {
    const pc = await createPeerConnection(data.sender_id);
    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    sendSignal({ type: 'answer', answer, target: data.sender_id });
  };

  const handleAnswer = async (data: any) => {
    const pc = peerConnections.current.get(data.sender_id);
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
  };

  const handleIceCandidate = async (data: any) => {
    const pc = peerConnections.current.get(data.sender_id);
    if (pc && data.candidate) await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
  };

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => { t.enabled = isMuted; });
      setIsMuted(!isMuted);
    }
  }, [localStream, isMuted]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => { t.enabled = isVideoOff; });
      setIsVideoOff(!isVideoOff);
    }
  }, [localStream, isVideoOff]);

  const shareScreen = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStream.getTracks().forEach(t => {
        if (localStream) {
          localStream.addTrack(t);
          peerConnections.current.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(t);
          });
        }
      });
    } catch {}
  }, [localStream]);

  const endCall = useCallback(() => {
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    localStream?.getTracks().forEach(t => t.stop());
    wsRef.current?.close();
  }, [localStream]);

  return { participants, localStream, isMuted, isVideoOff, toggleMute, toggleVideo, shareScreen, endCall };
}
