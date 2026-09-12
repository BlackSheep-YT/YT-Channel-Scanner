export type VideoCategory = 'Video' | 'Shorts' | 'Live';
export type VideoAccessType = 'Public' | 'Members-only';

export interface ScannedVideo {
  id: string;
  title: string;
  link: string;
  date: string; // Formatted date (YYYY-MM-DD or raw)
  rawDate: string; // e.g. "2 days ago", "Streamed 1 month ago"
  timestamp: number; // Unix epoch ms for exact date-wise sorting
  category: VideoCategory;
  accessType: VideoAccessType;
  membershipLevel: string; // e.g. "Public", "Members-only", "Channel Member (Level 1)", etc.
  thumbnailUrl: string;
  duration?: string;
  viewCountText?: string;
}

export interface ChannelInfo {
  id?: string;
  title: string;
  handle: string;
  avatarUrl?: string;
  subscriberCountText?: string;
  url: string;
  videoCountText?: string;
}

export interface ScanOptions {
  channelInput: string;
  includeVideos: boolean;
  includeShorts: boolean;
  includeLive: boolean;
  scanDepth: 'quick' | 'standard' | 'deep' | 'all'; // 30, 100, 250, 500
  sortOrder: 'newest' | 'oldest';
  filterAccessType: 'all' | 'members-only' | 'public';
}

export interface ScanProgress {
  status: 'idle' | 'fetching_channel' | 'scanning_videos' | 'scanning_shorts' | 'scanning_live' | 'complete' | 'error';
  message: string;
  currentCount: number;
  membersOnlyCount: number;
  currentTab?: string;
}

export interface ExtensionFileItem {
  name: string;
  path: string;
  type: 'json' | 'html' | 'javascript' | 'css' | 'markdown';
  description: string;
  content: string;
}
