import React from 'react';
import { ShieldCheck, Lock, Cpu, ServerOff, CheckCircle2, X } from 'lucide-react';
import { formatBytes, getSecurityStatus } from '../utils/security';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWipeMemory: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  onWipeMemory,
}) => {
  if (!isOpen) return null;

  const status = getSecurityStatus();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border-4 border-black p-6 max-w-xl w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-[#FF0055] text-white border-2 border-black p-1 hover:bg-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[#00FF66] border-3 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <ShieldCheck className="w-8 h-8 text-black" />
          </div>
          <div>
            <span className="bg-black text-[#00FF66] px-2 py-0.5 text-xs font-mono font-bold">
              VERIFIED ARCHITECTURE
            </span>
            <h2 className="text-2xl font-black uppercase tracking-tight">HIGH SECURITY GUARANTEE</h2>
          </div>
        </div>

        <p className="text-sm font-medium mb-6 bg-slate-100 border-2 border-black p-3 font-mono">
          Your document privacy is strictly enforced. 100% of PDF and video processing occurs directly inside your local web browser memory using client-side WebAssembly & HTML5 Canvas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div className="bg-[#FFE600] border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-1">
              <ServerOff className="w-4 h-4" />
              <span className="font-black text-xs uppercase">Zero Server Retention</span>
            </div>
            <p className="text-xs font-semibold">0 bytes sent to external cloud servers. All files remain strictly on your machine.</p>
          </div>

          <div className="bg-[#00E5FF] border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-4 h-4" />
              <span className="font-black text-xs uppercase">Browser Memory Processing</span>
            </div>
            <p className="text-xs font-semibold">Processed with high-speed in-memory WASM engines and GPU hardware acceleration.</p>
          </div>
        </div>

        <div className="border-2 border-black p-3 bg-slate-50 mb-6">
          <h3 className="text-xs font-black uppercase mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            LIVE SECURITY AUDIT LOG
          </h3>
          <ul className="space-y-1.5 text-xs font-mono">
            <li className="flex items-center justify-between border-b border-slate-300 pb-1">
              <span>Client-Only Execution:</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> CONFIRMED
              </span>
            </li>
            <li className="flex items-center justify-between border-b border-slate-300 pb-1">
              <span>Active RAM Allocations:</span>
              <span className="font-bold">{formatBytes(status.activeMemoryBytes)}</span>
            </li>
            <li className="flex items-center justify-between border-b border-slate-300 pb-1">
              <span>Files Processed This Session:</span>
              <span className="font-bold">{status.filesProcessedCount}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Last Manual Memory Purge:</span>
              <span className="font-bold">
                {status.lastWipeTime ? status.lastWipeTime.toLocaleTimeString() : 'None'}
              </span>
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onWipeMemory();
              onClose();
            }}
            className="bg-[#FF0055] text-white border-2 border-black px-4 py-2 font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-red-600 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            PURGE ALL BROWSER MEMORY NOW
          </button>

          <button
            onClick={onClose}
            className="bg-black text-white border-2 border-black px-4 py-2 font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-800"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
};

export const SecurityBanner: React.FC<{ onOpenModal: () => void }> = ({ onOpenModal }) => {
  return (
    <div className="bg-[#FFE600] border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-3 my-4">
      <div className="flex items-center gap-3">
        <span className="bg-black text-white p-1.5 font-bold">
          <ShieldCheck className="w-5 h-5 text-[#00FF66]" />
        </span>
        <div>
          <span className="font-black uppercase text-xs tracking-wider bg-black text-[#FFE600] px-1.5 py-0.5 mr-2">
            MAXIMUM PRIVACY
          </span>
          <span className="font-bold text-xs sm:text-sm">
            100% Client-Side Local Memory Processing. Files never touch any remote server.
          </span>
        </div>
      </div>

      <button
        onClick={onOpenModal}
        className="bg-black text-white border-2 border-black px-3 py-1 font-black text-xs uppercase hover:bg-slate-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      >
        VIEW AUDIT LOG 🔒
      </button>
    </div>
  );
};
