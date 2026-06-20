import { isEncrypted, decryptMessage } from './encryption';
import apiClient from './api';

let abortController: AbortController | null = null;
let globalHandler: ((msg: any) => void) | null = null;
let currentUserId: number | null = null;
let e2eeEnabled = true;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let authToken: string | null = null;
let readerActive = false;

export const connectToServer = async (userId: number) => {
    currentUserId = userId;
    
    const session = await import('./cookies').then(m => m.getSession());
    authToken = session?.token || null;
    if (!authToken) return;
    
    if (abortController) {
        abortController.abort();
        abortController = null;
    }
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    
    readerActive = true;
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/api/sse/${userId}?token=${encodeURIComponent(authToken)}`;
    
    abortController = new AbortController();
    
    try {
        const response = await fetch(url, {
            signal: abortController.signal,
            headers: { 'Accept': 'text/event-stream' },
        });
        
        if (response.status === 401) {
            console.warn('SSE: token expired, attempting refresh...');
            try {
                const { getSession, saveSession } = await import('./cookies');
                const session = await getSession();
                if (session?.token) {
                    const refreshRes = await apiClient.post('/auth/refresh');
                    if (refreshRes.data?.access_token) {
                        await saveSession(refreshRes.data.access_token, session.user);
                        authToken = refreshRes.data.access_token;
                        readerActive = false;
                        scheduleReconnect();
                        return;
                    }
                }
            } catch (e) {
                console.error('Token refresh failed:', e);
            }
            readerActive = false;
            const { clearSession } = await import('./cookies');
            clearSession();
            window.location.href = '/';
            return;
        }
        
        if (!response.ok) {
            console.error('SSE connection failed:', response.status);
            readerActive = false;
            scheduleReconnect();
            return;
        }
        
        const reader = response.body?.getReader();
        if (!reader) {
            readerActive = false;
            return;
        }
        
        const decoder = new TextDecoder();
        let buffer = '';
        
        const readLoop = async () => {
            while (readerActive) {
                try {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.slice(6);
                            if (dataStr === '' || dataStr === ': ping') continue;
                            try {
                                let data = JSON.parse(dataStr);
                                
                                if (e2eeEnabled && data.content && isEncrypted(data.content)) {
                                    try {
                                        const decrypted = await decryptMessage(data.content);
                                        data.content = decrypted;
                                    } catch (e) {
                                        console.error('Failed to decrypt message:', e);
                                    }
                                }
                                
                                if (globalHandler) {
                                    globalHandler(data);
                                }
                            } catch (e) {
                                console.error('SSE parse error:', e);
                            }
                        }
                    }
                } catch (e: any) {
                    if (e.name === 'AbortError') break;
                    console.error('SSE read error:', e);
                    break;
                }
            }
            
            if (readerActive) {
                scheduleReconnect();
            }
        };
        
        readLoop();
        
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
    } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.error('SSE fetch error:', e);
        readerActive = false;
        scheduleReconnect();
    }
};

const scheduleReconnect = () => {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => {
        if (currentUserId && readerActive) {
            connectToServer(currentUserId);
        }
    }, 3000);
};

export const onMessage = (handler: (msg: any) => void) => {
    globalHandler = handler;
};

export const sendMessage = async (content: string, chatId: number, targetUserId: number) => {
    if (!currentUserId) {
        console.error('Not connected');
        return;
    }
    
    let finalContent = content;
    let wasEncrypted = false;
    
    if (e2eeEnabled && targetUserId && targetUserId !== currentUserId && chatId < 999998) {
        const { encryptMessage } = await import('./encryption');
        finalContent = await encryptMessage(content);
        wasEncrypted = true;
    }

    try {
        const response = await apiClient.post('/messages/', {
            content: finalContent,
            chat_id: chatId,
            is_encrypted: wasEncrypted,
            target_user_id: targetUserId
        });
        
        if (response.data) {
            const message = {
                type: 'new_message',
                message: response.data,
                chat_id: chatId,
                sender_id: currentUserId,
                is_encrypted: wasEncrypted
            };
            
            await apiClient.post('/messages/broadcast', {
                chat_id: chatId,
                message: message,
                exclude_user_id: currentUserId
            });
        }
        
        return response.data;
    } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
    }
};

export const sendTyping = async (chatId: number) => {
    if (!currentUserId) return;
    
    try {
        await apiClient.post('/messages/typing', {
            chat_id: chatId,
            user_id: currentUserId
        });
    } catch (error) {
        console.error('Failed to send typing indicator:', error);
    }
};

export const disconnect = () => {
    readerActive = false;
    if (abortController) {
        abortController.abort();
        abortController = null;
    }
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    currentUserId = null;
};

export const setE2EEState = (enabled: boolean) => {
    e2eeEnabled = enabled;
};
