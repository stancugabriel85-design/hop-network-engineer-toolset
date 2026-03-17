import React, { useState, useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { Server, AlertTriangle, X, History } from 'lucide-react';
import { getSocket } from '../socket';
import axios from 'axios';

interface SSHSession {
  id: string;
  host: string;
  port: number;
  username: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  terminal: Terminal | null;
  fitAddon: FitAddon | null;
}

interface SSHHistory {
  id: number;
  host: string;
  port: number;
  username: string;
  last_connected: string;
}

const SSHTerminal: React.FC = () => {
  const [sessions, setSessions] = useState<SSHSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showConnectionForm, setShowConnectionForm] = useState(true);
  const [connectionHistory, setConnectionHistory] = useState<SSHHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Connection form state
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const terminalRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // Use shared socket connection
    socketRef.current = getSocket();

    // Load connection history
    loadConnectionHistory();

    return () => {
      // Don't disconnect shared socket, just clean up terminals
      sessions.forEach(session => {
        if (session.terminal) {
          session.terminal.dispose();
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on('ssh:output', ({ sessionId, data }: { sessionId: string; data: string }) => {
      const session = sessions.find(s => s.id === sessionId);
      if (session && session.terminal) {
        session.terminal.write(data);
      }
    });

    socketRef.current.on('ssh:status', ({ sessionId, status, message }: { sessionId: string; status: string; message: string }) => {
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, status: status as any }
          : s
      ));

      if (status === 'error') {
        setError(message);
      } else if (status === 'connected') {
        setError('');
        setShowConnectionForm(false);
      }
    });

    return () => {
      socketRef.current?.off('ssh:output');
      socketRef.current?.off('ssh:status');
    };
  }, [sessions]);

  const loadConnectionHistory = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/ssh/history');
      setConnectionHistory(response.data);
    } catch (err) {
      console.error('Failed to load SSH history:', err);
    }
  };

  const saveConnectionHistory = async (host: string, port: number, username: string) => {
    try {
      await axios.post('http://localhost:3001/api/ssh/save-history', { host, port, username });
      loadConnectionHistory();
    } catch (err) {
      console.error('Failed to save SSH history:', err);
    }
  };

  const createSession = (host: string, port: number, username: string, password: string) => {
    const sessionId = `ssh-${Date.now()}`;
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#000000',
        foreground: '#00ff00',
        cursor: '#00ff00',
        black: '#000000',
        red: '#ff0000',
        green: '#00ff00',
        yellow: '#ffff00',
        blue: '#0000ff',
        magenta: '#ff00ff',
        cyan: '#00ffff',
        white: '#ffffff',
      },
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    const newSession: SSHSession = {
      id: sessionId,
      host,
      port,
      username,
      status: 'connecting',
      terminal,
      fitAddon,
    };

    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(sessionId);

    // Wait for terminal to be mounted
    setTimeout(() => {
      const terminalElement = terminalRefs.current.get(sessionId);
      if (terminalElement && terminal) {
        terminal.open(terminalElement);
        fitAddon.fit();

        terminal.onData((data) => {
          if (socketRef.current) {
            socketRef.current.emit('ssh:input', { sessionId, data });
          }
        });

        terminal.onResize(({ rows, cols }) => {
          if (socketRef.current) {
            socketRef.current.emit('ssh:resize', { sessionId, rows, cols });
          }
        });

        // Connect via Socket.IO
        if (socketRef.current) {
          socketRef.current.emit('ssh:connect', {
            sessionId,
            host,
            port,
            username,
            password,
          });
        }

        // Save to history
        saveConnectionHistory(host, port, username);
      }
    }, 100);
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!host || !username || !password) {
      setError('Host, username, and password are required');
      return;
    }

    const portNum = parseInt(port) || 22;
    createSession(host, portNum, username, password);
    
    // Clear password for security
    setPassword('');
  };

  const handleDisconnect = (sessionId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('ssh:disconnect', { sessionId });
    }

    setSessions(prev => {
      const session = prev.find(s => s.id === sessionId);
      if (session && session.terminal) {
        session.terminal.dispose();
      }
      return prev.filter(s => s.id !== sessionId);
    });

    if (activeSessionId === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      setActiveSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
      if (remainingSessions.length === 0) {
        setShowConnectionForm(true);
      }
    }
  };

  const handleHistorySelect = (item: SSHHistory) => {
    setHost(item.host);
    setPort(item.port.toString());
    setUsername(item.username);
    setShowHistory(false);
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="flex flex-col h-full bg-[#0a0e1a]">
      {/* Warning Banner */}
      <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-3 mb-4">
        <div className="flex items-start gap-2">
          <AlertTriangle size={18} className="text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-yellow-200">
            <strong>Security Warning:</strong> Only connect to servers you own or have permission to access. 
            Passwords are never saved to disk.
          </div>
        </div>
      </div>

      {/* Session Tabs */}
      {sessions.length > 0 && (
        <div className="flex items-center gap-2 mb-4 border-b border-[#1e293b] pb-2">
          {sessions.map(session => (
            <div
              key={session.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-t cursor-pointer transition-colors ${
                activeSessionId === session.id
                  ? 'bg-[#151d32] text-cyan-400 border-b-2 border-cyan-400'
                  : 'bg-[#0c1120] text-slate-400 hover:bg-[#111827]'
              }`}
              onClick={() => setActiveSessionId(session.id)}
            >
              <Server size={14} />
              <span className="text-xs font-medium">{session.username}@{session.host}</span>
              <div className={`w-2 h-2 rounded-full ${
                session.status === 'connected' ? 'bg-green-500' :
                session.status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                session.status === 'error' ? 'bg-red-500' :
                'bg-slate-500'
              }`} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDisconnect(session.id);
                }}
                className="p-0.5 rounded hover:bg-slate-700 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Connection Form */}
      {showConnectionForm && (
        <div className="bg-[#0c1120] rounded-lg border border-[#1e293b] p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Server size={20} className="text-cyan-400" />
              SSH Connection
            </h3>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="btn-secondary text-xs flex items-center gap-1"
            >
              <History size={14} />
              History
            </button>
          </div>

          {showHistory && connectionHistory.length > 0 && (
            <div className="mb-4 bg-[#151d32] rounded border border-[#1e293b] p-3 max-h-40 overflow-y-auto">
              <div className="text-xs text-slate-400 mb-2">Recent Connections:</div>
              {connectionHistory.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleHistorySelect(item)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-[#1e293b] transition-colors text-xs text-slate-300 mb-1"
                >
                  {item.username}@{item.host}:{item.port}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleConnect} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Host</label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="192.168.1.1 or hostname"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Port</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="22"
                  className="input-field w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="root"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field w-full"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-xs text-red-400">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full">
              Connect
            </button>
          </form>
        </div>
      )}

      {/* Terminal Display */}
      {sessions.map(session => (
        <div
          key={session.id}
          className={`flex-1 ${activeSessionId === session.id ? 'block' : 'hidden'}`}
        >
          <div className="bg-black rounded-lg border border-[#1e293b] p-2 h-full">
            <div
              ref={(el) => {
                if (el) terminalRefs.current.set(session.id, el);
              }}
              className="h-full"
            />
          </div>
        </div>
      ))}

      {/* Empty State */}
      {sessions.length === 0 && !showConnectionForm && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Server size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">No active SSH sessions</p>
            <button
              onClick={() => setShowConnectionForm(true)}
              className="btn-primary"
            >
              New Connection
            </button>
          </div>
        </div>
      )}

      {/* Connection Controls */}
      {activeSession && activeSession.status === 'connected' && (
        <div className="mt-4 flex items-center justify-between bg-[#0c1120] rounded-lg border border-[#1e293b] p-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Connected to {activeSession.username}@{activeSession.host}:{activeSession.port}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConnectionForm(true)}
              className="btn-secondary text-xs"
            >
              New Session
            </button>
            <button
              onClick={() => handleDisconnect(activeSession.id)}
              className="btn-danger text-xs"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SSHTerminal;
