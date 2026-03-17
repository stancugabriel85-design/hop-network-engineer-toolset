import React, { useState } from 'react';
import { useStore } from '../store';
import { Network, Bell, X, Info } from 'lucide-react';
import AboutModal from './AboutModal';

const TopBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, removeTab, unacknowledgedAlerts } = useStore();
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div className="bg-[#0c1120] border-b border-[#1e293b]">
      {/* App Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e293b]">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-cyan-500/10 rounded-lg">
            <Network size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">Hop!</h1>
            <p className="text-[10px] text-slate-500">Network Engineer Toolset</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAbout(true)}
            className="p-1.5 rounded-lg hover:bg-[#1e293b] text-slate-400 hover:text-cyan-400 transition-colors"
            title="About"
          >
            <Info size={18} />
          </button>
          <div className="relative">
            <Bell size={18} className="text-slate-400" />
            {unacknowledgedAlerts > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unacknowledgedAlerts > 9 ? '9+' : unacknowledgedAlerts}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      {tabs.length > 0 && (
        <div className="flex items-center overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium cursor-pointer border-r border-[#1e293b] transition-colors whitespace-nowrap ${
                activeTabId === tab.id
                  ? 'bg-[#151d32] text-cyan-400 border-b-2 border-b-cyan-400'
                  : 'text-slate-400 hover:bg-[#111827] hover:text-slate-300'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTab(tab.id);
                }}
                className="p-0.5 rounded hover:bg-slate-700 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* About Modal */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
};

export default TopBar;
