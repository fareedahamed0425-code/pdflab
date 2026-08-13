import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Download, CheckCircle2, Copy, FileCheck, X, RefreshCw } from 'lucide-react';
import { ProcessedResult } from '../types';
import { formatBytes } from '../utils/security';

interface DownloadModalProps {
  isOpen: boolean;
  result: ProcessedResult | null;
  onClose: () => void;
  onReset: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  result,
  onClose,
  onReset,
}) => {
  const [customName, setCustomName] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && result) {
      setCustomName(result.fileName);
      // Fire confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFE600', '#00E5FF', '#FF0055', '#00FF66'],
      });
    }
  }, [isOpen, result]);

  if (!isOpen || !result) return null;

  const handleDownload = () => {
    const finalFileName = customName.trim() || result.fileName;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-white border-4 border-black p-6 max-w-lg w-full shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-[#FF0055] text-white border-2 border-black p-1 hover:bg-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[#00FF66] border-3 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CheckCircle2 className="w-8 h-8 text-black" />
          </div>
          <div>
            <span className="bg-black text-[#00FF66] px-2 py-0.5 text-xs font-mono font-bold">
              READY FOR DOWNLOAD
            </span>
            <h2 className="text-2xl font-black uppercase tracking-tight">FILE PROCESSED!</h2>
          </div>
        </div>

        <div className="bg-[#FFE600] border-3 border-black p-4 mb-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <label className="block text-xs font-black uppercase mb-1">Rename File Before Download:</label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="w-full bg-white border-2 border-black px-3 py-2 font-mono text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden"
          />

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-white border border-black p-2">
              <span className="text-slate-600 block">Output File Size:</span>
              <span className="font-bold text-sm">{formatBytes(result.fileSize)}</span>
            </div>
            {result.originalSize && (
              <div className="bg-white border border-black p-2">
                <span className="text-slate-600 block">Original Size:</span>
                <span className="font-bold text-sm">{formatBytes(result.originalSize)}</span>
              </div>
            )}
          </div>

          {result.savingsPercentage !== undefined && result.savingsPercentage > 0 && (
            <div className="mt-2 bg-[#00FF66] border border-black p-1.5 text-center font-black text-xs uppercase">
              🎉 REDUCED BY {result.savingsPercentage}% IN FILE SIZE!
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleDownload}
            className="w-full bg-[#00FF66] border-3 border-black p-3 font-black text-base uppercase flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-300 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          >
            <Download className="w-6 h-6" />
            DOWNLOAD PROCESSED FILE NOW
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                handleDownload();
                onReset();
                onClose();
              }}
              className="flex-1 bg-[#00E5FF] border-2 border-black p-2.5 font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-cyan-300"
            >
              <RefreshCw className="w-4 h-4" />
              PROCESS ANOTHER FILE
            </button>

            <button
              onClick={onClose}
              className="bg-slate-200 border-2 border-black p-2.5 font-bold text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-300"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
