import React, { useState } from 'react';
import Icon from '../Icon';
import apiClient from '../../services/api';

interface PollCreatorProps {
  chatId: number;
  onClose: () => void;
  onCreate?: (poll: any) => void;
}

const PollCreator: React.FC<PollCreatorProps> = ({ chatId, onClose, onCreate }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [duration, setDuration] = useState(24);
  const [loading, setLoading] = useState(false);

  const addOption = () => { if (options.length < 10) setOptions([...options, '']); };
  const removeOption = (index: number) => { if (options.length > 2) setOptions(options.filter((_, i) => i !== index)); };
  const updateOption = (index: number, value: string) => { const newOptions = [...options]; newOptions[index] = value; setOptions(newOptions); };

  const handleCreate = async () => {
    if (!question.trim() || options.some(opt => !opt.trim())) {

      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/chats/poll', {
        chat_id: chatId,
        question,
        options: options.filter(opt => opt.trim()),
        is_anonymous: isAnonymous,
        multiple_choice: multipleChoice,
        duration_hours: duration
      });
      onCreate?.(res.data);
      onClose();
    } catch (error) {
      alert('Не удалось создать опрос');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="poll-creator-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Создать опрос</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Вопрос" />
          <label>Варианты ответов</label>
          {options.map((opt, idx) => (
            <div key={idx}>
              <input value={opt} onChange={(e) => updateOption(idx, e.target.value)} placeholder={`Вариант ${idx + 1}`} />
              {options.length > 2 && <button onClick={() => removeOption(idx)}>✕</button>}
            </div>
          ))}
          {options.length < 10 && <button onClick={addOption}>+ Добавить вариант</button>}
          
          <label><input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} /> Анонимный опрос</label>
          <label><input type="checkbox" checked={multipleChoice} onChange={(e) => setMultipleChoice(e.target.checked)} /> Множественный выбор</label>
          
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            <option value={1}>1 час</option><option value={6}>6 часов</option><option value={12}>12 часов</option>
            <option value={24}>24 часа</option><option value={48}>2 дня</option><option value={168}>7 дней</option>
          </select>
        </div>
        <div className="modal-footer">
          <button onClick={onClose}>Отмена</button>
          <button onClick={handleCreate} disabled={loading}>{loading ? 'Создание...' : 'Создать'}</button>
        </div>
      </div>
    </div>
  );
};

export default PollCreator;