import React from 'react';
import { Download, Youtube, Chrome, ShieldAlert, FileSpreadsheet, PlaySquare } from 'lucide-react';
import { downloadExtensionZip } from '../extensionSource';

interface HeaderProps {
  activeTab: 'scanner' | 'extension' | 'format';
  setActiveTab: (tab: 'scanner' | 'extension' | 'format') => void;
  isDownloadingExtension: boolean;
  setIsDownloadingExtension: (v: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDownloadingExtension,
  setIsDownloadingExtension,
}) => {
  const handleDownloadZip = async () => {
    try {
      setIsDownloadingExtension(true);
      await downloadExtensionZip();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloadingExtension(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-950/50 text-white font-bold">
            <Youtube className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight leading-none">
                YT Channel Scanner
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <span>🔒</span> Members-Only Support
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Scan Videos, Shorts & Live streams in Date-Wise order & export to CSV
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <nav className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          <button
            id="tab-btn-scanner"
            onClick={() => setActiveTab('scanner')}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'scanner'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <PlaySquare className="w-4 h-4 text-red-500" />
            <span>Web Scanner</span>
          </button>
          <button
            id="tab-btn-extension"
            onClick={() => setActiveTab('extension')}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'extension'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Chrome className="w-4 h-4 text-emerald-400" />
            <span>Chrome Extension</span>
            <span className="ml-1 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
              V3
            </span>
          </button>
          <button
            id="tab-btn-format"
            onClick={() => setActiveTab('format')}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 hidden md:flex ${
              activeTab === 'format'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            <span>CSV Schema</span>
          </button>
        </nav>

        {/* Primary CTA: 1-Click Extension Download */}
        <div className="flex items-center gap-2">
          <button
            id="header-download-extension-btn"
            onClick={handleDownloadZip}
            disabled={isDownloadingExtension}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 active:bg-red-700 text-white transition-all shadow-md shadow-red-900/30 disabled:opacity-50"
            title="Download ready-to-install Chrome Extension ZIP package"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloadingExtension ? 'Packaging ZIP...' : 'Download Extension (.zip)'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
