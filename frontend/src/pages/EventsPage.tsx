import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import api from '../services/api';
import { SecurityEvent } from '../types';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';
import { SlideOverDrawer } from '../components/common/SlideOverDrawer';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [page, setPage] = useState(0);
  const limit = 25;

  const fetchEvents = async () => {
    try {
      let url = `/events?skip=${page * limit}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (category !== 'all') url += `&category=${category}`;
      if (severity !== 'all') url += `&severity=${severity}`;

      const res = await api.get(url);
      setEvents(res.data);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, category, severity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchEvents();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Security Events Repository</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Normalized security logs, system audit telemetry, and authentication events
          </p>
        </div>
      </div>

      <GlassCard className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search raw logs, users, IP addresses, messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-input text-xs rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={severity}
            onChange={(e) => { setSeverity(e.target.value); setPage(0); }}
            className="glass-input text-xs rounded-xl px-3 py-2 text-slate-300 bg-[#0c1222]"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>

          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(0); }}
            className="glass-input text-xs rounded-xl px-3 py-2 text-slate-300 bg-[#0c1222]"
          >
            <option value="all">All Categories</option>
            <option value="authentication">Authentication</option>
            <option value="network">Network</option>
            <option value="process">Process</option>
            <option value="file_integrity">File Integrity</option>
          </select>
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-white/10 font-mono text-[11px]">
                <th className="pb-3">ID</th>
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Severity</th>
                <th className="pb-3">Event Type</th>
                <th className="pb-3">Source IP</th>
                <th className="pb-3">Target Host</th>
                <th className="pb-3">User</th>
                <th className="pb-3">Summary</th>
                <th className="pb-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No security events found matching criteria
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td className="py-3 font-mono text-slate-400">#{ev.id}</td>
                    <td className="py-3 font-mono text-[11px] text-slate-300">
                      {new Date(ev.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <Badge size="sm" variant={ev.severity as any}>
                        {ev.severity}
                      </Badge>
                    </td>
                    <td className="py-3 font-mono text-cyan-300 font-medium">
                      {ev.event_type}
                    </td>
                    <td className="py-3 font-mono text-slate-300">
                      {ev.source_ip || 'N/A'}
                    </td>
                    <td className="py-3 text-slate-200">{ev.hostname}</td>
                    <td className="py-3 font-mono text-slate-300">{ev.username || '—'}</td>
                    <td className="py-3 text-slate-400 truncate max-w-xs">{ev.message}</td>
                    <td className="py-3 text-right">
                      <button className="p-1 rounded-lg text-slate-400 hover:text-cyan-300">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 text-xs text-slate-400">
          <span>Showing page {page + 1} ({events.length} records)</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={events.length < limit}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </GlassCard>

      <SlideOverDrawer
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={`Security Event #${selectedEvent?.id}`}
        subtitle={`Logged on host: ${selectedEvent?.hostname}`}
      >
        {selectedEvent && (
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Category</span>
                <p className="text-sm font-bold text-white capitalize">{selectedEvent.category}</p>
              </div>
              <Badge variant={selectedEvent.severity as any} size="md">
                {selectedEvent.severity.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 font-mono block mb-1">Source IP</span>
                <span className="font-mono text-slate-200 font-bold">{selectedEvent.source_ip || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 font-mono block mb-1">Target Endpoint</span>
                <span className="font-mono text-slate-200 font-bold">{selectedEvent.hostname}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 font-semibold uppercase block mb-1">Full Summary</span>
              <p className="text-slate-200">{selectedEvent.message}</p>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/10">
              <span className="font-mono text-cyan-400 block mb-2 font-bold">Raw Log Evidence:</span>
              <pre className="font-mono text-slate-300 whitespace-pre-wrap">
                {selectedEvent.raw_log || selectedEvent.message}
              </pre>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
};
