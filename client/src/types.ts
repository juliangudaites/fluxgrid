export interface Message {
  id: string;
  threadId: string;
  content: string;
  timestamp: string;
  senderEmoji?: string;
  burnAt?: string;
  boosted?: boolean;
  tier?: string;
  pinned?: boolean;
  priorityStyle?: boolean;
  attachmentType?: 'image' | 'video';
  attachmentUrl?: string;
  preview?: boolean;
  deleteToken?: string;
}

export interface ThreadMeta {
  threadId: string;
  locked: boolean;
  participants: string[];
  lockedAt: string | null;
  pinnedMessageId?: string | null;
  priorityChannel?: boolean;
}

export interface ThreadResponse {
  threadId: string;
  messages: Message[];
  count: number;
  pinnedMessageId?: string | null;
  priorityChannel?: boolean;
}

export interface FeedResponse {
  feed: Message[];
  mode: string;
  limit: number;
}

export interface TransmitOptions {
  burnAfterSeconds?: number;
  pinMessage?: boolean;
  priorityStyle?: boolean;
  attachmentData?: string;
  attachmentType?: 'image' | 'video';
}