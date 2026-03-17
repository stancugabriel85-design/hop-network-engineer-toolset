import React, { useState, useCallback } from 'react';
import { generatePassword } from '../../utils';
import { Lock, Copy, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const PasswordGenerator: React.FC = () => {
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const generate = useCallback(() => {
    const pwd = generatePassword(length, { uppercase, lowercase, numbers, symbols });
    setPassword(pwd);
    setHistory(prev => [pwd, ...prev].slice(0, 10));
  }, [length, uppercase, lowercase, numbers, symbols]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (!pwd) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (pwd.length >= 16) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { label: 'Weak', color: 'bg-red-500', width: '25%' };
    if (score <= 4) return { label: 'Fair', color: 'bg-yellow-500', width: '50%' };
    if (score <= 5) return { label: 'Good', color: 'bg-blue-500', width: '75%' };
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const strength = getStrength(password);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Lock className="text-cyan-400" size={24} />
        <h2 className="text-lg font-bold text-white">Password Generator</h2>
      </div>

      <div className="tool-card">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Length: {length}</label>
            <input
              type="range"
              min="4"
              max="128"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>4</span><span>128</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {[
              { label: 'Uppercase (A-Z)', checked: uppercase, set: setUppercase },
              { label: 'Lowercase (a-z)', checked: lowercase, set: setLowercase },
              { label: 'Numbers (0-9)', checked: numbers, set: setNumbers },
              { label: 'Symbols (!@#$)', checked: symbols, set: setSymbols },
            ].map((opt, i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={opt.checked} onChange={(e) => opt.set(e.target.checked)} className="accent-cyan-500" />
                {opt.label}
              </label>
            ))}
          </div>

          <button onClick={generate} className="btn-primary flex items-center gap-2">
            <RefreshCw size={16} /> Generate
          </button>
        </div>
      </div>

      {password && (
        <div className="tool-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 bg-[#0a0e1a] rounded-lg p-4 font-mono text-lg text-green-400 break-all select-all">
              {password}
            </div>
            <button onClick={() => copyToClipboard(password)} className="btn-primary p-3">
              <Copy size={18} />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Strength</span>
              <span className={`font-semibold ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</span>
            </div>
            <div className="h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
              <div className={`h-full ${strength.color} rounded-full transition-all duration-300`} style={{ width: strength.width }} />
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="tool-card">
          <h3 className="text-xs font-semibold text-slate-400 mb-3">History (this session)</h3>
          <div className="space-y-1">
            {history.map((pwd, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="font-mono text-slate-300 flex-1 truncate">{pwd}</span>
                <button onClick={() => copyToClipboard(pwd)} className="text-slate-500 hover:text-cyan-400 transition-colors p-1">
                  <Copy size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordGenerator;
