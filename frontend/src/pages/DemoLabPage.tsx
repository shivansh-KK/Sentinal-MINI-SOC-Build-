import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Shield,
  Layers,
  Terminal,
  ExternalLink,
  Flame,
  ArrowRight,
} from 'lucide-react';
import api from '../services/api';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';

interface AttackScenario {
  id: string;
  title: string;
  category: string;
  ruleCode: string;
  mitre: string;
  severity: 'critical' | 'high' | 'medium';
  description: string;
  defaultHost: string;
  defaultIp: string;
  endpoint: string;
}

export const DemoLabPage: React.FC = () => {
  const [activeRunningId, setActiveRunningId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const scenarios: AttackScenario[] = [
    {
      id: 'brute-force',
      title: '1. SSH Brute-Force Authentication Attack',
      category: 'Authentication',
      ruleCode: 'DET-001',
      mitre: 'T1110 (Brute Force)',
      severity: 'high',
      description: 'Generates 6 rapid failed password attempts from 192.168.56.101 against ubuntu-lab-01.',
      defaultHost: 'ubuntu-lab-01',
      defaultIp: '192.168.56.101',
      endpoint: '/demo/simulate/brute-force',
    },
    {
      id: 'login-after-failed',
      title: '2. Compromised Account: Login After Failures',
      category: 'Credential Access',
      ruleCode: 'DET-002',
      mitre: 'T1078 (Valid Accounts)',
      severity: 'critical',
      description: 'Simulates 3 failed password attempts followed immediately by a successful authentication.',
      defaultHost: 'ubuntu-lab-01',
      defaultIp: '192.168.56.105',
      endpoint: '/demo/simulate/login-after-failed',
    },
    {
      id: 'port-scan',
      title: '3. Network Port Reconnaissance Scan',
      category: 'Network Discovery',
      ruleCode: 'DET-003',
      mitre: 'T1046 (Network Service Discovery)',
      severity: 'medium',
      description: 'Probes 8 distinct ports (21, 22, 23, 25, 80, 443, 3306, 8080) to detect scanning telemetry.',
      defaultHost: 'ubuntu-lab-02',
      defaultIp: '192.168.56.115',
      endpoint: '/demo/simulate/port-scan',
    },
    {
      id: 'suspicious-process',
      title: '4. Suspicious Reverse Shell Process Spawning',
      category: 'Process Execution',
      ruleCode: 'DET-005',
      mitre: 'T1059 (Command & Scripting)',
      severity: 'high',
      description: 'Spawns an interactive netcat reverse shell binary execution (nc -e /bin/bash).',
      defaultHost: 'ubuntu-lab-01',
      defaultIp: '192.168.56.150',
      endpoint: '/demo/simulate/suspicious-process',
    },
    {
      id: 'privilege-escalation',
      title: '5. Unauthorized Privilege Escalation (Sudo Abuse)',
      category: 'Privilege Escalation',
      ruleCode: 'DET-004',
      mitre: 'T1548 (Abuse Elevation Control)',
      severity: 'critical',
      description: 'Simulates guest user invoking root shell via unauthorized sudo execution token.',
      defaultHost: 'ubuntu-lab-01',
      defaultIp: '192.168.56.101',
      endpoint: '/demo/simulate/privilege-escalation',
    },
    {
      id: 'file-modification',
      title: '6. Critical File Integrity Breach (/etc/passwd)',
      category: 'File Integrity',
      ruleCode: 'DET-006',
      mitre: 'T1565 (Data Manipulation)',
      severity: 'high',
      description: 'Triggers cryptographic checksum alteration on monitored system credentials file.',
      defaultHost: 'ubuntu-lab-02',
      defaultIp: '192.168.56.20',
      endpoint: '/demo/simulate/file-modification',
    },
    {
      id: 'password-spray',
      title: '7. Multi-Account Password Spraying Campaign',
      category: 'Credential Access',
      ruleCode: 'DET-007',
      mitre: 'T1110.003 (Password Spraying)',
      severity: 'high',
      description: 'Single IP probes multiple distinct user accounts (administrator, backup_adm, dev_ops).',
      defaultHost: 'ubuntu-lab-01',
      defaultIp: '192.168.56.120',
      endpoint: '/demo/simulate/password-spray',
    },
  ];

  const handleLaunchSimulation = async (scenario: AttackScenario) => {
    setActiveRunningId(scenario.id);
    setLastResult(null);

    try {
      let queryParams = `?target_host=${scenario.defaultHost}`;
      if (scenario.id !== 'file-modification' && scenario.id !== 'privilege-escalation') {
        queryParams += `&attacker_ip=${scenario.defaultIp}`;
      }

      const res = await api.post(`${scenario.endpoint}${queryParams}`);
      setLastResult({
        ...res.data,
        scenarioTitle: scenario.title,
        ruleCode: scenario.ruleCode,
      });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Simulation execution failed');
    } finally {
      setActiveRunningId(null);
    }
  };

  const handleResetDemoData = async () => {
    const confirm = window.confirm(
      'Are you sure you want to reset all synthetic demo lab events and alerts? Baseline system logs will remain.'
    );
    if (!confirm) return;

    try {
      const res = await api.post('/demo/reset');
      setResetMessage(res.data.message);
      setLastResult(null);
      setTimeout(() => setResetMessage(null), 4000);
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
            <span>Demo Lab: Controlled Cyberattack Simulator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Capstone examination suite: Dispatch authentic security telemetry through the live ingestion, detection, and SOAR response engine
          </p>
        </div>

        <button
          onClick={handleResetDemoData}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 flex items-center gap-1.5 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Telemetry</span>
        </button>
      </div>

      {resetMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* Live Simulation Result Callout (When an attack has been triggered) */}
      {lastResult && (
        <GlassCard glow className="p-6 space-y-4 border-cyan-400/40 shadow-neon-cyan">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400 animate-bounce" />
              <h3 className="text-sm font-bold text-white">
                Live Attack Workflow Execution Complete
              </h3>
            </div>
            <span className="font-mono text-xs text-emerald-400 font-bold bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
              PIPELINE SUCCESS
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <p className="text-sm font-bold text-cyan-300">{lastResult.scenarioTitle}</p>
            <p className="text-slate-200">{lastResult.summary}</p>
          </div>

          {/* Workflow Stage Milestones */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <span className="text-slate-400 block text-[10px]">STAGE 1: INGEST</span>
              <span className="text-cyan-300 font-bold">Validated & Stored</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <span className="text-slate-400 block text-[10px]">STAGE 2: DETECT</span>
              <span className="text-amber-400 font-bold">{lastResult.ruleCode} Triggered</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <span className="text-slate-400 block text-[10px]">STAGE 3: CORRELATE</span>
              <span className="text-purple-400 font-bold">Incident Generated</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <span className="text-slate-400 block text-[10px]">STAGE 4: MITIGATE</span>
              <span className="text-emerald-400 font-bold">Playbook Executed</span>
            </div>
          </div>

          {/* Direct Links */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => navigate('/app/alerts')}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono flex items-center gap-1 font-semibold"
            >
              <span>View Generated Alert</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/app/incidents')}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-mono flex items-center gap-1 font-semibold"
            >
              <span>View Correlated Incident</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/app/dashboard')}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono flex items-center gap-1 font-semibold ml-auto"
            >
              <span>View On SOC Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>
      )}

      {/* 7 Attack Simulation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {scenarios.map((sc) => (
          <GlassCard key={sc.id} className="p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <Badge variant={sc.severity} size="sm">
                  {sc.severity.toUpperCase()}
                </Badge>
                <span className="font-mono text-xs text-cyan-400 font-bold">{sc.ruleCode}</span>
              </div>

              <h3 className="font-bold text-sm text-white mt-3 leading-snug">{sc.title}</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{sc.description}</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>MITRE Technique:</span>
                <span className="text-cyan-300">{sc.mitre}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Target Asset:</span>
                <span className="text-slate-200">{sc.defaultHost}</span>
              </div>

              <button
                disabled={activeRunningId === sc.id}
                onClick={() => handleLaunchSimulation(sc)}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-neon-cyan transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{activeRunningId === sc.id ? 'Simulating Vector...' : 'Simulate Attack'}</span>
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
