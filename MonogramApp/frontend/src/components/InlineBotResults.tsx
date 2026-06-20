import React from 'react';

interface InlineResult {
  id: string;
  title: string;
  description?: string;
  type: string;
  url?: string;
}

interface InlineBotResultsProps {
  results: InlineResult[];
  onSelect: (result: InlineResult) => void;
  onClose: () => void;
}

const InlineBotResults: React.FC<InlineBotResultsProps> = ({ results, onSelect, onClose }) => {
  if (results.length === 0) return null;
  return (
    <div className="inline-bot-results-overlay" onClick={onClose}>
      <div className="inline-bot-results" onClick={e => e.stopPropagation()}>
        <div className="inline-bot-results-header">
          <span>Результаты бота</span>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="inline-bot-results-list">
          {results.map(r => (
            <div key={r.id} className="inline-bot-result-item" onClick={() => onSelect(r)}>
              <div className="result-title">{r.title}</div>
              {r.description && <div className="result-desc">{r.description}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InlineBotResults;
