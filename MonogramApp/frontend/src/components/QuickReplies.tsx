import React, { useState, useEffect } from 'react';

interface Template {
  label: string;
  text: string;
}

interface QuickRepliesProps {
  onSelect: (text: string) => void;
}

export function useQuickReplies() {
  const [templates, setTemplates] = useState<Template[]>(() => {
    return JSON.parse(localStorage.getItem('quick_replies') || '[]');
  });

  const save = (t: Template[]) => {
    setTemplates(t);
    localStorage.setItem('quick_replies', JSON.stringify(t));
  };

  const add = (label: string, text: string) => {
    if (templates.length >= 10) return;
    save([...templates, { label, text }]);
  };

  const remove = (index: number) => {
    save(templates.filter((_, i) => i !== index));
  };

  const findByPrefix = (prefix: string): Template[] => {
    if (!prefix.startsWith('/')) return [];
    const query = prefix.slice(1).toLowerCase();
    return templates.filter(t => t.label.toLowerCase().startsWith(query));
  };

  return { templates, add, remove, findByPrefix, save };
}

const QuickReplies: React.FC<QuickRepliesProps> = ({ onSelect }) => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<Template[]>([]);
  const { templates, remove } = useQuickReplies();

  useEffect(() => {
    if (input.startsWith('/')) {
      const q = input.slice(1).toLowerCase();
      setResults(templates.filter(t => t.label.toLowerCase().startsWith(q)));
    } else {
      setResults([]);
    }
  }, [input]);

  return (
    <div className="quick-replies-settings">
      <h4>Быстрые ответы</h4>
      <p>Начните ввод с / чтобы увидеть шаблоны</p>
      <input
        type="text"
        placeholder="Введите /название..."
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      {results.length > 0 && (
        <div className="quick-replies-results">
          {results.map((t, i) => (
            <div key={i} className="quick-reply-item" onClick={() => { onSelect(t.text); setInput(''); }}>
              <span className="qr-label">{t.label}</span>
              <span className="qr-text">{t.text.substring(0, 30)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="quick-replies-list">
        {templates.map((t, i) => (
          <div key={i} className="quick-reply-row">
            <span className="qr-label">{t.label}</span>
            <span className="qr-text">{t.text.substring(0, 20)}</span>
            <button onClick={() => remove(i)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickReplies;
