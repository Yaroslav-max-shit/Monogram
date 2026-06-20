export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private ws: WebSocket | null = null;
  private callId: string | null = null;
  
  private config: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  async initLocalStream(audio: boolean, video: boolean): Promise<MediaStream> {
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio, video });
    return this.localStream;
  }

  async createOffer(ws: WebSocket, callId: string): Promise<void> {
    this.ws = ws;
    this.callId = callId;
    this.peerConnection = new RTCPeerConnection(this.config);
    
    this.localStream?.getTracks().forEach(track => {
      this.peerConnection!.addTrack(track, this.localStream!);
    });
    
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.ws) {
        this.ws.send(JSON.stringify({
          type: 'ice-candidate',
          callId: this.callId,
          candidate: event.candidate
        }));
      }
    };
    
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      if (this.onRemoteStream) this.onRemoteStream(this.remoteStream);
    };
    
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    
    this.ws.send(JSON.stringify({
      type: 'offer',
      callId: this.callId,
      offer: offer
    }));
  }

  async handleOffer(offer: RTCSessionDescriptionInit, ws: WebSocket, callId: string): Promise<void> {
    this.ws = ws;
    this.callId = callId;
    this.peerConnection = new RTCPeerConnection(this.config);
    
    this.localStream?.getTracks().forEach(track => {
      this.peerConnection!.addTrack(track, this.localStream!);
    });
    
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.ws) {
        this.ws.send(JSON.stringify({
          type: 'ice-candidate',
          callId: this.callId,
          candidate: event.candidate
        }));
      }
    };
    
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      if (this.onRemoteStream) this.onRemoteStream(this.remoteStream);
    };
    
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    
    this.ws.send(JSON.stringify({
      type: 'answer',
      callId: this.callId,
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

  stopCall(): void {
    this.localStream?.getTracks().forEach(track => track.stop());
    this.peerConnection?.close();
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
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
        return videoTrack.enabled;
      }
    }
    return false;
  }

  onRemoteStream: ((stream: MediaStream) => void) | null = null;
}

export default WebRTCManager;