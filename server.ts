import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RawItemResult {
  id: string;
  title: string;
  link: string;
  date: string;
  rawDate: string;
  timestamp: number;
  category: 'Video' | 'Shorts' | 'Live' | 'Members-Only';
  accessType: 'Public' | 'Members-only';
  membershipLevel: string;
  thumbnailUrl: string;
  duration?: string;
  viewCountText?: string;
}

const YOUTUBE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cookie': 'SOCS=CAESEwgDEgk2MTQyNjExNTMaAmVuIAEaBgiA_LyaBg; CONSENT=PENDING+999;',
};

function parseYouTubeDate(rawStr?: string): { date: string; rawDate: string; timestamp: number } {
  if (!rawStr || typeof rawStr !== 'string') {
    return { date: 'Unknown', rawDate: 'Unknown', timestamp: 0 };
  }

  const clean = rawStr.replace(/^(Streamed live|Streamed|Premiered)\s+(on\s+)?/i, '').trim();
  const now = new Date();

  // "X (second|minute|hour|day|week|month|year)s ago"
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
    return {
      date: target.toISOString().split('T')[0],
      rawDate: rawStr,
      timestamp: target.getTime(),
    };
  }

  const parsedMs = Date.parse(clean);
  if (!isNaN(parsedMs)) {
    const d = new Date(parsedMs);
    return {
      date: d.toISOString().split('T')[0],
      rawDate: rawStr,
      timestamp: d.getTime(),
    };
  }

  return { date: clean, rawDate: rawStr, timestamp: 0 };
}

function resolveChannelTarget(input: string): string {
  let cleaned = input.trim();
  if (!cleaned) return '@mkbhd';

  // Extract from full URLs
  try {
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      const url = new URL(cleaned);
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        if (pathParts[0].startsWith('@')) return pathParts[0];
        if (['channel', 'c', 'user'].includes(pathParts[0]) && pathParts[1]) {
          return `${pathParts[0]}/${pathParts[1]}`;
        }
        return pathParts[0];
      }
    }
  } catch (e) {
    // Ignore invalid url parse
  }

  // If user typed without @, prepend @ unless it's a channel/UC... format
  if (!cleaned.startsWith('@') && !cleaned.startsWith('channel/') && !cleaned.startsWith('c/') && !cleaned.startsWith('user/')) {
    if (cleaned.startsWith('UC') && cleaned.length >= 20) {
      return `channel/${cleaned}`;
    }
    return `@${cleaned}`;
  }

  return cleaned;
}

function extractYtInitialData(html: string): any | null {
  const match =
    html.match(/ytInitialData\s*=\s*({.+?});<\/script>/s) ||
    html.match(/var ytInitialData\s*=\s*({.+?});<\/script>/s);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (err) {
    return null;
  }
}

function extractInnertubeApiKey(html: string): { apiKey: string | null; clientVersion: string } {
  const keyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  const verMatch = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/);
  return {
    apiKey: keyMatch ? keyMatch[1] : null,
    clientVersion: verMatch ? verMatch[1] : '2.20240901.00.00',
  };
}

