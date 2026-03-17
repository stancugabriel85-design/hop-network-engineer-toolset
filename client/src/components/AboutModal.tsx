import React from 'react';
import { X, Network } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-[#0f1525] border border-[#1e293b] rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b]">
          <h2 className="text-lg font-semibold text-white">About</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#1e293b] text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-8 text-center">
          <div className="inline-flex p-4 bg-cyan-500/10 rounded-2xl mb-6">
            <Network size={48} className="text-cyan-400" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2">
            Hop!
          </h3>
          
          <div className="space-y-1 mb-6">
            <p className="text-slate-300 text-sm">
              Gabriel Stancu — 2026
            </p>
            <p className="text-slate-400 text-xs">
              gabriel.stancu@live.com
            </p>
            <p className="text-slate-400 text-xs">
              Freeware License
            </p>
          </div>

          <div className="pt-4 border-t border-[#1e293b]">
            <p className="text-xs text-slate-500">
              Professional network diagnostics and monitoring dashboard
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0a0e1a] border-t border-[#1e293b] flex justify-center">
          <button
            onClick={onClose}
            className="btn-primary px-6"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
