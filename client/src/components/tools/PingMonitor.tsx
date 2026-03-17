import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import { getSocket } from '../../socket';
import { Radio, Play, Square } from 'lucide-react';
import toast from 'react-hot-toast';

const PingMonitor: React.FC = () => {
  const [hostsInput, setHostsInput] = useState('');
  const [interval, setInterval_] = useState('5');
  const [monitoring, setMonitoring] = useState(false);
  const { pingUpdates, addPingUpdate, clearPingUpdates, addAlert } = useStore();

  const handleStart = useCallback(() => {
    const hosts = hostsInput.split(/[,\n]/).map(h => h.trim()).filter(Boolean);
    if (hosts.length === 0) { toast.error('Enter at least one host'); return; }

    const socket = getSocket();
    clearPingUpdates();
    socket.emit('monitor:subscribe', { hosts, interval: parseInt(interval) * 1000 });
    setMonitoring(true);
    toast.success(`Monitoring ${hosts.length} host(s)`);
  }, [hostsInput, interval, clearPingUpdates]);

  const handleStop = useCallback(() => {
    const socket = getSocket();
    socket.emit('monitor:unsubscribe');
    setMonitoring(false);
    toast.success('Monitoring stopped');
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = (data: any) => {
      addPingUpdate(data);
      if (data.status === 'down') {
        addAlert({ message: `Host ${data.host} is DOWN`, severity: 'critical', host: data.host, timestamp: data.timestamp });
      }
    };
    socket.on('ping:update', handleUpdate);
    return () => {
      socket.off('ping:update', handleUpdate);
      if (monitoring) {
        socket.emit('monitor:unsubscribe');
      }
    };
  }, [addPingUpdate, addAlert, monitoring]);

  const hosts = Object.keys(pingUpdates);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Radio className="text-cyan-400" size={24} />
        <h2 className="text-lg font-bold text-white">Ping Monitor</h2>
        {monitoring && <span className="flex items-center gap-1.5 text-xs text-green-400"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />LIVE</span>}
      </div>

      <div className="tool-card">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Hosts (comma or newline separated)</label>
            <textarea
              value={hostsInput}
              onChange={(e) => setHostsInput(e.target.value)}
              placeholder="192.168.1.1, 8.8.8.8, google.com"
              className="w-full font-mono h-20 resize-none"
            />
          </div>
          <div className="w-32">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Interval (sec)</label>
            <input type="number" value={interval} onChange={(e) => setInterval_(e.target.value)} min="1" max="60" className="w-full font-mono" />
          </div>
          {!monitoring ? (
            <button onClick={handleStart} className="btn-primary flex items-center gap-2"><Play size={16} /> Start</button>
          ) : (
            <button onClick={handleStop} className="btn-secondary flex items-center gap-2 !border-red-500/50 !text-red-400 hover:!bg-red-500/10"><Square size={16} /> Stop</button>
          )}
        </div>
      </div>

      {hosts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hosts.map(host => {
            const updates = pingUpdates[host] || [];
            const latest = updates[updates.length - 1];
            const isUp = latest?.status === 'up';
            return (
              <div key={host} className={`tool-card border-l-4 ${isUp ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-white font-semibold">{host}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${isUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${isUp ? 'bg-green-400' : 'bg-red-400'}`} />
                    {isUp ? 'UP' : 'DOWN'}
                  </span>
                </div>
                <div className="text-2xl font-mono font-bold text-white">
                  {latest?.rtt !== null && latest?.rtt !== undefined ? `${latest.rtt}ms` : '—'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {updates.length} pings | Last: {latest ? new Date(latest.timestamp).toLocaleTimeString() : '—'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PingMonitor;
