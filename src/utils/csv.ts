import { ScannedVideo } from '../types';

/**
 * Escapes a cell according to RFC 4180 CSV specifications:
 * Any cell containing quotes, commas, or newlines must be enclosed in double quotes,
 * and any internal double quotes must be doubled ("").
 */
export function escapeCsvCell(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).trim();
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates CSV string matching the user's requested format:
 * Video Title, Video Link, Video Date, Video Category, Video Access Type, Membership Level
 */
export function generateVideosCsv(
  videos: ScannedVideo[],
  options: { includeRawDate?: boolean } = {}
): string {
  // Exact columns requested:
  // Video Title, Video Link, Video Date, Video Category (Video, Shorts, Live), Video Access Type (Public or Members-only) & Membership Level
  const headers = [
    'Video Title',
    'Video Link',
    'Video Date',
    'Video Category',
    'Video Access Type',
    'Membership Level',
  ];

  const rows = videos.map((video) => {
    const displayDate = options.includeRawDate && video.rawDate && video.rawDate !== video.date
      ? `${video.date} (${video.rawDate})`
      : video.date;

    return [
      escapeCsvCell(video.title),
      escapeCsvCell(video.link),
      escapeCsvCell(displayDate),
      escapeCsvCell(video.category),
      escapeCsvCell(video.accessType),
      escapeCsvCell(video.membershipLevel),
    ].join(',');
  });

  // Prepend UTF-8 BOM (\uFEFF) so Excel and Google Sheets open special characters and emojis cleanly
  return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
}

/**
 * Triggers a browser file download of the generated CSV
 */
export function downloadCsvFile(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName.endsWith('.csv') ? fileName : `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies the CSV string to the user clipboard
 */
export async function copyCsvToClipboard(csvContent: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(csvContent);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = csvContent;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}
