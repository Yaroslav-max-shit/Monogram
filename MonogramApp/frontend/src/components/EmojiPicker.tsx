import React, { useState } from 'react';

const EMOJI_GROUPS: Record<string, string[]> = {
  '😀 Смайлы': ['😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','😣','😖','😫','😩','🥺','😢','😭','😤','😡','🤬','🤯','😳','🥵','🥶'],
  '👋 Жесты': ['👋','🤚','🖐','✋','🖖','👌','🤏','✌','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝','👍','👎','✊','👊','🤛','🤜','👏','🙌','🤝','💪'],
  '❤️ Сердца': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟'],
  '🔥 Символы': ['🔥','⭐','🌟','✨','💫','🎉','🎊','💯','✅','❌','❓','💬','📌','📎','🕐','🕑','🕒','🔒','🔑','💡','🏠','🚀','🌈','🍕','🎵','🎮'],
  '🐱 Животные': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄'],
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect }) => {
  const [activeGroup, setActiveGroup] = useState('😀 Смайлы');
  const groups = Object.keys(EMOJI_GROUPS);

  return (
    <div className="emoji-picker" style={{ width: '100%', maxWidth: '100%' }}>
      <div className="emoji-tabs">
        {groups.map(group => (
          <button
            key={group}
            className={`emoji-tab ${activeGroup === group ? 'active' : ''}`}
            onClick={() => setActiveGroup(group)}
          >
            {group.split(' ')[0]}
          </button>
        ))}
      </div>
      <div className="emoji-grid">
        {EMOJI_GROUPS[activeGroup].map(emoji => (
          <span
            key={emoji}
            className="emoji-item"
            onClick={() => onSelect(emoji)}
          >
            {emoji}
          </span>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;