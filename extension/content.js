// content.js - Injected into YouTube tabs to scan videos and detect Members-Only content
let isScanActive = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_CHANNEL_INFO') {
    const info = extractChannelMetadata();
    sendResponse({ success: true, channel: info });
    return true;
  }

  if (request.action === 'START_SCAN') {
    isScanActive = true;
    runChannelScan(request.options).then(videos => {
      chrome.runtime.sendMessage({
        action: 'SCAN_COMPLETE',
        videos: videos
      });
    }).catch(err => {
      chrome.runtime.sendMessage({
        action: 'SCAN_ERROR',
        error: err.message
      });
    });
    sendResponse({ started: true });
    return true;
  }

  if (request.action === 'STOP_SCAN') {
    isScanActive = false;
    sendResponse({ stopped: true });
    return true;
  }
});

function extractChannelMetadata() {
  const titleEl = document.querySelector('ytd-channel-name yt-formatted-string, #channel-name yt-formatted-string, .ytd-channel-name');
  const handleEl = document.querySelector('yt-formatted-string#channel-handle, .ytd-channel-handle, #channel-tag');
  const avatarEl = document.querySelector('yt-img-shadow#avatar img, #avatar img, .channel-header-avatar');

  const title = titleEl ? titleEl.textContent.trim() : document.title.replace(' - YouTube', '');
  const handle = handleEl ? handleEl.textContent.trim() : window.location.pathname.split('/')[1] || '';
  const avatarUrl = avatarEl ? avatarEl.src : '';

  return {
    title: title,
    handle: handle,
    avatarUrl: avatarUrl,
    url: window.location.href
  };
}

async function runChannelScan(options) {
  const currentUrl = window.location.href;
  const channelBase = getChannelBaseUrl(currentUrl);
  const collectedVideos = [];
  const seenIds = new Set();

  const tabsToScan = [];
  if (options.includeVideos) tabsToScan.push({ tab: 'videos', category: 'Video' });
  if (options.includeShorts) tabsToScan.push({ tab: 'shorts', category: 'Shorts' });
  if (options.includeLive) tabsToScan.push({ tab: 'streams', category: 'Live' });

  const maxTotal = options.depth || 100;

  for (let i = 0; i < tabsToScan.length; i++) {
    if (!isScanActive) break;
    const { tab, category } = tabsToScan[i];

    chrome.runtime.sendMessage({
      action: 'SCAN_PROGRESS',
      progress: Math.round(((i) / tabsToScan.length) * 100),
      message: `Scanning ${category} tab...`,
      count: collectedVideos.length,
      newVideos: []
    });

    try {
      const tabUrl = `${channelBase}/${tab}?hl=en`;
      const tabVideos = await fetchAndParseTab(tabUrl, category, maxTotal - collectedVideos.length);
      
      const newItems = [];
      for (const v of tabVideos) {
        if (!seenIds.has(v.id)) {
          seenIds.add(v.id);
          collectedVideos.push(v);
          newItems.push(v);
        }
      }

      chrome.runtime.sendMessage({
        action: 'SCAN_PROGRESS',
        progress: Math.round(((i + 1) / tabsToScan.length) * 100),
        message: `Found ${newItems.length} ${category} items`,
        count: collectedVideos.length,
        newVideos: newItems
      });
    } catch (e) {
      console.warn(`Error scanning ${tab}: `, e);
    }
  }

  return collectedVideos;
}

function getChannelBaseUrl(url) {
  const urlObj = new URL(url);
  const parts = urlObj.pathname.split('/').filter(Boolean);
  if (parts.length > 0) {
    if (parts[0].startsWith('@')) {
      return `https://www.youtube.com/${parts[0]}`;
    }
    if ((parts[0] === 'channel' || parts[0] === 'c' || parts[0] === 'user') && parts[1]) {
      return `https://www.youtube.com/${parts[0]}/${parts[1]}`;
    }
  }
  return `https://www.youtube.com${urlObj.pathname}`.replace(/\/(videos|shorts|streams|playlists|community|channels|about)/, '');
}

async function fetchAndParseTab(tabUrl, category, limit) {
  const res = await fetch(tabUrl, {
    headers: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
    credentials: 'include'
  });
  const html = await res.text();

  const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/s);
  if (!match) return [];

  let ytInitialData;
  try {
    ytInitialData = JSON.parse(match[1]);
  } catch (err) {
    return [];
  }

  const items = extractItemsFromYtData(ytInitialData, category);
  return items.slice(0, limit);
}

function extractItemsFromYtData(data, defaultCategory) {
  const results = [];
  const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs;
  if (!tabs) return results;

  const selectedTab = tabs.find(t => t.tabRenderer?.selected) || tabs[1] || tabs[0];
  const contents = selectedTab?.tabRenderer?.content?.richGridRenderer?.contents 
    || selectedTab?.tabRenderer?.content?.sectionListRenderer?.contents;

  if (!contents || !Array.isArray(contents)) return results;

  for (const item of contents) {
    const richItem = item.richItemRenderer?.content;
    if (!richItem) continue;

    if (richItem.lockupViewModel) {
      const v = parseLockupViewModel(richItem.lockupViewModel, defaultCategory);
      if (v) results.push(v);
    } else if (richItem.videoRenderer) {
      const v = parseVideoRenderer(richItem.videoRenderer, defaultCategory);
      if (v) results.push(v);
    } else if (richItem.shortsLockupViewModel) {
      const s = parseShortsLockupViewModel(richItem.shortsLockupViewModel);
      if (s) results.push(s);
    }
  }

  return results;
}

