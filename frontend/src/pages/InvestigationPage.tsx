import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Crosshair,
  Search,
  CheckCircle,
  Clock,
  ShieldAlert,
  FileText,
  Save,
  Send,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import api from '../services/api';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';

export const InvestigationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const incidentIdParam = searchParams.get('incident_id');

  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(incidentIdParam || '');
  const [evidenceData, setEvidenceData] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await api.get('/incidents?limit=25');
        setIncidents(res.data);
        if (!selectedIncidentId && res.data.length > 0) {
          setSelectedIncidentId(res.data[0].incident_id);
        }
      } catch (err) {
        console.error('Error fetching incidents list:', err);
      }
    };
    fetchIncidents();
  }, []);

  useEffect(() => {
    if (selectedIncidentId) {
      const fetchEvidence = async () => {
        try {
          const res = await api.get(`/investigation/evidence?incident_id=${selectedIncidentId}`);
          setEvidenceData(res.data);
          setNotes(res.data.incident?.investigation_notes || '');
          setResolutionSummary(res.data.incident?.resolution_summary || '');
        } catch (err) {
          console.error('Error fetching evidence:', err);
        }
      };
      fetchEvidence();
    }
  }, [selectedIncidentId]);

  const handleSaveInvestigation = async () => {
    if (!selectedIncidentId) return;
    try {
      await api.patch(`/incidents/${selectedIncidentId}`, {
        investigation_notes: notes,
        resolution_summary: resolutionSummary,
      });
      setSaveMessage('Investigation findings and notes saved to master incident ledger.');
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-cyan-400" />
            <span>Security Investigation Workspace & Evidence Board</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deep forensic reconstruction, timeline analysis, and MITRE ATT&CK kill-chain mapping
          </p>
        </div>

        {/* Incident Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Target Incident:</span>
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="glass-input text-xs rounded-xl px-3 py-2 text-cyan-300 font-mono bg-[#0c1222] border-cyan-500/30"
          >
            {incidents.map((inc) => (
              <option key={inc.incident_id} value={inc.incident_id}>
                {inc.incident_id} - {inc.title.slice(0, 35)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{saveMessage}</span>
        </div>
      )}

      {evidenceData ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Attack Details & MITRE Kill Chain (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Incident Summary Card */}
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={evidenceData.incident.severity} size="md">
                    {evidenceData.incident.severity.toUpperCase()}
                  </Badge>
                  <h2 className="text-sm font-bold text-white">{evidenceData.incident.title}</h2>
                </div>
                <span className="font-mono text-xs text-cyan-400 font-bold">
                  STATUS: {evidenceData.incident.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-slate-500 block mb-1">Attacker IP</span>
                  <span className="text-cyan-300 font-bold">{evidenceData.incident.source_ip || 'N/A'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-slate-500 block mb-1">Affected Asset</span>
                  <span className="text-white font-bold">{evidenceData.incident.affected_endpoint || 'N/A'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-slate-500 block mb-1">Created At</span>
                  <span className="text-slate-300">{new Date(evidenceData.incident.created_at).toLocaleTimeString()}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">
                {evidenceData.incident.description}
              </p>
            </GlassCard>

            {/* MITRE ATT&CK Matrix Mapping */}
            <GlassCard className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  MITRE ATT&CK Kill-Chain Alignments
                </h3>
                <span className="text-[10px] text-cyan-400 font-mono">Framework v14</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {evidenceData.mitre_mappings?.map((m: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-cyan-500/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-cyan-400 text-xs">{m.technique}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">{m.tactic}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200">{m.name}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Forensic Reconstruction Timeline */}
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Chronological Telemetry Stream</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  {evidenceData.timeline?.length || 0} Artifacts
                </span>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {evidenceData.timeline?.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono font-bold ${item.type === 'alert' ? 'text-amber-400' : 'text-cyan-300'}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-300">{item.description}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Right Column: Structured Evidence & Analyst Notebook (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Analyst Documentation Notebook */}
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Analyst Findings & Evidence Notebook
                </h3>
                <button
                  onClick={handleSaveInvestigation}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 transition-all shadow-neon-cyan"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Findings</span>
                </button>
              </div>

              {/* Questions guide */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    1. Observed Artifacts & Investigation Notes
                  </label>
                  <textarea
                    rows={6}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Document attack vectors, source IPs, affected endpoints, and containment procedures..."
                    className="w-full glass-input rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    2. Resolution & Root-Cause Remediation Summary
                  </label>
                  <textarea
                    rows={4}
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                    placeholder="Document final containment outcome, firewall rules applied, and prevention steps..."
                    className="w-full glass-input rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed"
                  />
                </div>
              </div>
            </GlassCard>

            {/* Linked Alerts List */}
            <GlassCard className="p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-white/10 pb-2">
                Correlated Security Alerts ({evidenceData.alerts?.length || 0})
              </h3>
              <div className="space-y-2">
                {evidenceData.alerts?.map((al: any) => (
                  <div key={al.alert_id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono text-cyan-400 font-semibold">{al.alert_id}</span>
                      <p className="text-slate-300 font-medium truncate max-w-[200px]">{al.title}</p>
                    </div>
                    <Badge size="sm" variant={al.severity as any}>
                      {al.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      ) : (
        <GlassCard className="p-12 text-center text-slate-500">
          Select an incident to commence forensic analysis
        </GlassCard>
      )}
    </div>
  );
};
