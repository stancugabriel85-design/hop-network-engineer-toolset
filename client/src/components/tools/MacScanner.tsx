import React, { useState } from 'react';
import { api } from '../../api';
import { exportCSV } from '../../utils';
import { Network, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface MacResult {
  ip: string;
  mac: string;
  manufacturer: string;
}

const MacScanner: React.FC = () => {
  const [subnet, setSubnet] = useState('192.168.1.1-254');
  const [results, setResults] = useState<MacResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    setLoading(true);
    setResults([]);
    try {
      const res = await api.macScan(subnet);
      setResults(res.data);
      toast.success(`Found ${res.data.length} devices`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'MAC scan failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Network className="text-cyan-400" size={24} />
        <h2 className="text-lg font-bold text-white">MAC Address Scanner</h2>
      </div>

      <div className="tool-card">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Subnet Range</label>
            <input type="text" value={subnet} onChange={(e) => setSubnet(e.target.value)} placeholder="192.168.1.1-254" className="w-full font-mono" />
          </div>
          <button onClick={handleScan} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Network size={16} />}
            {loading ? 'Scanning...' : 'Scan'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="tool-card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-400">Devices found: <span className="text-cyan-400 font-semibold">{results.length}</span></span>
            <button onClick={() => exportCSV(results, 'mac_scan')} className="btn-secondary flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
          </div>
          <div className="overflow-auto max-h-[500px] rounded-lg border border-[#1e293b]">
            <table className="data-table">
              <thead><tr><th>IP Address</th><th>MAC Address</th><th>Manufacturer</th></tr></thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td className="font-mono">{r.ip}</td>
                    <td className="font-mono text-cyan-300">{r.mac}</td>
                    <td>{r.manufacturer || '—'}</td>
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

export default MacScanner;
