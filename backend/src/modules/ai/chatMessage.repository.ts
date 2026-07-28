import { prisma } from "../../config/prisma.js";
import type { ChatMessage, ChatMessageRole } from "../../generated/prisma/client.js";

// Only user/assistant turns are stored (see ChatMessageRole comment in
// schema.prisma) — intra-turn tool-call plumbing is never persisted.

const CHAT_HISTORY_LIMIT = 20;

/**
 * Returns the most recent turns in chronological order (oldest first) so
 * they can be spread directly into the messages array sent to the model.
 */
export const findRecentChatMessages = async (userId: string, limit = CHAT_HISTORY_LIMIT): Promise<ChatMessage[]> => {
  const recent = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return recent.reverse();
};

export const createChatMessage = (userId: string, role: ChatMessageRole, content: string): Promise<ChatMessage> =>
  prisma.chatMessage.create({ data: { userId, role, content } });

export const deleteAllChatMessages = (userId: string): Promise<{ count: number }> =>
  prisma.chatMessage.deleteMany({ where: { userId } });
