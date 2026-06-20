import { useState, useCallback } from 'react';

interface ChatMember {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role?: string;
}

const COMMANDS = ['/mute', '/kick', '/ban', '/unmute', '/pin', '/admin'];

export function useSlashCommands(chatType: string, members: ChatMember[]) {
  const [command, setCommand] = useState<string>('');
  const [args, setArgs] = useState<string>('');
  const [showMemberList, setShowMemberList] = useState(false);
  const [filteredMembers, setFilteredMembers] = useState<ChatMember[]>([]);

  const handleInput = useCallback((text: string) => {
    if (!text.startsWith('/') || chatType === 'private') {
      setCommand('');
      setArgs('');
      setShowMemberList(false);
      return { showCommands: false, filteredCommands: [] as string[] };
    }

    const parts = text.split(' ');
    const cmd = parts[0].toLowerCase();
    const argText = parts.slice(1).join(' ');

    setCommand(cmd);
    setArgs(argText);

    // After /command + space, show member autocomplete
    if (parts.length >= 2 && COMMANDS.includes(cmd)) {
      const searchText = argText.replace('@', '').toLowerCase();
      const filtered = members.filter(m =>
        m.username.toLowerCase().includes(searchText) ||
        (m.first_name || '').toLowerCase().includes(searchText) ||
        (m.last_name || '').toLowerCase().includes(searchText)
      );
      setFilteredMembers(filtered);
      setShowMemberList(true);
      return { showCommands: false, filteredCommands: [] as string[] };
    }

    setShowMemberList(false);

    // Show command list when typing /
    if (parts.length === 1 && COMMANDS.some(c => c.startsWith(cmd))) {
      const filtered = COMMANDS.filter(c => c.startsWith(cmd));
      return { showCommands: true, filteredCommands: filtered };
    }

    return { showCommands: false, filteredCommands: [] as string[] };
  }, [chatType, members]);

  const selectMember = useCallback((username: string) => {
    const newText = `${command} @${username} `;
    setArgs(`@${username}`);
    setShowMemberList(false);
    return newText;
  }, [command]);

  const reset = useCallback(() => {
    setCommand('');
    setArgs('');
    setShowMemberList(false);
    setFilteredMembers([]);
  }, []);

  return {
    command, args, showMemberList, filteredMembers,
    handleInput, selectMember, reset, commands: COMMANDS,
  };
}