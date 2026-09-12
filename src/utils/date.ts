/**
 * Parses YouTube relative/absolute date strings into ISO date string (YYYY-MM-DD)
 * and Unix epoch timestamp for accurate sorting.
 */
export function parseYouTubeDate(rawStr?: string): { date: string; rawDate: string; timestamp: number } {
  if (!rawStr || typeof rawStr !== 'string') {
    return { date: 'Unknown', rawDate: 'Unknown', timestamp: 0 };
  }

  const cleanStr = rawStr
    .replace(/^(Streamed live|Streamed|Premiered)\s+(on\s+)?/i, '')
    .trim();

  const now = new Date();

  // Pattern: "X (second|minute|hour|day|week|month|year)s ago"
  const relMatch = cleanStr.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/i);
  if (relMatch) {
    const num = parseInt(relMatch[1], 10);
    const unit = relMatch[2].toLowerCase();
    const target = new Date(now.getTime());

    switch (unit) {
      case 'second':
        target.setSeconds(target.getSeconds() - num);
        break;
      case 'minute':
        target.setMinutes(target.getMinutes() - num);
        break;
      case 'hour':
        target.setHours(target.getHours() - num);
        break;
      case 'day':
        target.setDate(target.getDate() - num);
        break;
      case 'week':
        target.setDate(target.getDate() - num * 7);
        break;
      case 'month':
        target.setMonth(target.getMonth() - num);
        break;
      case 'year':
        target.setFullYear(target.getFullYear() - num);
        break;
    }

    const isoDate = target.toISOString().split('T')[0];
    return {
      date: isoDate,
      rawDate: rawStr,
      timestamp: target.getTime(),
    };
  }

  // Check if it's already an absolute date like "Sep 10, 2024" or "10 Sep 2024"
  const parsedMs = Date.parse(cleanStr);
  if (!isNaN(parsedMs)) {
    const d = new Date(parsedMs);
    const isoDate = d.toISOString().split('T')[0];
    return {
      date: isoDate,
      rawDate: rawStr,
      timestamp: d.getTime(),
    };
  }

  return {
    date: cleanStr || 'Unknown',
    rawDate: rawStr,
    timestamp: 0,
  };
}
