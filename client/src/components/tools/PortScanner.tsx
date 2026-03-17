import React, { useState } from 'react';
import { api } from '../../api';
import { exportCSV } from '../../utils';
import { Search, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PortResult {
  port: number;
  status: string;
  service: string;
}

const PortScanner: React.FC = () => {
  const [target, setTarget] = useState('');
  const [ports, setPorts] = useState('1-1024');
  const [results, setResults] = useState<PortResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (!target) { toast.error('Enter a target IP/hostname'); return; }
    setLoading(true);
    setResults([]);
    try {
      const res = await api.portScan(target, ports);
      setResults(res.data);
      toast.success(`Found ${res.data.length} open ports`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Port scan failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Search className="text-cyan-400" size={24} />
        <h2 className="text-lg font-bold text-white">Port Scanner</h2>
      </div>

      <div className="tool-card">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Target IP / Hostname</label>
            <input type="text" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="192.168.1.1" className="w-full font-mono" />
          </div>
          <div className="w-48">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Port Range</label>
            <input type="text" value={ports} onChange={(e) => setPorts(e.target.value)} placeholder="1-1024" className="w-full font-mono" />
          </div>
          <button onClick={handleScan} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {loading ? 'Scanning...' : 'Scan'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="tool-card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-400">Open ports: <span className="text-cyan-400 font-semibold">{results.length}</span></span>
            <button onClick={() => exportCSV(results, 'port_scan')} className="btn-secondary flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
          </div>
          <div className="overflow-auto max-h-[500px] rounded-lg border border-[#1e293b]">
            <table className="data-table">
              <thead>
                <tr><th>Port</th><th>Status</th><th>Service</th></tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td className="font-mono">{r.port}</td>
                    <td><span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full text-xs font-semibold">{r.status}</span></td>
                    <td className="text-cyan-300">{r.service || '—'}</td>
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

export default PortScanner;
