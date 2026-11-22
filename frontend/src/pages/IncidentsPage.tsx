import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Search,
  CheckCircle,
  Clock,
  User,
  Shield,
  Layers,
  Send,
  Eye,
  ExternalLink,
  Lock,
} from 'lucide-react';
import api from '../services/api';
import { Incident } from '../types';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';
import { SlideOverDrawer } from '../components/common/SlideOverDrawer';

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentDetails, setSelectedIncidentDetails] = useState<any>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newNote, setNewNote] = useState('');
  const navigate = useNavigate();

  const fetchIncidents = async () => {
    try {
      let url = '/incidents?limit=50';
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await api.get(url);
      setIncidents(res.data);
    } catch (err) {
      console.error('Error fetching incidents:', err);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter]);

  const openIncidentDetails = async (incId: string) => {
    setSelectedIncidentId(incId);
    try {
      const res = await api.get(`/incidents/${incId}`);
      setSelectedIncidentDetails(res.data);
    } catch (err) {
      console.error('Failed to load incident details:', err);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedIncidentId) return;
    try {
      const res = await api.patch(`/incidents/${selectedIncidentId}`, { status: newStatus });
      setIncidents((prev) => prev.map((i) => (i.incident_id === selectedIncidentId ? res.data : i)));
      if (selectedIncidentDetails) {
        setSelectedIncidentDetails({
          ...selectedIncidentDetails,
          incident: res.data,
        });
      }
    } catch (err) {
      console.error('Update status failed:', err);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedIncidentId) return;
    try {
      const res = await api.post(`/incidents/${selectedIncidentId}/notes`, { note: newNote });
      if (selectedIncidentDetails) {
        setSelectedIncidentDetails({
          ...selectedIncidentDetails,
          incident: res.data,
        });
      }
      setIncidents((prev) => prev.map((i) => (i.incident_id === selectedIncidentId ? res.data : i)));
      setNewNote('');
    } catch (err) {
      console.error('Add note failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-400" />
            <span>Security Incident Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Correlated multi-vector security incidents requiring containment and remediation
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search incident ID, title, affected host..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchIncidents()}
            className="w-full glass-input text-xs rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'new', 'open', 'investigating', 'contained', 'resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase transition-all ${
                statusFilter === st
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-neon-cyan'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Incidents Table */}
      <GlassCard className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-white/10 font-mono text-[11px]">
                <th className="pb-3">Incident ID</th>
                <th className="pb-3">Severity</th>
                <th className="pb-3">Incident Title</th>
                <th className="pb-3">Attacker IP</th>
                <th className="pb-3">Affected Asset</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Created</th>
                <th className="pb-3 text-right">Workspace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No security incidents recorded
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr
                    key={inc.incident_id}
                    onClick={() => openIncidentDetails(inc.incident_id)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 font-mono text-cyan-400 font-semibold">{inc.incident_id}</td>
                    <td className="py-3">
                      <Badge size="sm" variant={inc.severity as any}>
                        {inc.severity}
                      </Badge>
                    </td>
                    <td className="py-3 max-w-sm">
                      <div className="font-semibold text-slate-100">{inc.title}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{inc.description}</div>
                    </td>
                    <td className="py-3 font-mono text-cyan-300">{inc.source_ip || 'Internal'}</td>
                    <td className="py-3 text-slate-300">{inc.affected_endpoint || 'N/A'}</td>
                    <td className="py-3">
                      <span className="capitalize font-mono text-xs text-slate-300">
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-400 text-[11px]">
                      {new Date(inc.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/app/investigation?incident_id=${inc.incident_id}`);
                        }}
                        className="px-2.5 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-[11px] font-mono border border-cyan-500/30"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* SlideOver Drawer for Incident Details & Timeline */}
      <SlideOverDrawer
        isOpen={!!selectedIncidentId}
        onClose={() => {
          setSelectedIncidentId(null);
          setSelectedIncidentDetails(null);
        }}
        title={`Incident Case ${selectedIncidentId}`}
        subtitle={selectedIncidentDetails?.incident?.title}
        width="max-w-2xl"
      >
        {selectedIncidentDetails && (
          <div className="space-y-6 text-xs">
            {/* Status and Action Buttons */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={selectedIncidentDetails.incident.severity as any} size="md">
                  {selectedIncidentDetails.incident.severity.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-400">STATUS:</span>
                  <span className="text-cyan-300 font-bold uppercase">{selectedIncidentDetails.incident.status}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/5 flex-wrap">
                <button
                  onClick={() => handleUpdateStatus('investigating')}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30"
                >
                  Mark Investigating
                </button>
                <button
                  onClick={() => handleUpdateStatus('contained')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                >
                  Mark Contained
                </button>
                <button
                  onClick={() => handleUpdateStatus('resolved')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => handleUpdateStatus('closed')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-white/10 hover:bg-slate-700"
                >
                  Close Case
                </button>
                <button
                  onClick={() => navigate(`/app/investigation?incident_id=${selectedIncidentId}`)}
                  className="ml-auto px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 font-semibold"
                >
                  <span>Open Full Workspace</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Incident Chronological Timeline */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Attack & Investigation Timeline
              </span>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
                {/* Event points */}
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-cyan-400 ring-4 ring-cyan-500/20" />
                  <span className="text-[10px] font-mono text-cyan-400">
                    {new Date(selectedIncidentDetails.incident.created_at).toLocaleTimeString()}
                  </span>
                  <p className="text-sm font-semibold text-white mt-0.5">Incident Registered</p>
                  <p className="text-xs text-slate-400">{selectedIncidentDetails.incident.description}</p>
                </div>

                {selectedIncidentDetails.alerts?.map((al: any) => (
                  <div key={al.alert_id} className="relative">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-amber-400 ring-4 ring-amber-500/20" />
                    <span className="text-[10px] font-mono text-amber-400">
                      {new Date(al.created_at).toLocaleTimeString()}
                    </span>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">Triggered: {al.rule_name}</p>
                    <p className="text-xs text-slate-400">{al.description}</p>
                  </div>
                ))}

                {selectedIncidentDetails.incident.containment_time && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" />
                    <span className="text-[10px] font-mono text-emerald-400">
                      {new Date(selectedIncidentDetails.incident.containment_time).toLocaleTimeString()}
                    </span>
                    <p className="text-sm font-semibold text-emerald-300 mt-0.5">Threat Contained</p>
                    <p className="text-xs text-slate-400">Mitigation action applied successfully.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Analyst Investigation Log & Notes */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Analyst Notes
              </span>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 max-h-40 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap">
                {selectedIncidentDetails.incident.investigation_notes || 'No investigation notes logged.'}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Append observation or response note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  className="flex-1 glass-input text-xs rounded-xl px-3 py-2 text-slate-200"
                />
                <button
                  onClick={handleAddNote}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 font-medium"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
};
