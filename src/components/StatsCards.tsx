import React from 'react';
import { Video, Film, Radio, Lock, Globe, Layers } from 'lucide-react';
import { ScannedVideo } from '../types';

interface StatsCardsProps {
  videos: ScannedVideo[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ videos }) => {
  const total = videos.length;
  const videosCount = videos.filter((v) => v.category === 'Video').length;
  const shortsCount = videos.filter((v) => v.category === 'Shorts').length;
  const liveCount = videos.filter((v) => v.category === 'Live').length;
  const membersOnlyCount = videos.filter((v) => v.accessType === 'Members-only').length;
  const publicCount = videos.filter((v) => v.accessType === 'Public').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Total Scanned */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs font-medium">Total Items</span>
          <Layers className="w-4 h-4 text-zinc-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-zinc-100">{total}</span>
          <span className="text-xs text-zinc-500">items</span>
        </div>
      </div>

      {/* Standard Videos */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs font-medium">Videos</span>
          <Video className="w-4 h-4 text-blue-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-blue-400">{videosCount}</span>
          <span className="text-xs text-zinc-500">long-form</span>
        </div>
      </div>

      {/* Shorts */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs font-medium">Shorts</span>
          <Film className="w-4 h-4 text-pink-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-pink-400">{shortsCount}</span>
          <span className="text-xs text-zinc-500">vertical</span>
        </div>
      </div>

      {/* Live Streams */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs font-medium">Live Streams</span>
          <Radio className="w-4 h-4 text-red-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-red-400">{liveCount}</span>
          <span className="text-xs text-zinc-500">streams</span>
        </div>
      </div>

      {/* Members-Only Videos */}
      <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between text-amber-400">
          <span className="text-xs font-semibold flex items-center gap-1">
            <span>Members-Only</span>
          </span>
          <Lock className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-amber-400">{membersOnlyCount}</span>
          <span className="text-xs text-amber-500/80">exclusive</span>
        </div>
        <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/5 rounded-full blur-lg pointer-events-none" />
      </div>

      {/* Public Videos */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs font-medium">Public Access</span>
          <Globe className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-emerald-400">{publicCount}</span>
          <span className="text-xs text-zinc-500">videos</span>
        </div>
      </div>
    </div>
  );
};
