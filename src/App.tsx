import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Layers, 
  Scissors, 
  Zap, 
  RefreshCw, 
  Video, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Trash2,
  Sparkles,
  Github,
  Globe
} from 'lucide-react';
import { ProcessedResult, ToolMode } from './types';
import { Navbar } from './components/Navbar';
import { SecurityBanner, SecurityModal } from './components/SecurityBanner';
import { PdfEditor } from './components/PdfEditor';
import { PdfMerger } from './components/PdfMerger';
import { PdfSplitter } from './components/PdfSplitter';
import { PdfCompressor } from './components/PdfCompressor';
import { PdfConverter } from './components/PdfConverter';
import { VideoConverter } from './components/VideoConverter';
import { DownloadModal } from './components/DownloadModal';
import { getSecurityStatus, releaseMemory } from './utils/security';

export default function App() {
  const [currentMode, setCurrentMode] = useState<ToolMode>('edit');
  const [processedResult, setProcessedResult] = useState<ProcessedResult | null>(null);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [activeMemoryBytes, setActiveMemoryBytes] = useState(0);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_theme');
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    localStorage.setItem('app_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleProcessComplete = (result: ProcessedResult) => {
    setProcessedResult(result);
    setIsDownloadOpen(true);
    const sec = getSecurityStatus();
    setActiveMemoryBytes(sec.activeMemoryBytes);
  };

  const handleWipeMemory = () => {
    releaseMemory();
    setProcessedResult(null);
    setIsDownloadOpen(false);
    setActiveMemoryBytes(0);
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-200 selection:bg-[#FFE600] selection:text-black ${
      isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-[#FAF8F5] text-black'
    }`}>
      {/* Top Header Navbar */}
      <Navbar
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
        onOpenSecurityModal={() => setIsSecurityOpen(true)}
        onClearMemory={handleWipeMemory}
        activeMemoryBytes={activeMemoryBytes}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* Security Banner */}
        <SecurityBanner onOpenModal={() => setIsSecurityOpen(true)} />

        {/* Hero Section Bar */}
        <div className="bg-white dark:bg-slate-900 border-4 border-black dark:border-slate-700 p-6 mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] relative overflow-hidden transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#FFE600] text-black border-2 border-black px-2.5 py-0.5 text-xs font-black uppercase mb-2">
                <Sparkles className="w-3.5 h-3.5" /> MEDIA & DOCUMENT SUITE
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black dark:text-white">
                {currentMode === 'edit' && 'VISUAL PDF EDITOR & MARKUP'}
                {currentMode === 'merge' && 'PDF MERGER ENGINE'}
                {currentMode === 'split' && 'PDF PAGE SPLITTER & EXTRACTOR'}
                {currentMode === 'compress' && 'PDF FILE COMPRESSOR'}
                {currentMode === 'convert' && 'MULTI-FORMAT CONVERTER (PPT, WORD, JPG)'}
                {currentMode === 'video' && 'VIDEO FORMAT CONVERTER LAB'}
              </h1>
              <p className="text-xs sm:text-sm font-bold font-mono text-slate-700 dark:text-slate-300 mt-1 max-w-2xl">
                {currentMode === 'edit' && 'Add text, drawing pen, shapes, rotate & delete pages with zero server uploads.'}
                {currentMode === 'merge' && 'Combine multiple PDFs into a single clean file with custom page order.'}
                {currentMode === 'split' && 'Extract specific pages or split pages into individual PDFs.'}
                {currentMode === 'compress' && 'Reduce PDF size up to 80% while retaining crisp visual clarity.'}
                {currentMode === 'convert' && 'Convert PDF to PowerPoint (PPT), Word (.docx), JPG/PNG images & back.'}
                {currentMode === 'video' && 'Convert MP4, WEBM, GIF, MP3 & WAV audio, trim duration & scale resolution.'}
              </p>
            </div>

            {/* Quick Feature Pills */}
            <div className="flex flex-wrap gap-2 text-xs font-mono font-bold text-black">
              <span className="bg-[#00FF66] border-2 border-black px-2.5 py-1">🔒 100% CLIENT-SIDE</span>
              <span className="bg-[#00E5FF] border-2 border-black px-2.5 py-1">⚡ INSTANT SPEED</span>
              <span className="bg-[#FF0055] text-white border-2 border-black px-2.5 py-1">0 BYTES STORED</span>
            </div>
          </div>
        </div>

        {/* Dynamic Tool Content */}
        {currentMode === 'edit' && <PdfEditor onComplete={handleProcessComplete} />}
        {currentMode === 'merge' && <PdfMerger onComplete={handleProcessComplete} />}
        {currentMode === 'split' && <PdfSplitter onComplete={handleProcessComplete} />}
        {currentMode === 'compress' && <PdfCompressor onComplete={handleProcessComplete} />}
        {currentMode === 'convert' && <PdfConverter onComplete={handleProcessComplete} />}
        {currentMode === 'video' && <VideoConverter onComplete={handleProcessComplete} />}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t-4 border-black dark:border-slate-800 mt-12 py-8 px-4 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-8 font-mono">
          {/* Main Footer Info */}
          <div className="flex flex-col md:flex-row w-full items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 font-bold">
              <span className="bg-black dark:bg-white text-[#FFE600] dark:text-black px-2 py-0.5">RAW</span>
              <span className="dark:text-white">PDF & MEDIA CONVERTER LAB</span>
            </div>

            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 font-bold">
              <button onClick={() => setIsSecurityOpen(true)} className="hover:underline flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" /> PRIVACY AUDIT
              </button>
              <span>•</span>
              <span>HIGH SECURITY CLIENT-SIDE ENGINE</span>
            </div>
          </div>

          {/* Developer Credits Section */}
          <div className="flex flex-col items-center gap-5 w-full pt-6 border-t-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="h-px w-8 sm:w-16 bg-slate-300 dark:bg-slate-700"></div>
              <span className="text-slate-500 dark:text-slate-400 text-sm font-bold">
                Developed by <span className="text-black dark:text-white">B A Fareed Ahamed</span>
              </span>
              <div className="h-px w-8 sm:w-16 bg-slate-300 dark:bg-slate-700"></div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a 
                href="https://github.com/fareedahamed0425-code" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-950 text-black dark:text-white border-2 border-black dark:border-slate-700 font-black text-xs hover:bg-[#FFE600] hover:text-black dark:hover:bg-[#FFE600] dark:hover:text-black dark:hover:border-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Github className="w-4 h-4" /> GITHUB
              </a>
              <a 
                href="https://bafareedahamedportfolio.netlify.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-950 text-black dark:text-white border-2 border-black dark:border-slate-700 font-black text-xs hover:bg-[#FFE600] hover:text-black dark:hover:bg-[#FFE600] dark:hover:text-black dark:hover:border-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Globe className="w-4 h-4" /> PORTFOLIO
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Download Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        result={processedResult}
        onClose={() => setIsDownloadOpen(false)}
        onReset={() => {
          setProcessedResult(null);
          setIsDownloadOpen(false);
        }}
      />

      {/* Security Info Modal */}
      <SecurityModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        onWipeMemory={handleWipeMemory}
      />
    </div>
  );
}
