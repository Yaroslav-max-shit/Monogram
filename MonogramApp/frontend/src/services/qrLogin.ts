import apiClient from './api';

export interface QRSession {
  sessionId: string;
  qrCode: string;
  status: 'waiting' | 'scanning' | 'confirmed' | 'expired';
  expiresAt: Date;
}

class QRLoginService {
  private static instance: QRLoginService;
  private currentSession: QRSession | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {}

  static getInstance(): QRLoginService {
    if (!QRLoginService.instance) {
      QRLoginService.instance = new QRLoginService();
    }
    return QRLoginService.instance;
  }

  async createSession(): Promise<QRSession> {
    try {
      const res = await apiClient.post('/auth/qr/create');
      this.currentSession = {
        sessionId: res.data.session_id,
        qrCode: JSON.stringify({ session_id: res.data.session_id, action: 'qr_login' }),
        status: 'waiting',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      };
      this.startPolling();
      return this.currentSession;
    } catch (error) {
      console.error('Failed to create QR session:', error);
      throw error;
    }
  }

  private startPolling(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    
    this.pollInterval = setInterval(async () => {
      if (!this.currentSession) return;
      
      if (new Date() > this.currentSession.expiresAt) {
        this.currentSession.status = 'expired';
        this.stopPolling();
        return;
      }
      
      try {
        const res = await apiClient.get(`/auth/qr/status/${this.currentSession.sessionId}`);
        this.currentSession.status = res.data.status;
        
        if (this.currentSession.status === 'confirmed') {
          this.stopPolling();
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 1500);
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  async confirmLogin(sessionId: string, deviceName: string): Promise<void> {
    try {
      await apiClient.post('/auth/qr/confirm', { session_id: sessionId, device_name: deviceName });
    } catch (error) {
      console.error('Confirmation error:', error);
      throw error;
    }
  }

  async cancelSession(sessionId: string): Promise<void> {
    try {
      await apiClient.delete(`/auth/qr/${sessionId}`);
      this.stopPolling();
      this.currentSession = null;
    } catch (error) {
      console.error('Cancel error:', error);
    }
  }

  getCurrentSession(): QRSession | null {
    return this.currentSession;
  }

  generateQRForLogin(chatId?: number): string {
    const data = {
      action: 'qr_login',
      version: '2.0',
      timestamp: Date.now(),
      chat_id: chatId
    };
    return JSON.stringify(data);
  }
}

export default QRLoginService.getInstance();