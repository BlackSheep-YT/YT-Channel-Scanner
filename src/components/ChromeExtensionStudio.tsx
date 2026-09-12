import React, { useState } from 'react';
import {
  Download,
  Chrome,
  CheckCircle2,
  FolderArchive,
  ExternalLink,
  Code,
  Copy,
  Check,
  Eye,
  Sliders,
  Sparkles,
  Lock,
  Play,
  RotateCw,
} from 'lucide-react';
import {
  getAllExtensionFiles,
  downloadExtensionZip,
  MANIFEST_JSON,
  POPUP_HTML,
  POPUP_CSS,
  POPUP_JS,
  CONTENT_JS,
  BACKGROUND_JS,
  README_MD,
} from '../extensionSource';
import { ExtensionFileItem, ScannedVideo } from '../types';

interface ChromeExtensionStudioProps {
  sampleVideos?: ScannedVideo[];
}

export const ChromeExtensionStudio: React.FC<ChromeExtensionStudioProps> = ({ sampleVideos = [] }) => {
  const [selectedFile, setSelectedFile] = useState<string>('manifest.json');
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  // Simulator state
  const [simChannel, setSimChannel] = useState('@LinusTechTips');
  const [simScanning, setSimScanning] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [simVideos, setSimVideos] = useState<ScannedVideo[]>(sampleVideos.slice(0, 8));

  const extensionFiles = getAllExtensionFiles();
  const currentFile = extensionFiles.find((f) => f.name === selectedFile) || extensionFiles[0];

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      await downloadExtensionZip();
    } catch (e) {
      console.error('Failed to download zip', e);
    } finally {
      setIsZipping(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingleFile = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Run simulator scan
  const handleSimScan = () => {
    if (simScanning) return;
    setSimScanning(true);
    setSimProgress(10);
    setSimVideos([]);

    const interval = setInterval(() => {
      setSimProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setSimScanning(false);
          setSimVideos(sampleVideos.length > 0 ? sampleVideos.slice(0, 10) : MOCK_SIM_VIDEOS);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: 1-Click Extension Download */}
      <div className="bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900 border border-red-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-red-600 text-white shadow-md shadow-red-900/40">
                <Chrome className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                Chrome Extension (Manifest V3)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                Ready to Install
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-100 tracking-tight">
              YouTube Channel Scanner Extension
            </h2>
            <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
              Scan any YouTube channel directly from your Chrome toolbar. Extracts Videos, Shorts, and Live
              streams in Date-Wise order, detecting <strong>Members-Only content without requiring a membership</strong>,
              and exports structured CSV reports in 1 click.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <button
              id="download-extension-zip-btn"
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:from-red-700 active:to-rose-700 text-white font-bold text-sm rounded-xl transition-all shadow-xl shadow-red-950/50 flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
            >
              <FolderArchive className="w-4 h-4" />
              <span>{isZipping ? 'Generating Package...' : 'Download Extension (.zip)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Installation Steps & Interactive Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Installation Guide (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>How to Install in Google Chrome (Developer Mode)</span>
          </h3>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
              <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-400 font-bold text-xs flex items-center justify-center shrink-0 border border-red-500/30">
                1
              </div>
              <div className="text-xs">
                <p className="font-semibold text-zinc-200">Download & Extract the ZIP file</p>
                <p className="text-zinc-400 mt-0.5">
                  Click the <strong>"Download Extension (.zip)"</strong> button above and extract the downloaded
                  archive into a folder on your computer (e.g.{' '}
                  <code className="text-red-300 font-mono">youtube-channel-scanner</code>).
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
              <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-400 font-bold text-xs flex items-center justify-center shrink-0 border border-red-500/30">
                2
              </div>
              <div className="text-xs">
                <p className="font-semibold text-zinc-200">Open Extensions in Chrome</p>
                <p className="text-zinc-400 mt-0.5">
                  Open a new tab in Google Chrome and navigate to:{' '}
                  <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono select-all">
                    chrome://extensions
                  </code>
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
              <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-400 font-bold text-xs flex items-center justify-center shrink-0 border border-red-500/30">
                3
              </div>
              <div className="text-xs">
                <p className="font-semibold text-zinc-200">Enable "Developer mode"</p>
                <p className="text-zinc-400 mt-0.5">
                  Switch the <strong>"Developer mode"</strong> toggle switch in the top-right corner of the
                  Extensions page to <strong>ON</strong>.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
              <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-400 font-bold text-xs flex items-center justify-center shrink-0 border border-red-500/30">
                4
              </div>
              <div className="text-xs">
                <p className="font-semibold text-zinc-200">Click "Load unpacked"</p>
                <p className="text-zinc-400 mt-0.5">
                  Click the <strong>"Load unpacked"</strong> button in the top-left corner, and select the
                  extracted folder containing <code className="text-zinc-300 font-mono">manifest.json</code>.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/30">
                5
              </div>
              <div className="text-xs">
                <p className="font-semibold text-zinc-200">Ready! Scan any channel</p>
                <p className="text-zinc-400 mt-0.5">
                  Navigate to any YouTube channel (e.g.{' '}
                  <span className="text-zinc-300 font-mono">youtube.com/@mkbhd</span> or{' '}
                  <span className="text-zinc-300 font-mono">youtube.com/@LinusTechTips</span>), click the
                  extension icon in your toolbar, and export your CSV!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Extension Popup Simulator (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-red-500" />
              <span>Live Popup Simulator</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">420 × 580px view</span>
          </div>

          {/* Simulated Extension Popup Box */}
          <div className="w-full max-w-[380px] bg-[#0f0f11] text-[#f1f1f5] rounded-xl border border-zinc-700 shadow-2xl p-3.5 text-xs flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#23232a]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-600 flex items-center justify-center text-white font-bold text-[11px]">
                  YT
                </div>
                <div>
                  <div className="font-bold text-white text-xs">Channel Scanner</div>
                  <div className="text-[10px] text-zinc-400">Videos • Shorts • Live • Members</div>
                </div>
              </div>
              <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 font-mono">
                Manifest V3
              </span>
            </div>

            {/* Channel Pill */}
            <div className="bg-[#18181f] border border-[#282836] p-2 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-6 h-6 rounded-full bg-red-900/40 text-red-300 flex items-center justify-center font-bold text-[10px] shrink-0 border border-red-800">
                  L
                </div>
                <div className="overflow-hidden">
                  <div className="font-semibold text-white truncate text-[11px]">{simChannel}</div>
                  <div className="text-[10px] text-zinc-400 truncate">Channel detected on tab</div>
                </div>
              </div>
              <button
                onClick={() => setSimChannel(simChannel === '@LinusTechTips' ? '@Markiplier' : '@LinusTechTips')}
                className="text-[10px] text-zinc-400 hover:text-white px-1.5 py-0.5 rounded bg-zinc-800"
                title="Toggle test channel"
              >
                ↻
              </button>
            </div>

            {/* Options */}
            <div className="bg-[#18181f] border border-[#282836] p-2.5 rounded-lg flex flex-col gap-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Tabs:</span>
                <div className="flex gap-1">
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold text-[10px]">
                    Videos
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-semibold text-[10px]">
                    Shorts
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-semibold text-[10px]">
                    Live
                  </span>
                </div>
              </div>
            </div>

            {/* Scan Action */}
            <div className="flex gap-2">
              <button
                onClick={handleSimScan}
                disabled={simScanning}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {simScanning ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scanning ({simProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Scan Current Channel</span>
                  </>
                )}
              </button>
            </div>

            {/* Simulated Results Preview */}
            <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1">
              <span>Results: {simVideos.length} items</span>
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span>
                  {simVideos.filter((v) => v.accessType === 'Members-only').length} Members-Only
                </span>
              </span>
            </div>

            {/* Results list snippet */}
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {(simVideos.length > 0 ? simVideos : MOCK_SIM_VIDEOS).map((v) => {
                const isMem = v.accessType === 'Members-only';
                return (
                  <div
                    key={v.id}
                    className={`p-1.5 rounded-md border flex items-center justify-between gap-2 ${
                      isMem
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        : 'bg-[#181820] border-[#262633] text-zinc-300'
                    }`}
                  >
                    <div className="truncate flex-1">
                      <div className="font-semibold text-[11px] text-white truncate">{v.title}</div>
                      <div className="text-[9px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <span className="font-mono">{v.category}</span>
                        <span>•</span>
                        <span>{v.date}</span>
                      </div>
                    </div>
                    {isMem ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
                        🔒 Member
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 shrink-0">
                        Public
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Extension Source Code Browser */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-400" />
              <span>Extension Source Code Inspector</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Inspect all Manifest V3 extension scripts included in the package.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownloadSingleFile}
              className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save File</span>
            </button>
          </div>
        </div>

        {/* File Tabs */}
        <div className="flex overflow-x-auto bg-zinc-950 border-b border-zinc-800 px-3 pt-2 gap-1">
          {extensionFiles.map((file) => (
            <button
              key={file.name}
              onClick={() => setSelectedFile(file.name)}
              className={`px-3.5 py-2 rounded-t-lg text-xs font-mono transition-colors whitespace-nowrap ${
                selectedFile === file.name
                  ? 'bg-zinc-900 text-zinc-100 border-t border-x border-zinc-700 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              {file.name}
            </button>
          ))}
        </div>

        {/* File Description */}
        <div className="px-4 py-2 bg-zinc-950/60 border-b border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between">
          <span>{currentFile.description}</span>
          <span className="font-mono text-zinc-500 text-[11px]">{currentFile.content.split('\n').length} lines</span>
        </div>

        {/* Code Content */}
        <div className="p-4 bg-zinc-950/95 overflow-x-auto max-h-96">
          <pre className="text-xs font-mono text-zinc-300 leading-relaxed select-all">
            {currentFile.content}
          </pre>
        </div>
      </div>
    </div>
  );
};

const MOCK_SIM_VIDEOS: ScannedVideo[] = [
  {
    id: 'sim1',
    title: 'WAN Show: Exclusive After-Hours Member Stream',
    link: 'https://www.youtube.com/watch?v=sim1',
    date: '2026-09-10',
    rawDate: '2 days ago',
    timestamp: Date.now() - 172800000,
    category: 'Live',
    accessType: 'Members-only',
    membershipLevel: 'Members only',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80',
  },
  {
    id: 'sim2',
    title: 'Building a $50,000 Liquid Nitrogen PC',
    link: 'https://www.youtube.com/watch?v=sim2',
    date: '2026-09-09',
    rawDate: '3 days ago',
    timestamp: Date.now() - 259200000,
    category: 'Video',
    accessType: 'Public',
    membershipLevel: 'Public',
    thumbnailUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&q=80',
  },
  {
    id: 'sim3',
    title: 'Behind the Scenes: Unreleased Studio Tour',
    link: 'https://www.youtube.com/watch?v=sim3',
    date: '2026-09-08',
    rawDate: '4 days ago',
    timestamp: Date.now() - 345600000,
    category: 'Video',
    accessType: 'Members-only',
    membershipLevel: 'Tier 1 Supporter',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=300&q=80',
  },
  {
    id: 'sim4',
    title: 'Quick Desk Setup Tour in 60s',
    link: 'https://www.youtube.com/shorts/sim4',
    date: '2026-09-07',
    rawDate: '5 days ago',
    timestamp: Date.now() - 432000000,
    category: 'Shorts',
    accessType: 'Public',
    membershipLevel: 'Public',
    thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80',
  },
];
