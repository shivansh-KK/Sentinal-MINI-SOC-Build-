import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Download,
  Filter,
  Search,
  CheckCircle,
  Eye,
  Radio,
  RefreshCw,
  Terminal,
  Clock,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import api from '../services/api';
import { SecurityEvent } from '../types';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';
import { SlideOverDrawer } from '../components/common/SlideOverDrawer';
import { useWebSocket } from '../contexts/WebSocketContext';

export const LiveMonitorPage: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { lastMessage } = useWebSocket();

  // Initial load
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const res = await api.get('/events?limit=50');
        setEvents(res.data);
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };
    fetchInitial();
  }, []);

  // Real-time WebSocket arrival
  useEffect(() => {
    if (!isPaused && lastMessage && lastMessage.type === 'NEW_EVENT') {
      const newEv: SecurityEvent = {
        id: lastMessage.data.id || Date.now(),
        timestamp: lastMessage.data.timestamp || new Date().toISOString(),
        source: lastMessage.data.source || 'agent',
        hostname: lastMessage.data.hostname || 'unknown',
        source_ip: lastMessage.data.source_ip,
        destination_ip: lastMessage.data.destination_ip,
        protocol: lastMessage.data.protocol || 'TCP',
        event_type: lastMessage.data.event_type || 'unknown',
        category: lastMessage.data.category || 'system',
        severity: lastMessage.data.severity || 'low',
        message: lastMessage.data.message || '',
        is_reviewed: false,
        is_synthetic: false,
        created_at: new Date().toISOString(),
      };
      setEvents((prev) => [newEv, ...prev.slice(0, 99)]);
    }
  }, [lastMessage, isPaused]);

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      !searchTerm ||
      ev.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.source_ip && ev.source_ip.includes(searchTerm)) ||
      ev.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.event_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = selectedSeverity === 'all' || ev.severity === selectedSeverity;
    const matchesCategory = selectedCategory === 'all' || ev.category === selectedCategory;

    return matchesSearch && matchesSeverity && matchesCategory;
  });

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/reports/export-csv?data_type=events', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sentinel_events_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export CSV failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className={`w-5 h-5 ${isPaused ? 'text-slate-400' : 'text-cyan-400 animate-pulse'}`} />
            <span>Real-Time Live Threat Monitor</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Streaming live telemetry from endpoints, honeypots, and lab integrations
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              isPaused
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-neon-cyan'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume Stream' : 'Pause Live Stream'}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/10 text-slate-300 border border-white/10 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by IP, host, command, message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full glass-input text-xs rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Severity selector */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="glass-input text-xs rounded-xl px-3 py-2 text-slate-300 bg-[#0c1222]"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>

          {/* Category selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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

      {/* Event Stream Table */}
      <GlassCard className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-white/10 font-mono text-[11px]">
                <th className="pb-3">Event ID</th>
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Severity</th>
                <th className="pb-3">Event Type</th>
                <th className="pb-3">Source IP</th>
                <th className="pb-3">Target Endpoint</th>
                <th className="pb-3">Message Summary</th>
                <th className="pb-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No matching events found in live stream
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr
                    key={ev.id}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    onClick={() => setSelectedEvent(ev)}
                  >
                    <td className="py-3 font-mono text-slate-400">#{ev.id}</td>
                    <td className="py-3 font-mono text-[11px] text-slate-300">
                      {new Date(ev.timestamp).toLocaleTimeString()}
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
                      {ev.source_ip || 'Internal / N/A'}
                    </td>
                    <td className="py-3 text-slate-200">{ev.hostname}</td>
                    <td className="py-3 text-slate-400 truncate max-w-sm">
                      {ev.message}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                        }}
                        className="p-1 rounded-lg hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* SlideOver Drawer for Event Details */}
      <SlideOverDrawer
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={`Event Telemetry #${selectedEvent?.id}`}
        subtitle={`Logged on host: ${selectedEvent?.hostname}`}
      >
        {selectedEvent && (
          <div className="space-y-6">
            {/* Severity and Type Banner */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div>
                <span className="text-[11px] text-slate-400 font-mono block">EVENT TYPE</span>
                <span className="text-base font-bold text-cyan-300 font-mono">{selectedEvent.event_type}</span>
              </div>
              <Badge variant={selectedEvent.severity as any} size="md">
                {selectedEvent.severity.toUpperCase()}
              </Badge>
            </div>

            {/* Network & Host Attributes */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 font-mono block mb-1">Source IP</span>
                <span className="font-mono text-slate-200 font-bold">{selectedEvent.source_ip || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 font-mono block mb-1">Destination IP</span>
                <span className="font-mono text-slate-200 font-bold">{selectedEvent.destination_ip || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 font-mono block mb-1">Protocol / Port</span>
                <span className="font-mono text-slate-200 font-bold">{selectedEvent.protocol} : {selectedEvent.destination_port || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 font-mono block mb-1">Event Category</span>
                <span className="text-slate-200 font-bold capitalize">{selectedEvent.category}</span>
              </div>
            </div>

            {/* Message */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Message Summary</span>
              <p className="text-sm text-slate-200">{selectedEvent.message}</p>
            </div>

            {/* Raw Log */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <span className="text-xs font-mono font-semibold text-cyan-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>Raw Log Stream</span>
              </span>
              <pre className="text-xs font-mono text-slate-300 p-2.5 bg-black/60 rounded-lg overflow-x-auto whitespace-pre-wrap">
                {selectedEvent.raw_log || selectedEvent.message}
              </pre>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
};
