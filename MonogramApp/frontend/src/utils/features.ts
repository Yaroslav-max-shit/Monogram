import apiClient from '../services/api';

export async function markRead(messageIds: number[]) {
  return apiClient.post('/messages/read', { message_ids: messageIds });
}

export async function deleteMessage(messageId: number) {
  return apiClient.delete(`/messages/${messageId}`);
}

export async function editMessage(messageId: number, content: string) {
  return apiClient.put(`/messages/${messageId}`, { content });
}

export async function forwardMessage(messageId: number, chatIds: number[]) {
  return apiClient.post('/messages/forward', { message_id: messageId, chat_ids: chatIds });
}

export async function addReaction(messageId: number, emoji: string) {
  return apiClient.post('/messages/react', { message_id: messageId, emoji });
}

export async function sendTyping(chatId: number) {
  return apiClient.post('/chats/typing', { chat_id: chatId });
}

export async function checkOnline(userId: number): Promise<{ is_online: boolean; last_seen: string | null }> {
  const res = await apiClient.get(`/chats/online/${userId}`);
  return res.data;
}

export async function saveDraft(chatId: number, content: string) {
  return apiClient.post('/drafts/save', { chat_id: chatId, content });
}

export async function getDraft(chatId: number): Promise<string> {
  const res = await apiClient.get(`/drafts/${chatId}`);
  return res.data.content || '';
}

export async function deleteDraft(chatId: number) {
  return apiClient.delete(`/drafts/${chatId}`);
}

export async function archiveChat(chatId: number) {
  return apiClient.post('/archive/add', { chat_id: chatId });
}

export async function unarchiveChat(chatId: number) {
  return apiClient.post('/archive/remove', { chat_id: chatId });
}

export async function getArchiveChats(): Promise<any[]> {
  const res = await apiClient.get('/archive/list');
  return res.data.chats || [];
}

export async function createFolder(name: string, chatIds: number[], icon?: string) {
  return apiClient.post('/folders/create', { name, chat_ids: chatIds, icon });
}

export async function getFolders(): Promise<any[]> {
  const res = await apiClient.get('/folders/list');
  return res.data.folders || [];
}

export async function updateFolder(folderId: number, data: any) {
  return apiClient.put(`/folders/${folderId}`, data);
}

export async function deleteFolder(folderId: number) {
  return apiClient.delete(`/folders/${folderId}`);
}

export async function createPoll(chatId: number, question: string, options: string[], isAnonymous = true) {
  return apiClient.post('/polls/create', { chat_id: chatId, question, options, is_anonymous: isAnonymous });
}

export async function votePoll(pollId: number, optionIndex: number) {
  return apiClient.post('/polls/vote', { poll_id: pollId, option_index: optionIndex });
}

export async function getPollResults(pollId: number): Promise<any> {
  const res = await apiClient.get(`/polls/results/${pollId}`);
  return res.data;
}

export async function saveMessage(messageId: number) {
  return apiClient.post('/saved/add', { message_id: messageId });
}

export async function unsaveMessage(messageId: number) {
  return apiClient.delete(`/saved/remove/${messageId}`);
}

export async function getSavedMessages(): Promise<any[]> {
  const res = await apiClient.get('/saved/list');
  return res.data.saved || [];
}

export async function updateBusinessProfile(data: any) {
  return apiClient.post('/users/business/update', data);
}

export async function setEmojiStatus(emoji: string, expiresIn = 3600) {
  return apiClient.post('/users/status', { emoji, expires_in: expiresIn });
}

export async function clearEmojiStatus() {
  return apiClient.delete('/users/status');
}

export async function enable2FA() {
  const res = await apiClient.post('/auth/2fa/enable');
  return res.data;
}

export async function verify2FA(code: string) {
  return apiClient.post('/auth/2fa/verify', { code });
}

export async function disable2FA() {
  return apiClient.post('/auth/2fa/disable');
}

export async function changePassword(oldPassword: string, newPassword: string) {
  return apiClient.post('/auth/change-password', { old_password: oldPassword, new_password: newPassword });
}

export async function changeEmail(email: string) {
  return apiClient.post('/auth/change-email', { email });
}
