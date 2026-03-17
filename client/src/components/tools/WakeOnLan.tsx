import React, { useState } from 'react';
import { api } from '../../api';
import { Zap, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const WakeOnLan: React.FC = () => {
  const [mac, setMac] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ mac: string; time: string; success: boolean }[]>([]);

  const handleWake = async () => {
    if (!mac) { toast.error('Enter a MAC address'); return; }
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(mac)) { toast.error('Invalid MAC address format (use XX:XX:XX:XX:XX:XX)'); return; }

    setLoading(true);
    try {
      await api.wol(mac);
      toast.success(`Magic packet sent to ${mac}`);
      setHistory(prev => [{ mac, time: new Date().toLocaleTimeString(), success: true }, ...prev].slice(0, 20));
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Wake-on-LAN failed');
      setHistory(prev => [{ mac, time: new Date().toLocaleTimeString(), success: false }, ...prev].slice(0, 20));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Zap className="text-cyan-400" size={24} />
        <h2 className="text-lg font-bold text-white">Wake-on-LAN</h2>
      </div>

      <div className="tool-card">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">MAC Address</label>
            <input
              type="text"
              value={mac}
              onChange={(e) => setMac(e.target.value)}
              placeholder="AA:BB:CC:DD:EE:FF"
              className="w-full font-mono uppercase"
            />
          </div>
          <button onClick={handleWake} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {loading ? 'Sending...' : 'Wake'}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Sends a Wake-on-LAN Magic Packet to the specified MAC address. The target device must support WoL and be on the same network segment.
        </p>
      </div>

      {history.length > 0 && (
        <div className="tool-card">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Wake Attempts</h3>
          <div className="overflow-auto rounded-lg border border-[#1e293b]">
            <table className="data-table">
              <thead><tr><th>MAC Address</th><th>Time</th><th>Status</th></tr></thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td className="font-mono">{h.mac}</td>
                    <td className="text-slate-400">{h.time}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${h.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {h.success ? 'Sent' : 'Failed'}
                      </span>
                    </td>
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

export default WakeOnLan;
