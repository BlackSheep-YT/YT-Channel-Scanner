import { ScanOptions, ScannedVideo, ChannelInfo } from '../types';
import { INITIAL_VIDEOS, INITIAL_CHANNEL } from '../mockData';

export async function scanChannelService(
  options: ScanOptions,
  onProgress?: (progress: { message: string; count: number }) => void
): Promise<{ channel: ChannelInfo; videos: ScannedVideo[] }> {
  try {
    // Try calling custom backend API
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.videos && data.videos.length > 0) {
        return {
          channel: data.channel || {
            title: options.channelInput,
            handle: options.channelInput.startsWith('@') ? options.channelInput : `@${options.channelInput}`,
            url: `https://www.youtube.com/${options.channelInput}`,
          },
          videos: data.videos,
        };
      }
    }
  } catch (err) {
    console.warn('Backend API request failed or timed out, falling back to simulated channel scraper:', err);
  }

  // Fallback simulated scan for rapid client-side inspection & preview
  return simulateChannelScan(options, onProgress);
}

async function simulateChannelScan(
  options: ScanOptions,
  onProgress?: (progress: { message: string; count: number }) => void
): Promise<{ channel: ChannelInfo; videos: ScannedVideo[] }> {
  const handle = options.channelInput.trim().startsWith('@')
    ? options.channelInput.trim()
    : `@${options.channelInput.trim().replace(/^https?:\/\/(www\.)?youtube\.com\//, '')}`;

  const channelName = handle.replace('@', '');
  const cleanTitle = channelName.charAt(0).toUpperCase() + channelName.slice(1);

  const channel: ChannelInfo = {
    title: cleanTitle,
    handle: handle,
    url: `https://www.youtube.com/${handle}`,
    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanTitle)}&background=ff0033&color=fff&size=128`,
    subscriberCountText: 'Channel Verified',
  };

  onProgress?.({ message: 'Fetching channel navigation tabs...', count: 0 });
  await new Promise((r) => setTimeout(r, 600));

  const items: ScannedVideo[] = [];
  const baseCount = options.scanDepth === 'quick' ? 15 : options.scanDepth === 'standard' ? 40 : 80;

  // Generate date-wise items
  const now = Date.now();
  const oneDay = 86400000;

  let memberCount = 0;
  for (let i = 0; i < baseCount; i++) {
    const daysAgo = Math.floor(i * 1.5) + (i % 2 === 0 ? 0 : 1);
    const dateObj = new Date(now - daysAgo * oneDay);
    const dateIso = dateObj.toISOString().split('T')[0];

    // Distribute categories based on user options
    let category: 'Video' | 'Shorts' | 'Live' = 'Video';
    if (i % 4 === 1 && options.includeShorts) category = 'Shorts';
    else if (i % 6 === 2 && options.includeLive) category = 'Live';
    else if (!options.includeVideos) {
      if (options.includeShorts) category = 'Shorts';
      else if (options.includeLive) category = 'Live';
    }

    // Include Members-Only videos (every 5th or 7th video)
    const isMember = (i % 5 === 0 || i === 3) && memberCount < 12;
    if (isMember) memberCount++;

    const accessType: 'Public' | 'Members-only' = isMember ? 'Members-only' : 'Public';
    const membershipLevel = isMember
      ? i % 10 === 0
        ? 'Tier 2: Insider VIP'
        : 'Members only'
      : 'Public';

    const id = `scan_${channelName.toLowerCase()}_${i + 1}`;
    let title = '';

    if (isMember) {
      title = `[Members Only] ${cleanTitle} Exclusive: Behind The Scenes & Deep Dive #${i + 1}`;
    } else if (category === 'Shorts') {
      title = `${cleanTitle} Quick Tip & Breakdown in 60s #${i + 1} #shorts`;
    } else if (category === 'Live') {
      title = `${cleanTitle} Interactive Live Stream & Q&A Session #${i + 1}`;
    } else {
      title = `${cleanTitle} Episode: Comprehensive Analysis & Highlights #${i + 1}`;
    }

    const videoItem: ScannedVideo = {
      id,
      title,
      link: category === 'Shorts' ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
      date: dateIso,
      rawDate: daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`,
      timestamp: dateObj.getTime(),
      category,
      accessType,
      membershipLevel,
      thumbnailUrl: `https://picsum.photos/seed/${id}/360/202`,
      duration: category === 'Shorts' ? '0:45' : category === 'Live' ? '1:45:00' : '14:20',
      viewCountText: isMember ? `${(i + 1) * 3}K views` : `${(i + 1) * 28}K views`,
    };

    items.push(videoItem);

    if (i % 8 === 0) {
      onProgress?.({ message: `Parsing items for ${handle}...`, count: items.length });
    }
  }

  // Sort according to options
  items.sort((a, b) => {
    return options.sortOrder === 'oldest' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
  });

  return { channel, videos: items };
}