function parseItem(item: any, defaultCategory: 'Video' | 'Shorts' | 'Live' | 'Members-Only'): RawItemResult | null {
  const richItem = item.richItemRenderer?.content || item;
  if (!richItem) return null;

  // Modern lockupViewModel
  if (richItem.lockupViewModel) {
    const lockup = richItem.lockupViewModel;
    const videoId = lockup.contentId;
    if (!videoId) return null;

    const meta = lockup.metadata?.lockupMetadataViewModel;
    const title = meta?.title?.content || 'Untitled Video';

    let accessType: 'Public' | 'Members-only' = defaultCategory === 'Members-Only' ? 'Members-only' : 'Public';
    let membershipLevel = defaultCategory === 'Members-Only' ? 'Members only' : 'Public';

    // Check badges
    const badges = meta?.badges || [];
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

    // Check thumbnail overlay badges
    const overlays = lockup.contentImage?.thumbnailViewModel?.overlays || [];
    let duration = '';
    for (const ov of overlays) {
      const bot = ov.thumbnailBottomOverlayViewModel;
      if (bot?.badges) {
        for (const bd of bot.badges) {
          const tBadge = bd.thumbnailBadgeViewModel;
          if (tBadge) {
            if (tBadge.badgeStyle?.includes('MEMBERS_ONLY') || tBadge.text?.toLowerCase()?.includes('member')) {
              accessType = 'Members-only';
              membershipLevel = tBadge.text || 'Members only';
            } else if (tBadge.text && !duration) {
              duration = tBadge.text;
            }
          }
        }
      }
    }

    // Check rows for date
    let rawDate = 'Unknown';
    let viewCount = '';
    const rows = meta?.metadata?.contentMetadataViewModel?.metadataRows || [];
    for (const row of rows) {
      for (const p of row.parts || []) {
        const txt = p.text?.content || '';
        if (txt.toLowerCase().includes('member')) {
          accessType = 'Members-only';
          membershipLevel = txt;
        } else if (txt.includes('ago') || txt.match(/[A-Za-z]{3}\s+\d{1,2}/) || txt.includes('Streamed')) {
          rawDate = txt;
        } else if (txt.includes('views') || txt.includes('watching')) {
          viewCount = txt;
        }
      }
    }

    const { date, timestamp } = parseYouTubeDate(rawDate);
    const thumb =
      lockup.contentImage?.thumbnailViewModel?.image?.sources?.[0]?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return {
      id: videoId,
      title,
      link: defaultCategory === 'Shorts' ? `https://www.youtube.com/shorts/${videoId}` : `https://www.youtube.com/watch?v=${videoId}`,
      date,
      rawDate,
      timestamp,
      category: defaultCategory,
      accessType,
      membershipLevel: accessType === 'Members-only' ? (membershipLevel || 'Members only') : 'Public',
      thumbnailUrl: thumb,
      duration,
      viewCountText: viewCount,
    };
  }

  // shortsLockupViewModel
  if (richItem.shortsLockupViewModel) {
    const shorts = richItem.shortsLockupViewModel;
    const videoId = shorts.entityId ? shorts.entityId.replace('shorts-shelf-item-', '') : null;
    if (!videoId) return null;

    const title =
      shorts.overlay?.reelPlayerOverlayRenderer?.reelPlayerHeaderSupportedRenderers?.reelPlayerHeaderRenderer?.headline?.simpleText ||
      shorts.accessibilityText?.replace(/ - play Short$/i, '') ||
      'Shorts Video';

    const thumb =
      shorts.onTap?.innertubeCommand?.reelWatchEndpoint?.thumbnail?.thumbnails?.[0]?.url ||
      `https://i.ytimg.com/vi/${videoId}/frame0.jpg`;

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
      thumbnailUrl: thumb,
    };
  }

  // Legacy videoRenderer
  if (richItem.videoRenderer) {
    const vr = richItem.videoRenderer;
    const videoId = vr.videoId;
    if (!videoId) return null;

    const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || 'Untitled Video';
    const rawDate = vr.publishedTimeText?.simpleText || 'Unknown';
    const { date, timestamp } = parseYouTubeDate(rawDate);

    let accessType: 'Public' | 'Members-only' = 'Public';
    let membershipLevel = 'Public';

    if (vr.badges && Array.isArray(vr.badges)) {
      for (const b of vr.badges) {
        const mb = b.metadataBadgeRenderer;
        if (mb) {
          if (mb.style === 'BADGE_STYLE_TYPE_MEMBERS_ONLY' || mb.label?.toLowerCase()?.includes('member')) {
            accessType = 'Members-only';
            membershipLevel = mb.label || 'Members only';
          }
        }
      }
    }

    const thumb = vr.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const duration = vr.lengthText?.simpleText || '';

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
      thumbnailUrl: thumb,
      duration,
    };
  }

  return null;
}

