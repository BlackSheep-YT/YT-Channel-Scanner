import React from 'react';
import { FileSpreadsheet, Check, ShieldCheck, Copy } from 'lucide-react';

export const CsvFormatGuide: React.FC = () => {
  const sampleRows = [
    {
      title: 'WAN Show: Exclusive Behind The Scenes & Q&A',
      link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      date: '2026-09-10',
      category: 'Live',
      access: 'Members-only',
      level: 'Members only',
    },
    {
      title: 'Building the Fastest Gaming Computer on Earth',
      link: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
      date: '2026-09-08',
      category: 'Video',
      access: 'Public',
      level: 'Public',
    },
    {
      title: 'Secret Lab Tech You Cannot Buy Anywhere',
      link: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
      date: '2026-09-05',
      category: 'Video',
      access: 'Members-only',
      level: 'Tier 2: Insider VIP',
    },
    {
      title: 'Can you bend an unbreakable OLED display?',
      link: 'https://www.youtube.com/shorts/kJQP7kiw5Fk',
      date: '2026-09-02',
      category: 'Shorts',
      access: 'Public',
      level: 'Public',
    },
  ];

  const rawCsv = [
    'Video Title,Video Link,Video Date,Video Category,Video Access Type,Membership Level',
    '"WAN Show: Exclusive Behind The Scenes & Q&A","https://www.youtube.com/watch?v=dQw4w9WgXcQ","2026-09-10","Live","Members-only","Members only"',
    '"Building the Fastest Gaming Computer on Earth","https://www.youtube.com/watch?v=3JZ_D3ELwOQ","2026-09-08","Video","Public","Public"',
    '"Secret Lab Tech You Cannot Buy Anywhere","https://www.youtube.com/watch?v=9bZkp7q19f0","2026-09-05","Video","Members-only","Tier 2: Insider VIP"',
    '"Can you bend an unbreakable OLED display?","https://www.youtube.com/shorts/kJQP7kiw5Fk","2026-09-02","Shorts","Public","Public"',
  ].join('\n');

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-zinc-100">CSV Export Specifications</h2>
        </div>
        <p className="text-xs text-zinc-400">
          The generated CSV adheres strictly to RFC 4180 specifications with UTF-8 BOM encoding for seamless
          import into Microsoft Excel, Google Sheets, and data science notebooks.
        </p>
      </div>

      {/* Field Definitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
          <div className="text-xs font-mono font-bold text-red-400">1. Video Title</div>
          <div className="text-xs text-zinc-400 mt-1">
            Complete headline text of the video, escaped for quotes and commas.
          </div>
        </div>

        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
          <div className="text-xs font-mono font-bold text-blue-400">2. Video Link</div>
          <div className="text-xs text-zinc-400 mt-1">
            Canonical direct URL (<code className="text-zinc-300 font-mono">watch?v=...</code> or{' '}
            <code className="text-zinc-300 font-mono">/shorts/...</code>).
          </div>
        </div>

        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
          <div className="text-xs font-mono font-bold text-amber-400">3. Video Date</div>
          <div className="text-xs text-zinc-400 mt-1">
            Standardized <code className="text-zinc-300 font-mono">YYYY-MM-DD</code> format sorted date-wise.
          </div>
        </div>

        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
          <div className="text-xs font-mono font-bold text-pink-400">4. Video Category</div>
          <div className="text-xs text-zinc-400 mt-1">
            Exact value: <span className="font-semibold text-zinc-200">Video</span>,{' '}
            <span className="font-semibold text-zinc-200">Shorts</span>, or{' '}
            <span className="font-semibold text-zinc-200">Live</span>.
          </div>
        </div>

        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
          <div className="text-xs font-mono font-bold text-emerald-400">5. Video Access Type</div>
          <div className="text-xs text-zinc-400 mt-1">
            Exact value: <span className="font-semibold text-amber-300">Members-only</span> or{' '}
            <span className="font-semibold text-emerald-300">Public</span>.
          </div>
        </div>

        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
          <div className="text-xs font-mono font-bold text-indigo-400">6. Membership Level</div>
          <div className="text-xs text-zinc-400 mt-1">
            Extracted tier name or <code className="text-zinc-300 font-mono">Members only</code> (or{' '}
            <code className="text-zinc-300 font-mono">Public</code>).
          </div>
        </div>
      </div>

      {/* Visual Table */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <div className="bg-zinc-950 px-4 py-2.5 border-b border-zinc-800 text-xs font-semibold text-zinc-300">
          Sample Output Table
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-950/60 text-zinc-400 border-b border-zinc-800 font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Video Title</th>
                <th className="py-2.5 px-3">Video Link</th>
                <th className="py-2.5 px-3">Video Date</th>
                <th className="py-2.5 px-3">Video Category</th>
                <th className="py-2.5 px-3">Video Access Type</th>
                <th className="py-2.5 px-3">Membership Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {sampleRows.map((r, i) => (
                <tr key={i} className="hover:bg-zinc-800/30">
                  <td className="py-2.5 px-3 font-medium text-zinc-200">{r.title}</td>
                  <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px] truncate max-w-xs">{r.link}</td>
                  <td className="py-2.5 px-3 font-mono text-zinc-300">{r.date}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-200">
                      {r.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {r.access === 'Members-only' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        🔒 Members-only
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400">
                        Public
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-300 text-[11px]">{r.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Output Block */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-300">Raw CSV String</span>
          <button
            onClick={() => navigator.clipboard.writeText(rawCsv)}
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Raw Sample</span>
          </button>
        </div>
        <pre className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
          {rawCsv}
        </pre>
      </div>
    </div>
  );
};
