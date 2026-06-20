let eventSource: EventSource | null = null;

export const connectSSE = (userId: number, onEvent: (data: any) => void) => {
    if (eventSource) eventSource.close();
    
    const url = `/api/sse/${userId}`;  // ← относительный URL
    eventSource = new EventSource(url);
    
    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            onEvent(data);
        } catch (e) {
            console.error('Ошибка парсинга SSE:', e);
        }
    };
    
    eventSource.onerror = () => {
        setTimeout(() => connectSSE(userId, onEvent), 3000);
    };
};

export const disconnectSSE = () => {
    eventSource?.close();
    eventSource = null;
};