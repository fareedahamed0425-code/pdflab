import React from 'react';
import { 
  FileText, 
  Layers, 
  Scissors, 
  Zap, 
  RefreshCw, 
  Video, 
  ShieldCheck, 
  Trash2,
  Sun,
  Moon
} from 'lucide-react';
import { ToolMode } from '../types';

interface NavbarProps {
  currentMode: ToolMode;
  onSelectMode: (mode: ToolMode) => void;
  onOpenSecurityModal: () => void;
  onClearMemory: () => void;
  activeMemoryBytes: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  onOpenSecurityModal,
  onClearMemory,
  activeMemoryBytes,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const navItems: { mode: ToolMode; label: string; icon: React.ReactNode; color: string }[] = [
    { mode: 'edit', label: 'EDIT PDF', icon: <FileText className="w-4 h-4" />, color: 'bg-[#FFE600]' },
    { mode: 'merge', label: 'MERGE', icon: <Layers className="w-4 h-4" />, color: 'bg-[#00E5FF]' },
    { mode: 'split', label: 'SPLIT', icon: <Scissors className="w-4 h-4" />, color: 'bg-[#FF55FF]' },
    { mode: 'compress', label: 'COMPRESS', icon: <Zap className="w-4 h-4" />, color: 'bg-[#00FF66]' },
    { mode: 'convert', label: 'CONVERT', icon: <RefreshCw className="w-4 h-4" />, color: 'bg-yellow-300' },
    { mode: 'video', label: 'VIDEO LAB', icon: <Video className="w-4 h-4" />, color: 'bg-[#FF3E3E] text-white' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b-4 border-black dark:border-slate-700 px-4 py-3 shadow-[0_4px_0_0_rgba(0,0,0,1)] transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="bg-[#FFE600] border-3 border-black p-2 font-black text-xl tracking-tighter shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
            <span className="bg-black text-[#FFE600] px-2 py-0.5 text-xs font-mono">RAW</span>
            <span className="text-black">PDF & MEDIA LAB</span>
          </div>

          <button
            onClick={onOpenSecurityModal}
            className="flex items-center gap-1.5 bg-[#00FF66] border-2 border-black px-2.5 py-1 text-xs font-bold uppercase hover:bg-emerald-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer text-black"
            title="100% Local Memory - Zero Cloud Retention"
          >
            <ShieldCheck className="w-4 h-4 text-black" />
            <span className="hidden sm:inline">100% LOCAL & SECURE</span>
            <span className="sm:hidden">SECURE</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap items-center justify-center gap-2">
          {navItems.map((item) => {
            const isActive = currentMode === item.mode;
            return (
              <button
                key={item.mode}
                onClick={() => onSelectMode(item.mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-black text-xs uppercase border-2 border-black transition-all cursor-pointer ${
                  isActive
                    ? `${item.color} shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5`
                    : 'bg-white dark:bg-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Side Controls: Mode Toggle & Wipe Memory */}
        <div className="flex items-center gap-2">
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            className="flex items-center gap-1.5 bg-black text-white dark:bg-yellow-400 dark:text-black border-2 border-black px-3 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:scale-105 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-black fill-black" />
                <span>LIGHT MODE</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>DARK MODE</span>
              </>
            )}
          </button>

          {activeMemoryBytes > 0 && (
            <button
              onClick={onClearMemory}
              className="flex items-center gap-1 bg-[#FF0055] text-white border-2 border-black px-2.5 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-600 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
              title="Purge active browser memory"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>WIPE</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
