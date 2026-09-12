import React, { useState } from 'react';
import { Search, Loader2, Play, Sparkles, CheckSquare, Square, SlidersHorizontal, AlertCircle, ExternalLink } from 'lucide-react';
import { ChannelInfo, ScanOptions, ScanProgress } from '../types';

interface ChannelScannerProps {
  onScan: (options: ScanOptions) => void;
  isScanning: boolean;
  progress: ScanProgress;
  channelInfo: ChannelInfo | null;
  onCancelScan: () => void;
}

const PRESET_CHANNELS = [
  { label: 'Linus Tech Tips', handle: '@LinusTechTips', note: 'Includes Members-Only Videos' },
  { label: 'Markiplier', handle: '@Markiplier', note: 'Members-Only Streams' },
  { label: 'Veritasium', handle: '@veritasium', note: 'Documentaries & Shorts' },
  { label: 'MKBHD', handle: '@mkbhd', note: 'Videos, Shorts & Streams' },
];

export const ChannelScanner: React.FC<ChannelScannerProps> = ({
  onScan,
  isScanning,
  progress,
  channelInfo,
  onCancelScan,
}) => {
  const [channelInput, setChannelInput] = useState('@LinusTechTips');
  const [includeVideos, setIncludeVideos] = useState(true);
  const [includeShorts, setIncludeShorts] = useState(true);
  const [includeLive, setIncludeLive] = useState(true);
  const [scanDepth, setScanDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelInput.trim() || isScanning) return;

    onScan({
      channelInput: channelInput.trim(),
      includeVideos,
      includeShorts,
      includeLive,
      scanDepth,
      sortOrder,
      filterAccessType: 'all',
    });
  };

  const handleSelectPreset = (handle: string) => {
    setChannelInput(handle);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl shadow-black/20">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Input Row */}
        <div>
          <label htmlFor="channel-url-input" className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
            YouTube Channel Handle or URL
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                id="channel-url-input"
                type="text"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                placeholder="e.g. @LinusTechTips or https://www.youtube.com/@channel"
                disabled={isScanning}
                className="w-full pl-11 pr-4 py-3 bg-zinc-950 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all disabled:opacity-50"
              />
            </div>

            <div className="flex gap-2">
              <button
                id="scan-now-btn"
                type="submit"
                disabled={isScanning || !channelInput.trim()}
                className="flex-1 sm:flex-initial px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:from-red-700 active:to-rose-700 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Scan Channel</span>
                  </>
                )}
              </button>

              {isScanning && (
                <button
                  id="cancel-scan-btn"
                  type="button"
                  onClick={onCancelScan}
                  className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-xl border border-zinc-700 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Channel Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-zinc-500 font-medium mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Quick Test:
          </span>
          {PRESET_CHANNELS.map((p) => (
            <button
              key={p.handle}
              type="button"
              onClick={() => handleSelectPreset(p.handle)}
              disabled={isScanning}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                channelInput === p.handle
                  ? 'bg-red-500/10 border-red-500/40 text-red-300 font-medium'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
              title={p.note}
            >
              <span>{p.label}</span>
              <span className="text-[10px] ml-1 text-zinc-500 font-mono">({p.handle})</span>
            </button>
          ))}
        </div>

        {/* Scan Options & Toggles */}
        <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Categories to scan */}
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 font-medium">Scan Categories:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={includeVideos}
                onChange={(e) => setIncludeVideos(e.target.checked)}
                disabled={isScanning}
                className="sr-only"
              />
              {includeVideos ? (
                <CheckSquare className="w-4 h-4 text-blue-400" />
              ) : (
                <Square className="w-4 h-4 text-zinc-600" />
              )}
              <span>Videos</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={includeShorts}
                onChange={(e) => setIncludeShorts(e.target.checked)}
                disabled={isScanning}
                className="sr-only"
              />
              {includeShorts ? (
                <CheckSquare className="w-4 h-4 text-pink-400" />
              ) : (
                <Square className="w-4 h-4 text-zinc-600" />
              )}
              <span>Shorts</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={includeLive}
                onChange={(e) => setIncludeLive(e.target.checked)}
                disabled={isScanning}
                className="sr-only"
              />
              {includeLive ? (
                <CheckSquare className="w-4 h-4 text-red-400" />
              ) : (
                <Square className="w-4 h-4 text-zinc-600" />
              )}
              <span>Live Streams</span>
            </label>
          </div>

          {/* Depth & Sort Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Depth:</span>
              <select
                value={scanDepth}
                onChange={(e) => setScanDepth(e.target.value as any)}
                disabled={isScanning}
                className="bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-red-500"
              >
                <option value="quick">Quick (30 items)</option>
                <option value="standard">Standard (100 items)</option>
                <option value="deep">Comprehensive (250 items)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Date Sort:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                disabled={isScanning}
                className="bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-red-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Scan Progress Bar */}
        {isScanning && (
          <div className="pt-2 animate-fadeIn">
            <div className="flex justify-between items-center text-xs text-zinc-300 mb-1.5">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                <span>{progress.message || 'Scanning YouTube channel...'}</span>
              </span>
              <span className="font-mono text-zinc-400">{progress.currentCount} items retrieved</span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, Math.max(15, (progress.currentCount / 100) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Notification */}
        {progress.status === 'error' && (
          <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300">Scan Failed</p>
              <p className="text-red-400 mt-0.5">{progress.message}</p>
            </div>
          </div>
        )}

        {/* Detected Channel Metadata Header */}
        {channelInfo && (
          <div className="mt-3 p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              {channelInfo.avatarUrl ? (
                <img
                  src={channelInfo.avatarUrl}
                  alt={channelInfo.title}
                  className="w-10 h-10 rounded-full border border-zinc-700 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                  {channelInfo.title.slice(0, 1)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-zinc-100 leading-tight">{channelInfo.title}</h3>
                  <a
                    href={channelInfo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-500 hover:text-zinc-300"
                    title="Open channel on YouTube"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                  <span>{channelInfo.handle}</span>
                  {channelInfo.subscriberCountText && (
                    <>
                      <span>•</span>
                      <span>{channelInfo.subscriberCountText}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                Channel Verified
              </span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
