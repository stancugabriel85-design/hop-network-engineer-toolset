import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import { getSocket } from '../../socket';
import { BarChart3, Play, Square } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const BandwidthMonitor: React.FC = () => {
  const [ip, setIp] = useState('');
  const [community, setCommunity] = useState('public');
  const [ifIndex, setIfIndex] = useState('1');
  const [interval, setInterval_] = useState('5');
  const [monitoring, setMonitoring] = useState(false);
  const { bandwidthUpdates, addBandwidthUpdate, clearBandwidthUpdates } = useStore();

  const handleStart = useCallback(() => {
    if (!ip) { toast.error('Enter target IP'); return; }
    const socket = getSocket();
    clearBandwidthUpdates();
    socket.emit('bandwidth:subscribe', { ip, community, ifIndex: parseInt(ifIndex), interval: parseInt(interval) * 1000 });
    setMonitoring(true);
    toast.success('Bandwidth monitoring started');
  }, [ip, community, ifIndex, interval, clearBandwidthUpdates]);

  const handleStop = useCallback(() => {
    const socket = getSocket();
    socket.emit('monitor:unsubscribe');
    setMonitoring(false);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = (data: any) => addBandwidthUpdate(data);
    socket.on('bandwidth:update', handleUpdate);
    return () => {
      socket.off('bandwidth:update', handleUpdate);
      if (monitoring) socket.emit('monitor:unsubscribe');
    };
  }, [addBandwidthUpdate, monitoring]);

  const chartData = bandwidthUpdates.map(u => ({
    time: new Date(u.timestamp).toLocaleTimeString(),
    'In (Mbps)': u.inMbps,
    'Out (Mbps)': u.outMbps,
  }));

  const latest = bandwidthUpdates[bandwidthUpdates.length - 1];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <BarChart3 className="text-cyan-400" size={24} />
        <h2 className="text-lg font-bold text-white">Bandwidth Monitor</h2>
        {monitoring && <span className="flex items-center gap-1.5 text-xs text-green-400"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />LIVE</span>}
      </div>

      <div className="tool-card">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Target IP</label>
            <input type="text" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.1" className="w-full font-mono" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Community String</label>
            <input type="text" value={community} onChange={(e) => setCommunity(e.target.value)} className="w-full font-mono" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Interface Index</label>
            <input type="number" value={ifIndex} onChange={(e) => setIfIndex(e.target.value)} min="1" className="w-full font-mono" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Interval (sec)</label>
            <input type="number" value={interval} onChange={(e) => setInterval_(e.target.value)} min="1" className="w-full font-mono" />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          {!monitoring ? (
            <button onClick={handleStart} className="btn-primary flex items-center gap-2"><Play size={16} /> Start</button>
          ) : (
            <button onClick={handleStop} className="btn-secondary flex items-center gap-2 !border-red-500/50 !text-red-400"><Square size={16} /> Stop</button>
          )}
        </div>
      </div>

      {latest && (
        <div className="grid grid-cols-2 gap-4">
          <div className="tool-card text-center">
            <div className="text-xs text-slate-400 mb-1">Inbound</div>
            <div className="text-3xl font-mono font-bold text-green-400">{latest.inMbps.toFixed(3)}</div>
            <div className="text-xs text-slate-500">Mbps</div>
          </div>
          <div className="tool-card text-center">
            <div className="text-xs text-slate-400 mb-1">Outbound</div>
            <div className="text-3xl font-mono font-bold text-cyan-400">{latest.outMbps.toFixed(3)}</div>
            <div className="text-xs text-slate-500">Mbps</div>
          </div>
        </div>
      )}

      {chartData.length > 1 && (
        <div className="tool-card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Bandwidth History</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f1525', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
              <Area type="monotone" dataKey="In (Mbps)" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="Out (Mbps)" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default BandwidthMonitor;
