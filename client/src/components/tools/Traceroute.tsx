import React, { useState } from 'react';
import { api } from '../../api';
import { exportCSV } from '../../utils';
import { Globe, Download, Loader2, Play } from 'lucide-react';
import toast from 'react-hot-toast';

interface Hop {
  hop: number;
  ip: string;
  hostname: string;
  rtt: number | null;
}

const Traceroute: React.FC = () => {
  const [target, setTarget] = useState('');
  const [results, setResults] = useState<Hop[]>([]);
  const [loading, setLoading] = useState(false);

  const handleTrace = async () => {
    if (!target) { toast.error('Enter a target'); return; }
    setLoading(true);
    setResults([]);
    try {
      const res = await api.traceroute(target);
      setResults(res.data);
      toast.success(`Traceroute complete: ${res.data.length} hops`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Traceroute failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Globe className="text-cyan-400" size={24} />
        <h2 className="text-lg font-bold text-white">Trace Route</h2>
      </div>

      <div className="tool-card">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Target</label>
            <input type="text" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="google.com" className="w-full font-mono" />
          </div>
          <button onClick={handleTrace} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {loading ? 'Tracing...' : 'Trace'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="tool-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Hops: {results.length}</h3>
            <button onClick={() => exportCSV(results, 'traceroute')} className="btn-secondary flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
          </div>
          <div className="overflow-auto max-h-[500px] rounded-lg border border-[#1e293b]">
            <table className="data-table">
              <thead><tr><th>Hop</th><th>IP Address</th><th>Hostname</th><th>RTT (ms)</th></tr></thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td className="font-mono text-cyan-400 font-semibold">{r.hop}</td>
                    <td className="font-mono">{r.ip}</td>
                    <td className="font-mono text-slate-400">{r.hostname !== r.ip ? r.hostname : '—'}</td>
                    <td className="font-mono">{r.rtt !== null ? `${r.rtt} ms` : '*'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Visual trace path */}
          <div className="mt-4 flex items-center gap-1 overflow-x-auto py-2">
            {results.map((r, i) => (
              <React.Fragment key={i}>
                <div className={`flex-shrink-0 px-2 py-1 rounded text-[10px] font-mono ${r.ip === '*' ? 'bg-slate-700 text-slate-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                  {r.ip === '*' ? '* * *' : r.ip}
                </div>
                {i < results.length - 1 && <div className="flex-shrink-0 text-slate-600">→</div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Traceroute;
