export interface AIResponse {
  suggestions: string[];
  confidence: number;
}

class AISuggestionsService {
  private static instance: AISuggestionsService;
  private cache: Map<string, AIResponse> = new Map();
  private isEnabled = true;

  private constructor() {}

  static getInstance(): AISuggestionsService {
    if (!AISuggestionsService.instance) {
      AISuggestionsService.instance = new AISuggestionsService();
    }
    return AISuggestionsService.instance;
  }

  async getSuggestions(message: string, context: string[] = []): Promise<string[]> {
    if (!this.isEnabled || !message.trim() || message.length < 3) {
      return [];
    }

    const cacheKey = `${message}_${context.join('_')}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!.suggestions;
    }

    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context, limit: 3 })
      });
      
      const data = await response.json();
      const suggestions = data.suggestions || [];
      
      this.cache.set(cacheKey, { suggestions, confidence: data.confidence || 0 });
      
      setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);
      
      return suggestions;
    } catch (error) {
      console.error('AI suggestions error:', error);
      return this.getLocalSuggestions(message);
    }
  }

  private getLocalSuggestions(message: string): string[] {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('привет') || lowerMsg.includes('здравствуй')) {
      return ['Привет! Как дела?', 'Здравствуйте!', 'Приветствую!'];
    }
    if (lowerMsg.includes('как дела')) {
      return ['Хорошо, спасибо! А у тебя?', 'Отлично!', 'Нормально.'];
    }
    if (lowerMsg.includes('спасибо')) {
      return ['Пожалуйста!', 'Всегда пожалуйста!', 'Обращайся!'];
    }
    if (lowerMsg.includes('пока') || lowerMsg.includes('до свидания')) {
      return ['Пока!', 'До встречи!', 'Удачи!'];
    }
    if (lowerMsg.includes('?') && lowerMsg.length < 30) {
      return ['Да', 'Нет', 'Возможно'];
    }
    
    return [];
  }

  async translateText(text: string, targetLang: string): Promise<string> {
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target_lang: targetLang })
      });
      const data = await response.json();
      return data.translated_text || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  async summarizeChat(messages: { text: string; sender: string }[]): Promise<string> {
    if (messages.length < 5) return '';
    
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages.slice(-50) })
      });
      const data = await response.json();
      return data.summary || '';
    } catch (error) {
      console.error('Summarization error:', error);
      return '';
    }
  }

  enable(): void { this.isEnabled = true; }
  disable(): void { this.isEnabled = false; }
  isEnabledFlag(): boolean { return this.isEnabled; }
}

export default AISuggestionsService.getInstance();