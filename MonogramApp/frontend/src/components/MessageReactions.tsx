import React, { useState } from 'react';
import Icon from './Icon';

interface MessageReactionsProps {
  messageId: number;
  reactions: { emoji: string; count: number; users: number[] }[];
  currentUserId: number;
  onReact: (messageId: number, emoji: string) => void;
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const MessageReactions: React.FC<MessageReactionsProps> = ({ 
  messageId, 
  reactions, 
  currentUserId, 
  onReact 
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const hasUserReacted = (emoji: string) => {
    const reaction = reactions.find(r => r.emoji === emoji);
    return reaction?.users.includes(currentUserId) || false;
  };

  return (
    <div className="message-reactions">
      <div className="reactions-list">
        {reactions.map(reaction => (
          <button
            key={reaction.emoji}
            className={`reaction-badge ${hasUserReacted(reaction.emoji) ? 'active' : ''}`}
            onClick={() => onReact(messageId, reaction.emoji)}
          >
            {reaction.emoji} {reaction.count}
          </button>
        ))}
        <button className="add-reaction-btn" onClick={() => setShowPicker(!showPicker)}>
          <Icon name="emoji" size={14} />
        </button>
      </div>
      
      {showPicker && (
        <div className="reaction-picker">
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              className="reaction-option"
              onClick={() => {
                onReact(messageId, emoji);
                setShowPicker(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageReactions;