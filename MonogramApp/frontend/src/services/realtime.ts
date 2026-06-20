type RealtimeHandler = (data: any) => void;

class RealtimeService {
  private ws: WebSocket | null = null;
  private handlers: Map<string, Set<RealtimeHandler>> = new Map();
  private userId: number | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private sseSource: EventSource | null = null;

  connect(userId: number, token: string) {
    this.userId = userId;
    this.disconnect();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;

    try {
      this.ws = new WebSocket(`${protocol}//${host}/ws/${userId}`);

      this.ws.onopen = () => {
        console.debug('[Realtime] WebSocket connected');
        this.ws?.send(JSON.stringify({ type: 'auth', token }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type, data);
        } catch {}
      };

      this.ws.onclose = () => {
        console.debug('[Realtime] WebSocket disconnected');
        this.scheduleReconnect();
        this.connectSSE(userId);
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.connectSSE(userId);
    }
  }

  private connectSSE(userId: number) {
    if (this.sseSource) return;

    this.sseSource = new EventSource(`/api/sse/${userId}`);
    this.sseSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(data.type, data);
      } catch {}
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.userId) {
        const token = localStorage.getItem('token') || document.cookie.replace(/(?:(?:^|.*;\s*)access_token\s*=\s*([^;]*).*$)|^.*$/, "$1");
        this.connect(this.userId, token);
      }
    }, 3000);
  }

  private emit(type: string, data: any) {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach(h => h(data));
    }
  }

  on(type: string, handler: RealtimeHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => this.handlers.get(type)?.delete(handler);
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
    this.sseSource?.close();
    this.sseSource = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

export const realtime = new RealtimeService();