function parseLockupViewModel(lockup, defaultCategory) {
  const videoId = lockup.contentId;
  if (!videoId) return null;

  const titleMeta = lockup.metadata?.lockupMetadataViewModel;
  const title = titleMeta?.title?.content || 'Untitled Video';

  let accessType = 'Public';
  let membershipLevel = 'Public';

  const badges = titleMeta?.badges || [];
  for (const b of badges) {
    const badgeVm = b.badgeViewModel;
    if (badgeVm) {
      const text = badgeVm.badgeText || '';
      const style = badgeVm.badgeStyle || '';
      if (style.includes('MEMBERS_ONLY') || text.toLowerCase().includes('member')) {
        accessType = 'Members-only';
        membershipLevel = text || 'Members only';
      }
    }
  }

  const rows = titleMeta?.metadata?.contentMetadataViewModel?.metadataRows || [];
  let rawDate = 'Unknown';
  for (const row of rows) {
    for (const part of row.parts || []) {
      const text = part.text?.content || '';
      if (text.toLowerCase().includes('member')) {
        accessType = 'Members-only';
        membershipLevel = text;
      }
      if (text.includes('ago') || text.match(/[A-Za-z]{3}\s+\d{1,2}/) || text.includes('Streamed')) {
        rawDate = text;
      }
    }
  }

  const { date, timestamp } = parseDate(rawDate);
  const link = `https://www.youtube.com/watch?v=${videoId}`;
  const thumb = lockup.contentImage?.thumbnailViewModel?.image?.sources?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return {
    id: videoId,
    title,
    link,
    date,
    rawDate,
    timestamp,
    category: defaultCategory,
    accessType,
    membershipLevel: accessType === 'Members-only' ? (membershipLevel || 'Members only') : 'Public',
    thumbnailUrl: thumb
  };
}

function parseVideoRenderer(renderer, defaultCategory) {
  const videoId = renderer.videoId;
  if (!videoId) return null;

  const title = renderer.title?.runs?.[0]?.text || renderer.title?.simpleText || 'Untitled Video';
  const rawDate = renderer.publishedTimeText?.simpleText || 'Unknown';
  const { date, timestamp } = parseDate(rawDate);

  let accessType = 'Public';
  let membershipLevel = 'Public';

  if (renderer.badges && Array.isArray(renderer.badges)) {
    for (const b of renderer.badges) {
      const badge = b.metadataBadgeRenderer;
      if (badge) {
        if (badge.style === 'BADGE_STYLE_TYPE_MEMBERS_ONLY' || badge.label?.toLowerCase().includes('member')) {
          accessType = 'Members-only';
          membershipLevel = badge.label || 'Members only';
        }
      }
    }
  }

  return {
    id: videoId,
    title,
    link: `https://www.youtube.com/watch?v=${videoId}`,
    date,
    rawDate,
    timestamp,
    category: defaultCategory,
    accessType,
    membershipLevel: accessType === 'Members-only' ? (membershipLevel || 'Members only') : 'Public',
    thumbnailUrl: renderer.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  };
}

function parseShortsLockupViewModel(shorts) {
  const videoId = shorts.entityId ? shorts.entityId.replace('shorts-shelf-item-', '') : null;
  if (!videoId) return null;

  const title = shorts.accessibilityText || shorts.overlay?.reelPlayerOverlayRenderer?.reelPlayerHeaderSupportedRenderers?.reelPlayerHeaderRenderer?.headline?.simpleText || 'Shorts Video';
  const thumb = shorts.onTap?.innertubeCommand?.reelWatchEndpoint?.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/frame0.jpg`;

  return {
    id: videoId,
    title,
    link: `https://www.youtube.com/shorts/${videoId}`,
    date: new Date().toISOString().split('T')[0],
    rawDate: 'Recent Short',
    timestamp: Date.now(),
    category: 'Shorts',
    accessType: 'Public',
    membershipLevel: 'Public',
    thumbnailUrl: thumb
  };
}

function parseDate(rawStr) {
  if (!rawStr || typeof rawStr !== 'string') return { date: 'Unknown', timestamp: 0 };
  const clean = rawStr.replace(/^(Streamed live|Streamed|Premiered)\s+(on\s+)?/i, '').trim();
  const now = new Date();

  const relMatch = clean.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/i);
  if (relMatch) {
    const num = parseInt(relMatch[1], 10);
    const unit = relMatch[2].toLowerCase();
    const target = new Date(now.getTime());
    if (unit === 'minute') target.setMinutes(target.getMinutes() - num);
    else if (unit === 'hour') target.setHours(target.getHours() - num);
    else if (unit === 'day') target.setDate(target.getDate() - num);
    else if (unit === 'week') target.setDate(target.getDate() - num * 7);
    else if (unit === 'month') target.setMonth(target.getMonth() - num);
    else if (unit === 'year') target.setFullYear(target.getFullYear() - num);
    return { date: target.toISOString().split('T')[0], timestamp: target.getTime() };
  }

  const parsedMs = Date.parse(clean);
  if (!isNaN(parsedMs)) {
    const d = new Date(parsedMs);
    return { date: d.toISOString().split('T')[0], timestamp: d.getTime() };
  }

  return { date: clean, timestamp: 0 };
}