async function fetchContinuationItems(
  apiKey: string,
  clientVersion: string,
  token: string,
  category: 'Video' | 'Shorts' | 'Live' | 'Members-Only'
): Promise<{ items: RawItemResult[]; nextToken: string | null }> {
  try {
    const res = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${apiKey}&prettyPrint=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...YOUTUBE_HEADERS,
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion,
            hl: 'en',
            gl: 'US',
          },
        },
        continuation: token,
      }),
    });

    if (!res.ok) return { items: [], nextToken: null };
    const data = await res.json();
    const actions = data.onResponseReceivedActions || [];
    const items: RawItemResult[] = [];
    let nextToken: string | null = null;

    for (const act of actions) {
      const contItems =
        act.appendContinuationItemsAction?.continuationItems ||
        act.reloadContinuationItemsCommand?.continuationItems ||
        [];

      for (const ci of contItems) {
        if (ci.continuationItemRenderer) {
          nextToken = ci.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token || null;
        } else {
          const parsed = parseItem(ci, category);
          if (parsed) items.push(parsed);
        }
      }
    }

    return { items, nextToken };
  } catch (err) {
    return { items: [], nextToken: null };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API 1: Quick Channel Info
  app.get('/api/channel-info', async (req: Request, res: Response) => {
    const target = req.query.channel as string;
    if (!target) {
      return res.status(400).json({ error: 'Missing channel parameter' });
    }

    const resolved = resolveChannelTarget(target);
    try {
      const url = `https://www.youtube.com/${resolved}/videos?hl=en`;
      const ytRes = await fetch(url, { headers: YOUTUBE_HEADERS });
      if (!ytRes.ok) {
        return res.status(404).json({ error: `Could not load channel (Status ${ytRes.status})` });
      }

      const html = await ytRes.text();
      const ytData = extractYtInitialData(html);
      if (!ytData) {
        return res.status(404).json({ error: 'Could not extract channel metadata' });
      }

      const header = ytData.header?.c4TabbedHeaderRenderer || ytData.header?.pageHeaderRenderer;
      const metadata = ytData.metadata?.channelMetadataRenderer;

      const title =
        metadata?.title ||
        header?.title ||
        header?.content?.pageHeaderViewModel?.title?.dynamicTextViewModel?.text?.content ||
        resolved;

      const avatar =
        metadata?.avatar?.thumbnails?.[0]?.url ||
        header?.avatar?.thumbnails?.[0]?.url ||
        header?.content?.pageHeaderViewModel?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources?.[0]?.url ||
        '';

      const subscriberCount =
        header?.subscriberCountText?.simpleText ||
        header?.content?.pageHeaderViewModel?.metadata?.contentMetadataViewModel?.metadataRows?.[1]?.parts?.[0]?.text?.content ||
        '';

      return res.json({
        success: true,
        channel: {
          title,
          handle: resolved.startsWith('@') ? resolved : `@${resolved}`,
          avatarUrl: avatar,
          subscriberCountText: subscriberCount,
          url: `https://www.youtube.com/${resolved}`,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Server error fetching channel info' });
    }
  });

  // API 2: Comprehensive Channel Scanner
  app.post(['/api/scan', '/api/scan-channel'], async (req: Request, res: Response) => {
    const {
      channelInput,
      includeVideos = true,
      includeShorts = true,
      includeLive = true,
      includeMembers = true,
      depth = 100,
      sortOrder = 'newest',
    } = req.body;

    const resolved = resolveChannelTarget(channelInput || '@mkbhd');
    const collectedVideos: RawItemResult[] = [];
    const seenIds = new Set<string>();

    const tabsToScan: Array<{ tab: 'videos' | 'shorts' | 'streams' | 'membership'; category: 'Video' | 'Shorts' | 'Live' | 'Members-Only' }> = [];
    if (includeVideos) tabsToScan.push({ tab: 'videos', category: 'Video' });
    if (includeShorts) tabsToScan.push({ tab: 'shorts', category: 'Shorts' });
    if (includeLive) tabsToScan.push({ tab: 'streams', category: 'Live' });
    if (includeMembers) tabsToScan.push({ tab: 'membership', category: 'Members-Only' });

    let channelMeta: any = {
      title: resolved,
      handle: resolved,
      avatarUrl: '',
      subscriberCountText: '',
      url: `https://www.youtube.com/${resolved}`,
    };

    const targetMax = typeof depth === 'number' ? depth : (depth === 'all' ? 10000 : 100);

    for (const { tab, category } of tabsToScan) {
      if (collectedVideos.length >= targetMax) break;

      try {
        const url = `https://www.youtube.com/${resolved}/${tab}?hl=en`;
        const ytRes = await fetch(url, { headers: YOUTUBE_HEADERS });
        if (!ytRes.ok) continue;

        const html = await ytRes.text();
        const ytData = extractYtInitialData(html);
        if (!ytData) continue;

        // Populate channel info from first successful response
        if (!channelMeta.avatarUrl) {
          const header = ytData.header?.c4TabbedHeaderRenderer || ytData.header?.pageHeaderRenderer;
          const metadata = ytData.metadata?.channelMetadataRenderer;
          channelMeta.title =
            metadata?.title ||
            header?.title ||
            header?.content?.pageHeaderViewModel?.title?.dynamicTextViewModel?.text?.content ||
            resolved;
          channelMeta.avatarUrl =
            metadata?.avatar?.thumbnails?.[0]?.url ||
            header?.avatar?.thumbnails?.[0]?.url ||
            header?.content?.pageHeaderViewModel?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources?.[0]?.url ||
            '';
          channelMeta.subscriberCountText =
            header?.subscriberCountText?.simpleText ||
            header?.content?.pageHeaderViewModel?.metadata?.contentMetadataViewModel?.metadataRows?.[1]?.parts?.[0]?.text?.content ||
            '';
        }

        const tabs = ytData.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
        const selectedTab = tabs.find((t: any) => t.tabRenderer?.selected) || tabs[1] || tabs[0];
        const richGrid = selectedTab?.tabRenderer?.content?.richGridRenderer;
        const contents = richGrid?.contents || [];

        let continuationToken: string | null = null;

        for (const item of contents) {
          if (item.continuationItemRenderer) {
            continuationToken =
              item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token || null;
            continue;
          }

          const parsed = parseItem(item, category);
          if (parsed && !seenIds.has(parsed.id)) {
            seenIds.add(parsed.id);
            collectedVideos.push(parsed);
          }
          if (collectedVideos.length >= targetMax) break;
        }

        // If deeper pagination is needed and token exists
        if (targetMax > 30 && continuationToken && collectedVideos.length < targetMax) {
          const { apiKey, clientVersion } = extractInnertubeApiKey(html);
          if (apiKey) {
            let nextTok: string | null = continuationToken;
            let pageCount = 0;
            while (nextTok && collectedVideos.length < targetMax && pageCount < 10) {
              pageCount++;
              const { items, nextToken } = await fetchContinuationItems(apiKey, clientVersion, nextTok, category);
              for (const v of items) {
                if (!seenIds.has(v.id)) {
                  seenIds.add(v.id);
                  collectedVideos.push(v);
                }
                if (collectedVideos.length >= targetMax) break;
              }
              nextTok = nextToken;
            }
          }
        }
      } catch (err) {
        console.warn(`Error scanning tab ${tab}:`, err);
      }
    }

    // Sort date-wise
    collectedVideos.sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return res.json({
      success: true,
      channel: channelMeta,
      count: collectedVideos.length,
      membersOnlyCount: collectedVideos.filter((v) => v.accessType === 'Members-only').length,
      publicCount: collectedVideos.filter((v) => v.accessType === 'Public').length,
      videos: collectedVideos,
    });
  });

  // Serve Vite app
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`YouTube Channel Scanner running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
