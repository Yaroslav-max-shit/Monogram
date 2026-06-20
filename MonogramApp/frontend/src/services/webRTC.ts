export interface WebRTCConfig {
  iceServers?: RTCIceServer[];
  iceTransportPolicy?: RTCIceTransportPolicy;
  bundlePolicy?: RTCBundlePolicy;
  rtcpMuxPolicy?: RTCRtcpMuxPolicy;
}

export interface CallSession {
  callId: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  status: 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'rejected';
  isVideo: boolean;
  startTime: Date | null;
  duration: number;
}

class WebRTCService {
  private static instance: WebRTCService;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callbacks: Map<string, Function[]> = new Map();
  private currentCallId: string | null = null;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private defaultConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ],
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  };

  private constructor() {}

  static getInstance(): WebRTCService {
    if (!WebRTCService.instance) {
      WebRTCService.instance = new WebRTCService();
    }
    return WebRTCService.instance;
  }

  on(event: string, callback: Function): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  off(event: string, callback?: Function): void {
    if (!callback) {
      this.callbacks.delete(event);
    } else {
      const handlers = this.callbacks.get(event);
      if (handlers) {
        const index = handlers.indexOf(callback);
        if (index !== -1) handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.callbacks.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }
  }

  async initLocalStream(audio: boolean, video: boolean): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      });
      this.emit('localStreamReady', this.localStream);
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  async createOffer(ws: WebSocket, callId: string, isVideo: boolean): Promise<void> {
    this.ws = ws;
    this.currentCallId = callId;

    if (!this.localStream) {
      await this.initLocalStream(true, isVideo);
    }

    this.peerConnection = new RTCPeerConnection(this.defaultConfig);

    this.localStream?.getTracks().forEach(track => {
      this.peerConnection!.addTrack(track, this.localStream!);
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.ws) {
        this.ws.send(JSON.stringify({
          type: 'ice-candidate',
          callId: this.currentCallId,
          candidate: event.candidate
        }));
      }
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.emit('remoteStreamReady', this.remoteStream);
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      this.emit('iceStateChange', state);
      
      if (state === 'connected') {
        this.emit('callConnected');
      } else if (state === 'failed' || state === 'disconnected') {
        this.endCall();
      }
    };

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    this.ws.send(JSON.stringify({
      type: 'offer',
      callId: this.currentCallId,
      offer: offer,
      isVideo
    }));
  }

  async handleOffer(offer: RTCSessionDescriptionInit, ws: WebSocket, callId: string): Promise<void> {
    this.ws = ws;
    this.currentCallId = callId;

    if (!this.localStream) {
      const isVideo = (offer as any).isVideo === true;
      await this.initLocalStream(true, isVideo);
    }

    this.peerConnection = new RTCPeerConnection(this.defaultConfig);

    this.localStream?.getTracks().forEach(track => {
      this.peerConnection!.addTrack(track, this.localStream!);
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.ws) {
        this.ws.send(JSON.stringify({
          type: 'ice-candidate',
          callId: this.currentCallId,
          candidate: event.candidate
        }));
      }
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.emit('remoteStreamReady', this.remoteStream);
    };

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    this.ws.send(JSON.stringify({
      type: 'answer',
      callId: this.currentCallId,
      answer: answer
    }));
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.peerConnection) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.emit('muteChanged', !audioTrack.enabled);
        return audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.emit('videoChanged', !videoTrack.enabled);
        return videoTrack.enabled;
      }
    }
    return false;
  }

  switchCamera(): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack && 'getCapabilities' in videoTrack) {
        // Для смены камеры нужно пересоздать поток
        this.initLocalStream(true, true).then(() => {
          if (this.peerConnection && this.localStream) {
            const senders = this.peerConnection.getSenders();
            senders.forEach(sender => {
              if (sender.track?.kind === 'video') {
                sender.replaceTrack(this.localStream!.getVideoTracks()[0]);
              }
            });
          }
        });
      }
    }
  }

  endCall(): void {
    this.localStream?.getTracks().forEach(track => track.stop());
    this.peerConnection?.close();
    
    if (this.ws && this.currentCallId) {
      this.ws.send(JSON.stringify({
        type: 'end',
        callId: this.currentCallId
      }));
    }

    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.currentCallId = null;
    
    this.emit('callEnded');
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  isMicrophoneMuted(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      return audioTrack ? !audioTrack.enabled : false;
    }
    return false;
  }

  isVideoOff(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      return videoTrack ? !videoTrack.enabled : false;
    }
    return true;
  }
}

export default WebRTCService.getInstance();