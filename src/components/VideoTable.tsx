import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Lock,
  Globe,
  Search,
  ArrowUpDown,
  Filter,
  Film,
  Video as VideoIcon,
  Radio,
  Calendar,
  Layers,
} from 'lucide-react';
import { ScannedVideo, VideoCategory, VideoAccessType } from '../types';

interface VideoTableProps {
  videos: ScannedVideo[];
}

export const VideoTable: React.FC<VideoTableProps> = ({ videos }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | VideoCategory>('All');
  const [accessFilter, setAccessFilter] = useState<'All' | VideoAccessType>('All');
  const [sortField, setSortField] = useState<'date' | 'title' | 'category' | 'access'>('date');
  const [sortAsc, setSortAsc] = useState(false); // false = newest first
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleCopyLink = (id: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    let result = [...videos];

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((v) => v.title.toLowerCase().includes(q));
    }

    // Category filter
    if (categoryFilter !== 'All') {
      result = result.filter((v) => v.category === categoryFilter);
    }

    // Access filter
    if (accessFilter !== 'All') {
      result = result.filter((v) => v.accessType === accessFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        cmp = timeA - timeB;
      } else if (sortField === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (sortField === 'category') {
        cmp = a.category.localeCompare(b.category);
      } else if (sortField === 'access') {
        cmp = a.accessType.localeCompare(b.accessType);
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [videos, searchTerm, categoryFilter, accessFilter, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(filteredVideos.length / pageSize) || 1;
  const paginatedVideos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVideos.slice(start, start + pageSize);
  }, [filteredVideos, currentPage, pageSize]);

  const toggleSort = (field: 'date' | 'title' | 'category' | 'access') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default to descending/newest
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            id="table-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by video title..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-lg text-zinc-200 placeholder-zinc-500 text-xs focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Filter Badges & Page Size */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Filter */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <span className="text-zinc-500 px-2 font-medium">Type:</span>
            {(['All', 'Video', 'Shorts', 'Live'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategoryFilter(cat);
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Access Filter */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <span className="text-zinc-500 px-2 font-medium">Access:</span>
            {(['All', 'Public', 'Members-only'] as const).map((acc) => (
              <button
                key={acc}
                onClick={() => {
                  setAccessFilter(acc);
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  accessFilter === acc
                    ? acc === 'Members-only'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                      : 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {acc === 'Members-only' ? '🔒 Members-only' : acc}
              </button>
            ))}
          </div>

          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-2.5 py-1.5 rounded-lg text-xs outline-none"
          >
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-950/80 text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800 select-none">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th
                onClick={() => toggleSort('title')}
                className="py-3 px-4 cursor-pointer hover:text-zinc-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Video Title</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
                </div>
              </th>
              <th className="py-3 px-4 w-28">Video Link</th>
              <th
                onClick={() => toggleSort('date')}
                className="py-3 px-4 w-40 cursor-pointer hover:text-zinc-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Video Date</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-red-500" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('category')}
                className="py-3 px-4 w-32 cursor-pointer hover:text-zinc-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Category</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('access')}
                className="py-3 px-4 w-36 cursor-pointer hover:text-zinc-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Access Type</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
                </div>
              </th>
              <th className="py-3 px-4 w-44">Membership Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {paginatedVideos.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Layers className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
                    <p className="text-sm font-medium text-zinc-400">No videos match your criteria</p>
                    <p className="text-xs text-zinc-600">Try changing your search term or filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedVideos.map((video, idx) => {
                const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                const isMemberOnly = video.accessType === 'Members-only';

                return (
                  <tr
                    key={video.id}
                    className={`transition-colors ${
                      isMemberOnly
                        ? 'bg-amber-500/[0.04] hover:bg-amber-500/[0.08]'
                        : 'hover:bg-zinc-800/40'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-3 px-4 text-center font-mono text-zinc-500 text-[11px]">
                      {globalIndex}
                    </td>

                    {/* Video Title + Thumbnail Preview */}
                    <td className="py-3 px-4 max-w-xs sm:max-w-md md:max-w-lg">
                      <div className="flex items-center gap-3">
                        {video.thumbnailUrl && (
                          <div className="relative shrink-0 w-16 h-10 rounded bg-zinc-800 overflow-hidden border border-zinc-700/60">
                            <img
                              src={video.thumbnailUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {video.duration && (
                              <span className="absolute bottom-0.5 right-0.5 bg-black/85 text-[9px] font-mono text-white px-1 rounded">
                                {video.duration}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <a
                            href={video.link}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-zinc-100 hover:text-red-400 transition-colors line-clamp-2 leading-snug"
                            title={video.title}
                          >
                            {video.title}
                          </a>
                          {video.viewCountText && (
                            <span className="text-[10px] text-zinc-500 mt-0.5 block">
                              {video.viewCountText}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Video Link */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={video.link}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors flex items-center gap-1"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-3 h-3 text-zinc-400" />
                          <span>Watch</span>
                        </a>
                        <button
                          onClick={() => handleCopyLink(video.id, video.link)}
                          className="p-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                          title="Copy Link"
                        >
                          {copiedId === video.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Video Date */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-200">{video.date}</span>
                        {video.rawDate && video.rawDate !== video.date && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {video.rawDate}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Video Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {video.category === 'Video' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <VideoIcon className="w-3 h-3" />
                          <span>Video</span>
                        </span>
                      )}
                      {video.category === 'Shorts' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                          <Film className="w-3 h-3" />
                          <span>Shorts</span>
                        </span>
                      )}
                      {video.category === 'Live' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <Radio className="w-3 h-3" />
                          <span>Live</span>
                        </span>
                      )}
                    </td>

                    {/* Video Access Type */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {isMemberOnly ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950/20">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>Members-only</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Globe className="w-3 h-3" />
                          <span>Public</span>
                        </span>
                      )}
                    </td>

                    {/* Membership Level */}
                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] ${
                          isMemberOnly ? 'font-medium text-amber-200' : 'text-zinc-500'
                        }`}
                      >
                        {video.membershipLevel}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
        <div>
          Showing{' '}
          <span className="font-semibold text-zinc-200">
            {filteredVideos.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-zinc-200">
            {Math.min(currentPage * pageSize, filteredVideos.length)}
          </span>{' '}
          of <span className="font-semibold text-zinc-200">{filteredVideos.length}</span> videos
          {filteredVideos.length !== videos.length && ` (filtered from ${videos.length})`}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Previous
          </button>
          <span className="px-2 text-zinc-400 font-mono">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
