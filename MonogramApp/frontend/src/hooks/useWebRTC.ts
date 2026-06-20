import { useState, useEffect, useRef, useCallback } from 'react';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

interface WebRTCOptions {
  userId: number;
  peerId: number;
  chatId: number;
  onStateChange?: (state: CallState) => void;
}

export function useWebRTC({ userId, peerId, chatId, onStateChange }: WebRTCOptions) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const setState = useCallback((state: CallState) => {
    setCallState(state);
    onStateChange?.(state);
  }, [onStateChange]);

  const connectWebSocket = useCallback(() => {
    const wsUrl = `ws://localhost:8000/ws/${userId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.debug('WebRTC WS connected');
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      handleSignalingData(data);
    };

    ws.onerror = (err) => console.error('WebRTC WS error:', err);
    ws.onclose = () => console.debug('WebRTC WS closed');
  }, [userId]);

  const handleSignalingData = useCallback(async (data: any) => {
    switch (data.type) {
      case 'offer':
        setState('ringing');
        break;
      case 'answer':
        setState('connected');
        break;
      case 'ice-candidate':
        break;
      case 'call-end':
        setState('ended');
        cleanup();
        break;
    }
  }, []);

  const startCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setState('calling');
      connectWebSocket();
    } catch (err) {
      console.error('Failed to get media:', err);
    }
  }, [connectWebSocket]);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setRemoteStream(null);
  }, []);

  const endCall = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'call-end', target_user_id: peerId }));
    }
    setState('ended');
    cleanup();
  }, [peerId, cleanup]);

  return {
    callState,
    remoteStream,
    localStream: localStreamRef.current,
    startCall,
    endCall,
    cleanup,
  };
}