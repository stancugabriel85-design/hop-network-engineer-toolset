import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import { getSocket } from '../../socket';
import { Activity, Play, Square } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#22d3ee', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];

const RttMonitor: React.FC = () => {
  const [hostsInput, setHostsInput] = useState('');
  const [interval, setInterval_] = useState('5');
  const [monitoring, setMonitoring] = useState(false);
  const { pingUpdates, addPingUpdate, clearPingUpdates } = useStore();

  const handleStart = useCallback(() => {
    const hosts = hostsInput.split(/[,\n]/).map(h => h.trim()).filter(Boolean);
    if (hosts.length === 0) { toast.error('Enter at least one host'); return; }
    const socket = getSocket();
    clearPingUpdates();
    socket.emit('monitor:subscribe', { hosts, interval: parseInt(interval) * 1000 });
    setMonitoring(true);
    toast.success(`RTT monitoring ${hosts.length} host(s)`);
  }, [hostsInput, interval, clearPingUpdates]);

  const handleStop = useCallback(() => {
    const socket = getSocket();
    socket.emit('monitor:unsubscribe');
    setMonitoring(false);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = (data: any) => addPingUpdate(data);
    socket.on('ping:update', handleUpdate);
    return () => {
      socket.off('ping:update', handleUpdate);
      if (monitoring) socket.emit('monitor:unsubscribe');
    };
  }, [addPingUpdate, monitoring]);

  const hosts = Object.keys(pingUpdates);

  // Build chart data: merge all hosts' timestamps
  const allTimestamps = new Set<number>();
  hosts.forEach(h => (pingUpdates[h] || []).forEach(u => allTimestamps.add(u.timestamp)));
  const sortedTimestamps = Array.from(allTimestamps).sort();

  const chartData = sortedTimestamps.map(ts => {
    const point: any = { time: new Date(ts).toLocaleTimeString() };
    hosts.forEach(h => {
      const update = (pingUpdates[h] || []).find(u => u.timestamp === ts);
      point[h] = update?.rtt ?? null;
    });
    return point;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Activity className="text-cyan-400" size={24} />
        <h2 className="text-lg font-bold text-white">Response Time Monitor</h2>
        {monitoring && <span className="flex items-center gap-1.5 text-xs text-green-400"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />LIVE</span>}
      </div>

      <div className="tool-card">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Hosts (comma separated)</label>
            <input type="text" value={hostsInput} onChange={(e) => setHostsInput(e.target.value)} placeholder="8.8.8.8, 1.1.1.1, google.com" className="w-full font-mono" />
          </div>
          <div className="w-32">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Interval (sec)</label>
            <input type="number" value={interval} onChange={(e) => setInterval_(e.target.value)} min="1" max="60" className="w-full font-mono" />
          </div>
          {!monitoring ? (
            <button onClick={handleStart} className="btn-primary flex items-center gap-2"><Play size={16} /> Start</button>
          ) : (
            <button onClick={handleStop} className="btn-secondary flex items-center gap-2 !border-red-500/50 !text-red-400"><Square size={16} /> Stop</button>
          )}
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="tool-card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">RTT History (ms)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f1525', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
              <Legend />
              {hosts.map((h, i) => (
                <Line key={h} type="monotone" dataKey={h} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default RttMonitor;
