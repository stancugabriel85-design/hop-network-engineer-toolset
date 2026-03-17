import React, { useState } from 'react';
import { api } from '../../api';
import { exportCSV } from '../../utils';
import { Radar, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PingResult {
  ip: string;
  status: string;
  responseTime: number | null;
}

const PingSweep: React.FC = () => {
  const [range, setRange] = useState('192.168.1.1-254');
  const [results, setResults] = useState<PingResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    setLoading(true);
    setResults([]);
    try {
      const res = await api.pingSweep(range);
      setResults(res.data);
      const upCount = res.data.filter((r: PingResult) => r.status === 'up').length;
      toast.success(`Scan complete: ${upCount} hosts up out of ${res.data.length}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ping sweep failed');
    } finally {
      setLoading(false);
    }
  };

  const upCount = results.filter(r => r.status === 'up').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Radar className="text-cyan-400" size={24} />
        <h2 className="text-lg font-bold text-white">Ping Sweep</h2>
      </div>

      <div className="tool-card">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">IP Range</label>
            <input
              type="text"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              placeholder="192.168.1.1-254"
              className="w-full font-mono"
            />
          </div>
          <button onClick={handleScan} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Radar size={16} />}
            {loading ? 'Scanning...' : 'Scan'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="tool-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">
                Total: <span className="text-white font-semibold">{results.length}</span>
              </span>
              <span className="text-sm text-green-400">
                Up: <span className="font-semibold">{upCount}</span>
              </span>
              <span className="text-sm text-red-400">
                Down: <span className="font-semibold">{results.length - upCount}</span>
              </span>
            </div>
            <button onClick={() => exportCSV(results, 'ping_sweep')} className="btn-secondary flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
          </div>
          <div className="overflow-auto max-h-[500px] rounded-lg border border-[#1e293b]">
            <table className="data-table">
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Status</th>
                  <th>Response Time (ms)</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td className="font-mono">{r.ip}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        r.status === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'up' ? 'bg-green-400' : 'bg-red-400'}`} />
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="font-mono">{r.responseTime !== null ? `${r.responseTime} ms` : '—'}</td>
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

export default PingSweep;
