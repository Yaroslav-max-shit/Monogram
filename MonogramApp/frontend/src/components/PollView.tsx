import React, { useState } from 'react';
import { votePoll } from '../utils/features';

interface Props {
  poll: any;
  messageId: number;
}

const PollView: React.FC<Props> = ({ poll, messageId }) => {
  const [voted, setVoted] = useState(false);
  const [results, setResults] = useState<Record<number, number>>({});
  const [totalVotes, setTotalVotes] = useState(0);

  const handleVote = async (idx: number) => {
    if (voted || poll.is_closed) return;
    try {
      await votePoll(poll.poll_id, idx);
      setResults(prev => ({ ...prev, [idx]: (prev[idx] || 0) + 1 }));
      setTotalVotes(prev => prev + 1);
      setVoted(true);
    } catch {}
  };

  const options = poll.options || [];
  const maxVotes = Math.max(1, ...Object.values(results));

  return (
    <div className="poll-view">
      <div className="poll-question">{poll.question}</div>
      {options.map((opt: string, idx: number) => {
        const count = results[idx] || 0;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const width = totalVotes > 0 ? (count / maxVotes) * 100 : 0;
        return (
          <div
            key={idx}
            className={`poll-option ${voted || poll.is_closed ? 'poll-result' : ''}`}
            onClick={() => handleVote(idx)}
          >
            <div className="poll-option-bar" style={{ width: `${width}%` }} />
            <span className="poll-option-text">{opt}</span>
            {(voted || poll.is_closed) && (
              <span className="poll-option-pct">{pct}%</span>
            )}
          </div>
        );
      })}
      {poll.is_closed && <div className="poll-closed">Опрос завершён</div>}
    </div>
  );
};

export default PollView;
