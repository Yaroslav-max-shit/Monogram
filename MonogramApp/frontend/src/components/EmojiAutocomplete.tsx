import React, { useState, useEffect, useRef, useCallback } from 'react';

const EMOJI_LIST: { emoji: string; name: string; keywords: string[] }[] = [
  { emoji: '😀', name: 'grinning', keywords: ['smile', 'happy', 'face'] },
  { emoji: '😁', name: 'grin', keywords: ['smile', 'happy', 'teeth'] },
  { emoji: '😂', name: 'joy', keywords: ['laugh', 'tears', 'cry'] },
  { emoji: '🤣', name: 'rofl', keywords: ['laugh', 'rolling', 'floor'] },
  { emoji: '😃', name: 'smiley', keywords: ['smile', 'happy', 'mouth'] },
  { emoji: '😄', name: 'smile', keywords: ['smile', 'happy', 'eyes'] },
  { emoji: '😅', name: 'sweat_smile', keywords: ['smile', 'sweat', 'nervous'] },
  { emoji: '😆', name: 'laughing', keywords: ['laugh', 'squint', 'happy'] },
  { emoji: '😉', name: 'wink', keywords: ['wink', 'flirt', 'eye'] },
  { emoji: '😊', name: 'blush', keywords: ['smile', 'blush', 'eyes'] },
  { emoji: '😋', name: 'yum', keywords: ['yum', 'tongue', 'delicious'] },
  { emoji: '😎', name: 'sunglasses', keywords: ['cool', 'sunglasses', 'face'] },
  { emoji: '😍', name: 'heart_eyes', keywords: ['love', 'heart', 'eyes'] },
  { emoji: '🤩', name: 'star_struck', keywords: ['star', 'excited', 'shiny'] },
  { emoji: '😘', name: 'kiss', keywords: ['kiss', 'heart', 'love'] },
  { emoji: '😗', name: 'kissing', keywords: ['kiss', 'face'] },
  { emoji: '😚', name: 'kissing_closed', keywords: ['kiss', 'closed', 'eyes'] },
  { emoji: '😙', name: 'kissing_smiling', keywords: ['kiss', 'smile', 'eyes'] },
  { emoji: '🥰', name: 'smiling_hearts', keywords: ['love', 'hearts', 'smile'] },
  { emoji: '😜', name: 'stuck_out_tongue', keywords: ['tongue', 'wink', 'silly'] },
  { emoji: '🤪', name: 'zany', keywords: ['crazy', 'zany', 'face'] },
  { emoji: '😝', name: 'stuck_out_tongue_closed', keywords: ['tongue', 'squint', 'silly'] },
  { emoji: '🤑', name: 'money_mouth', keywords: ['money', 'mouth', 'rich'] },
  { emoji: '🤗', name: 'hugs', keywords: ['hug', 'hands', 'face'] },
  { emoji: '🤭', name: 'hand_over_mouth', keywords: ['quiet', 'secret', 'mouth'] },
  { emoji: '🤫', name: 'shushing', keywords: ['shush', 'quiet', 'finger'] },
  { emoji: '🤔', name: 'thinking', keywords: ['think', 'thinking', 'face'] },
  { emoji: '🤐', name: 'zipper_mouth', keywords: ['zip', 'mouth', 'quiet'] },
  { emoji: '🤨', name: 'raised_eyebrow', keywords: ['skeptical', 'eyebrow', 'face'] },
  { emoji: '😐', name: 'neutral', keywords: ['neutral', 'face', 'meh'] },
  { emoji: '😑', name: 'expressionless', keywords: ['expressionless', 'face'] },
  { emoji: '😶', name: 'no_mouth', keywords: ['silent', 'mouth', 'face'] },
  { emoji: '😏', name: 'smirk', keywords: ['smirk', 'smug', 'face'] },
  { emoji: '😒', name: 'unamused', keywords: ['unamused', 'face', 'meh'] },
  { emoji: '🙄', name: 'rolling_eyes', keywords: ['roll', 'eyes', 'sarcastic'] },
  { emoji: '😬', name: 'grimacing', keywords: ['grimace', 'teeth', 'face'] },
  { emoji: '🤥', name: 'lying', keywords: ['lie', 'pinocchio', 'nose'] },
  { emoji: '😌', name: 'relieved', keywords: ['relieved', 'face', 'sigh'] },
  { emoji: '😔', name: 'pensive', keywords: ['pensive', 'sad', 'face'] },
  { emoji: '😪', name: 'sleepy', keywords: ['sleepy', 'face', 'tired'] },
  { emoji: '🤤', name: 'drooling', keywords: ['drool', 'sleep', 'face'] },
  { emoji: '😴', name: 'sleeping', keywords: ['sleep', 'zzz', 'face'] },
  { emoji: '😷', name: 'mask', keywords: ['mask', 'sick', 'face'] },
  { emoji: '🤒', name: 'thermometer', keywords: ['sick', 'thermometer', 'face'] },
  { emoji: '🤕', name: 'head_bandage', keywords: ['hurt', 'bandage', 'face'] },
  { emoji: '🤢', name: 'nauseated', keywords: ['sick', 'nausea', 'face'] },
  { emoji: '🤮', name: 'vomiting', keywords: ['vomit', 'sick', 'face'] },
  { emoji: '🤧', name: 'sneezing', keywords: ['sneeze', 'face', 'sick'] },
  { emoji: '🥵', name: 'hot', keywords: ['hot', 'face', 'sweat'] },
  { emoji: '🥶', name: 'cold', keywords: ['cold', 'freeze', 'face'] },
  { emoji: '🥴', name: 'woozy', keywords: ['woozy', 'dizzy', 'face'] },
  { emoji: '😵', name: 'dizzy', keywords: ['dizzy', 'face', 'spiral'] },
  { emoji: '🤯', name: 'exploding_head', keywords: ['explode', 'mind', 'blown'] },
  { emoji: '🤠', name: 'cowboy', keywords: ['cowboy', 'hat', 'face'] },
  { emoji: '🥳', name: 'partying', keywords: ['party', 'celebration', 'face'] },
  { emoji: '🥸', name: 'disguised', keywords: ['disguise', 'fake', 'face'] },
  { emoji: '😎', name: 'cool', keywords: ['cool', 'glasses', 'face'] },
  { emoji: '🤓', name: 'nerd', keywords: ['nerd', 'glasses', 'face'] },
  { emoji: '🧐', name: 'monocle', keywords: ['monocle', 'face', 'fancy'] },
  { emoji: '😕', name: 'confused', keywords: ['confused', 'face', 'meh'] },
  { emoji: '😟', name: 'worried', keywords: ['worried', 'sad', 'face'] },
  { emoji: '🙁', name: 'slightly_frowning', keywords: ['frown', 'sad', 'face'] },
  { emoji: '😮', name: 'open_mouth', keywords: ['surprise', 'shock', 'mouth'] },
  { emoji: '😯', name: 'hushed', keywords: ['hush', 'surprise', 'face'] },
  { emoji: '😲', name: 'astonished', keywords: ['astonished', 'shock', 'face'] },
  { emoji: '😳', name: 'flushed', keywords: ['flushed', 'embarrassed', 'face'] },
  { emoji: '🥺', name: 'pleading', keywords: ['plead', 'eyes', 'beg'] },
  { emoji: '😢', name: 'cry', keywords: ['cry', 'tear', 'sad'] },
  { emoji: '😭', name: 'sob', keywords: ['cry', 'tears', 'sob'] },
  { emoji: '😤', name: 'triumph', keywords: ['angry', 'steam', 'nose'] },
  { emoji: '😠', name: 'angry', keywords: ['angry', 'mad', 'face'] },
  { emoji: '😡', name: 'rage', keywords: ['rage', 'angry', 'red'] },
  { emoji: '🤬', name: 'cursing', keywords: ['curse', 'swear', 'face'] },
  { emoji: '💀', name: 'skull', keywords: ['skull', 'death', 'danger'] },
  { emoji: '☠️', name: 'skull_crossbones', keywords: ['skull', 'danger', 'death'] },
  { emoji: '💩', name: 'poop', keywords: ['poop', 'crap', 'shit'] },
  { emoji: '🤡', name: 'clown', keywords: ['clown', 'circus', 'face'] },
  { emoji: '👹', name: 'ogre', keywords: ['monster', 'ogre', 'face'] },
  { emoji: '👺', name: 'goblin', keywords: ['goblin', 'monster', 'face'] },
  { emoji: '👻', name: 'ghost', keywords: ['ghost', 'spooky', 'halloween'] },
  { emoji: '👽', name: 'alien', keywords: ['alien', 'ufo', 'space'] },
  { emoji: '👾', name: 'space_invader', keywords: ['alien', 'game', 'space'] },
  { emoji: '🤖', name: 'robot', keywords: ['robot', 'face', 'machine'] },
  { emoji: '😺', name: 'smiley_cat', keywords: ['cat', 'smile', 'happy'] },
  { emoji: '😸', name: 'smile_cat', keywords: ['cat', 'smile', 'happy'] },
  { emoji: '😹', name: 'joy_cat', keywords: ['cat', 'laugh', 'tears'] },
  { emoji: '😻', name: 'heart_eyes_cat', keywords: ['cat', 'love', 'heart'] },
  { emoji: '😼', name: 'smirk_cat', keywords: ['cat', 'smirk', 'face'] },
  { emoji: '😽', name: 'kissing_cat', keywords: ['cat', 'kiss', 'face'] },
  { emoji: '🙀', name: 'scream_cat', keywords: ['cat', 'surprise', 'shock'] },
  { emoji: '😿', name: 'crying_cat', keywords: ['cat', 'cry', 'tear'] },
  { emoji: '😾', name: 'pouting_cat', keywords: ['cat', 'pout', 'angry'] },
  { emoji: '🙈', name: 'see_no_evil', keywords: ['monkey', 'blind', 'shame'] },
  { emoji: '🙉', name: 'hear_no_evil', keywords: ['monkey', 'deaf', 'shame'] },
  { emoji: '🙊', name: 'speak_no_evil', keywords: ['monkey', 'mute', 'shame'] },
  { emoji: '💪', name: 'muscle', keywords: ['arm', 'strong', 'flex'] },
  { emoji: '👍', name: 'thumbsup', keywords: ['thumb', 'up', 'like'] },
  { emoji: '👎', name: 'thumbsdown', keywords: ['thumb', 'down', 'dislike'] },
  { emoji: '👏', name: 'clap', keywords: ['clap', 'hands', 'applause'] },
  { emoji: '🙌', name: 'raised_hands', keywords: ['hands', 'raise', 'celebration'] },
  { emoji: '🤝', name: 'handshake', keywords: ['handshake', 'deal', 'agree'] },
  { emoji: '❤️', name: 'heart', keywords: ['heart', 'love', 'red'] },
  { emoji: '🧡', name: 'orange_heart', keywords: ['heart', 'orange', 'love'] },
  { emoji: '💛', name: 'yellow_heart', keywords: ['heart', 'yellow', 'love'] },
  { emoji: '💚', name: 'green_heart', keywords: ['heart', 'green', 'love'] },
  { emoji: '💙', name: 'blue_heart', keywords: ['heart', 'blue', 'love'] },
  { emoji: '💜', name: 'purple_heart', keywords: ['heart', 'purple', 'love'] },
  { emoji: '🖤', name: 'black_heart', keywords: ['heart', 'black', 'love'] },
  { emoji: '🤍', name: 'white_heart', keywords: ['heart', 'white', 'love'] },
  { emoji: '🤎', name: 'brown_heart', keywords: ['heart', 'brown', 'love'] },
  { emoji: '💔', name: 'broken_heart', keywords: ['heart', 'broken', 'sad'] },
  { emoji: '❣️', name: 'heart_exclamation', keywords: ['heart', 'exclamation'] },
  { emoji: '💕', name: 'two_hearts', keywords: ['hearts', 'love', 'two'] },
  { emoji: '💞', name: 'revolving_hearts', keywords: ['hearts', 'revolving', 'love'] },
  { emoji: '💓', name: 'heartbeat', keywords: ['heart', 'beat', 'pulse'] },
  { emoji: '💗', name: 'heartpulse', keywords: ['heart', 'growing', 'love'] },
  { emoji: '💖', name: 'sparkling_heart', keywords: ['heart', 'sparkle', 'love'] },
  { emoji: '💘', name: 'cupid', keywords: ['heart', 'arrow', 'love'] },
  { emoji: '💝', name: 'gift_heart', keywords: ['heart', 'gift', 'ribbon'] },
  { emoji: '💟', name: 'heart_decoration', keywords: ['heart', 'decoration'] },
  { emoji: '✨', name: 'sparkles', keywords: ['sparkle', 'star', 'shiny'] },
  { emoji: '🔥', name: 'fire', keywords: ['fire', 'burn', 'hot'] },
  { emoji: '⭐', name: 'star', keywords: ['star', 'gold', 'rating'] },
];

