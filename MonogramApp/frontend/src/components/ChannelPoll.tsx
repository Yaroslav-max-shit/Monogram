import React from 'react';

interface ChannelPollProps {
  messageId: number;
  options: string[];
  onVote: (option: number) => void;
}

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const ChannelPoll: React.FC<ChannelPollProps> = ({ messageId, options, onVote }) => {
  return (
    <div className="channel-poll">
      <div className="channel-poll-options">
        {options.map((opt, i) => (
          <div key={i} className="channel-poll-option" onClick={() => onVote(i)}>
            <span className="option-text">{opt}</span>
            <span className="option-reaction">{REACTIONS[i % REACTIONS.length]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChannelPoll;
