import React, { useState } from 'react';
import { api } from '../../api';
import { exportCSV } from '../../utils';
import { Radio, Download, Loader2, Play } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

interface PingResult {
  seq: number;
  status: string;
  rtt: number | null;
  ttl: number | null;
}

interface PingStats {
  sent: number;
  received: number;
  lost: number;
  lossPercent: string;
  min: string | null;
  max: string | null;
  avg: string | null;
}

const AdvancedPing: React.FC = () => {
  const [target, setTarget] = useState('');
  const [count, setCount] = useState('10');
  const [size, setSize] = useState('64');
  const [results, setResults] = useState<PingResult[]>([]);
  const [stats, setStats] = useState<PingStats | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePing = async () => {
    if (!target) { toast.error('Enter a target'); return; }
    setLoading(true);
    setResults([]);
    setStats(null);
    try {
      const res = await api.ping(target, parseInt(count), parseInt(size));
      setResults(res.data.results);
      setStats(res.data.stats);
      toast.success(`Ping complete: ${res.data.stats.received}/${res.data.stats.sent} received`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ping failed');
    } finally {
      setLoading(false);
    }
  };

  const chartData = results.map(r => ({
    seq: r.seq,
    RTT: r.rtt,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Radio className="text-cyan-400" size={24} />
        <h2 className="text-lg font-bold text-white">Advanced Ping</h2>
      </div>

      <div className="tool-card">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Target</label>
            <input type="text" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="8.8.8.8 or google.com" className="w-full font-mono" />
          </div>
          <div className="w-28">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Count</label>
            <input type="number" value={count} onChange={(e) => setCount(e.target.value)} min="1" max="100" className="w-full font-mono" />
          </div>
          <div className="w-28">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Size (bytes)</label>
            <input type="number" value={size} onChange={(e) => setSize(e.target.value)} min="1" max="65500" className="w-full font-mono" />
          </div>
          <button onClick={handlePing} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {loading ? 'Pinging...' : 'Ping'}
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Sent', value: stats.sent, color: 'text-white' },
            { label: 'Received', value: stats.received, color: 'text-green-400' },
            { label: 'Lost', value: stats.lost, color: 'text-red-400' },
            { label: 'Loss %', value: `${stats.lossPercent}%`, color: parseFloat(stats.lossPercent) > 0 ? 'text-red-400' : 'text-green-400' },
            { label: 'Min RTT', value: stats.min ? `${stats.min}ms` : '—', color: 'text-cyan-400' },
            { label: 'Avg RTT', value: stats.avg ? `${stats.avg}ms` : '—', color: 'text-cyan-400' },
            { label: 'Max RTT', value: stats.max ? `${stats.max}ms` : '—', color: 'text-cyan-400' },
          ].map((s, i) => (
            <div key={i} className="tool-card text-center">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">{s.label}</div>
              <div className={`text-lg font-mono font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {chartData.length > 0 && (
        <div className="tool-card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">RTT Chart</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="seq" tick={{ fill: '#64748b', fontSize: 11 }} label={{ value: 'Sequence', position: 'insideBottom', offset: -5, fill: '#64748b' }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} label={{ value: 'ms', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#0f1525', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
              <Line type="monotone" dataKey="RTT" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {results.length > 0 && (
        <div className="tool-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Results</h3>
            <button onClick={() => exportCSV(results, 'advanced_ping')} className="btn-secondary flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
          </div>
          <div className="overflow-auto max-h-[400px] rounded-lg border border-[#1e293b]">
            <table className="data-table">
              <thead><tr><th>Seq</th><th>Status</th><th>RTT (ms)</th><th>TTL</th></tr></thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td className="font-mono">{r.seq}</td>
                    <td><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.status === 'reply' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{r.status}</span></td>
                    <td className="font-mono">{r.rtt !== null ? `${r.rtt}` : '—'}</td>
                    <td className="font-mono">{r.ttl ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedPing;
