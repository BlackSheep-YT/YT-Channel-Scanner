import React, { useState } from 'react';
import { Download, Copy, Check, FileText, Code, CheckCircle2 } from 'lucide-react';
import { ScannedVideo } from '../types';
import { generateVideosCsv, downloadCsvFile, copyCsvToClipboard } from '../utils/csv';

interface ExportBarProps {
  videos: ScannedVideo[];
  channelHandle?: string;
}

export const ExportBar: React.FC<ExportBarProps> = ({ videos, channelHandle }) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleDownload = () => {
    if (videos.length === 0) return;
    const csv = generateVideosCsv(videos);
    const tag = channelHandle?.replace(/[^a-zA-Z0-9_-]/g, '') || 'channel';
    const filename = `${tag}_videos_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCsvFile(csv, filename);
  };

  const handleCopy = async () => {
    if (videos.length === 0) return;
    const csv = generateVideosCsv(videos);
    const success = await copyCsvToClipboard(csv);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadJson = () => {
    if (videos.length === 0) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(videos, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    const tag = channelHandle?.replace(/[^a-zA-Z0-9_-]/g, '') || 'channel';
    a.setAttribute('download', `${tag}_videos_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sampleCsvPreview = generateVideosCsv(videos.slice(0, 5));

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl shadow-black/20">
      {/* Description & Columns tag */}
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Ready to Export {videos.length} Videos</span>
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            CSV Format Verified
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-1 max-w-xl">
          Includes 6 standard columns: <code className="text-zinc-300 font-mono">Video Title</code>,{' '}
          <code className="text-zinc-300 font-mono">Video Link</code>,{' '}
          <code className="text-zinc-300 font-mono">Video Date</code>,{' '}
          <code className="text-zinc-300 font-mono">Video Category</code>,{' '}
          <code className="text-zinc-300 font-mono">Video Access Type</code> &{' '}
          <code className="text-zinc-300 font-mono">Membership Level</code>.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
        <button
          id="preview-csv-btn"
          onClick={() => setShowPreview(!showPreview)}
          className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700/80 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <Code className="w-3.5 h-3.5 text-zinc-400" />
          <span>{showPreview ? 'Hide Raw CSV' : 'Preview CSV'}</span>
        </button>

        <button
          id="copy-csv-clipboard-btn"
          onClick={handleCopy}
          disabled={videos.length === 0}
          className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-700/80 text-zinc-200 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>Copy CSV</span>
            </>
          )}
        </button>

        <button
          id="download-csv-file-btn"
          onClick={handleDownload}
          disabled={videos.length === 0}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download CSV</span>
        </button>

        <button
          id="download-json-btn"
          onClick={handleDownloadJson}
          disabled={videos.length === 0}
          className="px-2.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors"
          title="Export JSON format"
        >
          JSON
        </button>
      </div>

      {/* Raw CSV Preview Drawer */}
      {showPreview && (
        <div className="w-full mt-4 pt-4 border-t border-zinc-800 animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-300">
              Raw CSV Output Preview (First 5 rows):
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">RFC 4180 Compliant</span>
          </div>
          <pre className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto whitespace-pre leading-relaxed">
            {sampleCsvPreview}
          </pre>
        </div>
      )}
    </div>
  );
};
