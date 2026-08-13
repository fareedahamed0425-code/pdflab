import React, { useState } from 'react';
import { Zap, Download, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ProcessedResult } from '../types';
import { compressPDF } from '../utils/pdfEngine';
import { FileUploader } from './FileUploader';
import { formatBytes } from '../utils/security';

interface PdfCompressorProps {
  onComplete: (result: ProcessedResult) => void;
}

export const PdfCompressor: React.FC<PdfCompressorProps> = ({ onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [isCompressing, setIsCompressing] = useState(false);

  const handleCompress = async () => {
    if (!file) return;
    setIsCompressing(true);

    try {
      const res = await compressPDF(file, level);
      const savingsPct = Math.max(0, Math.round(((res.originalSize - res.newSize) / res.originalSize) * 100));
      const blob = new Blob([res.bytes], { type: 'application/pdf' });

      onComplete({
        blob,
        fileName: `${file.name.replace(/\.[^/.]+$/, '')}_compressed.pdf`,
        fileSize: blob.size,
        originalSize: res.originalSize,
        type: 'application/pdf',
        savingsPercentage: savingsPct,
      });
    } catch (err) {
      console.error('Compression error:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-4">
      {/* Header */}
      <div className="bg-[#00FF66] border-4 border-black p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-2xl font-black uppercase flex items-center gap-2">
          <Zap className="w-6 h-6" />
          COMPRESS PDF FILE SIZE
        </h2>
        <p className="text-xs font-bold font-mono mt-1">
          Reduce PDF file size significantly while preserving document clarity and layout.
        </p>
      </div>

      {!file ? (
        <FileUploader
          accept="application/pdf"
          title="UPLOAD PDF TO COMPRESS"
          subtitle="Select PDF file to shrink size. Processed 100% locally."
          onFilesSelected={(files) => setFile(files[0])}
          iconType="pdf"
        />
      ) : (
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
          {/* File Selected */}
          <div className="bg-amber-50 border-2 border-black p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-black" />
              <div>
                <span className="font-bold text-sm block">{file.name}</span>
                <span className="text-xs font-mono text-slate-600">
                  Original File Size: {formatBytes(file.size)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setFile(null)}
              className="bg-slate-200 border border-black px-2 py-1 font-bold text-xs uppercase"
            >
              CHANGE FILE
            </button>
          </div>

          {/* Compression Presets */}
          <div>
            <h3 className="font-black text-xs uppercase mb-3">SELECT COMPRESSION RATIO:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setLevel('low')}
                className={`p-4 border-3 border-black text-left transition-all ${
                  level === 'low'
                    ? 'bg-[#FF0055] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1'
                    : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="font-black text-sm uppercase">EXTREME COMPRESSION</div>
                <div className="text-xs font-mono font-bold mt-1">~60-80% Smaller Size</div>
                <div className="text-[10px] opacity-90 mt-2">Maximum file reduction, optimized image resolution.</div>
              </button>

              <button
                onClick={() => setLevel('medium')}
                className={`p-4 border-3 border-black text-left transition-all ${
                  level === 'medium'
                    ? 'bg-[#FFE600] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1'
                    : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="font-black text-sm uppercase">RECOMMENDED (BALANCED)</div>
                <div className="text-xs font-mono font-bold mt-1">~40-60% Smaller Size</div>
                <div className="text-[10px] opacity-90 mt-2">Best balance between visual quality & file size.</div>
              </button>

              <button
                onClick={() => setLevel('high')}
                className={`p-4 border-3 border-black text-left transition-all ${
                  level === 'high'
                    ? 'bg-[#00E5FF] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1'
                    : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="font-black text-sm uppercase">LIGHT COMPRESSION</div>
                <div className="text-xs font-mono font-bold mt-1">~20-40% Smaller Size</div>
                <div className="text-[10px] opacity-90 mt-2">High image resolution preserved, light file cleanup.</div>
              </button>
            </div>
          </div>

          {/* Compress Button */}
          <button
            onClick={handleCompress}
            disabled={isCompressing}
            className="w-full bg-[#00FF66] border-3 border-black p-4 font-black text-base uppercase flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-300 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
          >
            <Zap className="w-6 h-6" />
            {isCompressing ? 'COMPRESSING PDF IN MEMORY...' : 'COMPRESS PDF NOW'}
          </button>
        </div>
      )}
    </div>
  );
};
