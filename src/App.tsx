import React, { useState } from 'react';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { ChannelScanner } from './components/ChannelScanner';
import { VideoTable } from './components/VideoTable';
import { ExportBar } from './components/ExportBar';
import { ChromeExtensionStudio } from './components/ChromeExtensionStudio';
import { CsvFormatGuide } from './components/CsvFormatGuide';
import { ScannedVideo, ChannelInfo, ScanOptions, ScanProgress } from './types';
import { INITIAL_CHANNEL, INITIAL_VIDEOS } from './mockData';
import { scanChannelService } from './utils/scannerService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'extension' | 'format'>('scanner');
  const [isDownloadingExtension, setIsDownloadingExtension] = useState(false);

  // Scanner state
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(INITIAL_CHANNEL);
  const [videos, setVideos] = useState<ScannedVideo[]>(INITIAL_VIDEOS);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress>({
    status: 'idle',
    currentTab: 'videos',
    currentCount: 12,
    message: '',
  });

  const handleStartScan = async (options: ScanOptions) => {
    setIsScanning(true);
    setProgress({
      status: 'scanning',
      currentTab: 'videos',
      currentCount: 0,
      message: `Connecting to YouTube for ${options.channelInput}...`,
    });

    try {
      const result = await scanChannelService(options, (p) => {
        setProgress((prev) => ({
          ...prev,
          message: p.message,
          currentCount: p.count,
        }));
      });

      setChannelInfo(result.channel);
      setVideos(result.videos);
      setProgress({
        status: 'complete',
        currentTab: 'streams',
        currentCount: result.videos.length,
        message: `Successfully indexed ${result.videos.length} items.`,
      });
    } catch (err: any) {
      console.error('Scan error:', err);
      setProgress({
        status: 'error',
        currentTab: 'videos',
        currentCount: 0,
        message: err.message || 'Failed to scan channel.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleCancelScan = () => {
    setIsScanning(false);
    setProgress({
      status: 'idle',
      currentTab: 'videos',
      currentCount: videos.length,
      message: 'Scan cancelled by user.',
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDownloadingExtension={isDownloadingExtension}
        setIsDownloadingExtension={setIsDownloadingExtension}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* TAB 1: WEB SCANNER & CSV EXPORTER */}
        {activeTab === 'scanner' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Channel Scanner Controls */}
            <ChannelScanner
              onScan={handleStartScan}
              isScanning={isScanning}
              progress={progress}
              channelInfo={channelInfo}
              onCancelScan={handleCancelScan}
            />

            {/* Stats Metrics Cards */}
            <StatsCards videos={videos} />

            {/* Export Bar */}
            <ExportBar videos={videos} channelHandle={channelInfo?.handle} />

            {/* Primary Videos Table */}
            <VideoTable videos={videos} />
          </div>
        )}

        {/* TAB 2: CHROME EXTENSION STUDIO */}
        {activeTab === 'extension' && (
          <div className="animate-fadeIn">
            <ChromeExtensionStudio sampleVideos={videos} />
          </div>
        )}

        {/* TAB 3: CSV FORMAT GUIDE */}
        {activeTab === 'format' && (
          <div className="animate-fadeIn">
            <CsvFormatGuide />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            YouTube Channel Scanner & CSV Exporter • Supports Videos, Shorts, Live & Members-Only Content
          </p>
          <div className="flex items-center gap-4 text-zinc-400">
            <button
              onClick={() => setActiveTab('extension')}
              className="hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Chrome Extension (Manifest V3)
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('format')}
              className="hover:text-zinc-200 transition-colors cursor-pointer"
            >
              CSV Specifications
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
