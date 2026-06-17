export type FeedbackType = 'bug' | 'suggestion' | 'feature' | 'general';
export type FeedbackStatus = 'new' | 'in_progress' | 'planned' | 'resolved' | 'rejected';

export interface Feedback {
  id: string;
  type: FeedbackType;
  message: string;
  rating?: number;
  sentiment?: 'happy' | 'neutral' | 'sad';
  status: FeedbackStatus;
  createdAt: any;
  page: string;
  version: string;
  browser: string;
  device: string;
  userEmail?: string;
  userId?: string;
}