interface EmojiAutocompleteProps {
  query: string;
  onSelect: (emoji: string) => void;
  position?: { x: number; y: number };
}

const EmojiAutocomplete: React.FC<EmojiAutocompleteProps> = ({ query, onSelect, position }) => {
  const [filtered, setFiltered] = useState<typeof EMOJI_LIST>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query) {
      setFiltered([]);
      return;
    }
    const lower = query.toLowerCase();
    const results = EMOJI_LIST.filter(
      e => e.name.includes(lower) || e.keywords.some(k => k.includes(lower))
    ).slice(0, 10);
    setFiltered(results);
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        onSelect(filtered[selectedIndex].emoji);
      }
    }
  }, [filtered, selectedIndex, onSelect]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={ref}
      className="emoji-autocomplete"
      style={
        position
          ? { position: 'fixed', left: position.x, top: position.y }
          : undefined
      }
    >
      {filtered.map((item, idx) => (
        <div
          key={item.name}
          className={`emoji-autocomplete-item ${idx === selectedIndex ? 'selected' : ''}`}
          onClick={() => onSelect(item.emoji)}
          onMouseEnter={() => setSelectedIndex(idx)}
        >
          <span className="emoji-autocomplete-emoji">{item.emoji}</span>
          <span className="emoji-autocomplete-name">:{item.name}:</span>
        </div>
      ))}
    </div>
  );
};

export { EMOJI_LIST };
export default EmojiAutocomplete;
