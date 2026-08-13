import React, { useState } from 'react';
import { Layers, ArrowUp, ArrowDown, Trash2, Download, FileText, Plus } from 'lucide-react';
import { ProcessedResult } from '../types';
import { mergePDFs } from '../utils/pdfEngine';
import { FileUploader } from './FileUploader';
import { formatBytes } from '../utils/security';

interface PdfMergerProps {
  onComplete: (result: ProcessedResult) => void;
}

export const PdfMerger: React.FC<PdfMergerProps> = ({ onComplete }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesAdded = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= files.length) return;

    const updated = [...files];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setFiles(updated);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    try {
      const mergedBytes = await mergePDFs(files);
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      onComplete({
        blob,
        fileName: 'merged_document.pdf',
        fileSize: blob.size,
        type: 'application/pdf',
      });
    } catch (err) {
      console.error('Merge error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-4">
      {/* Header Banner */}
      <div className="bg-[#00E5FF] border-4 border-black p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-2xl font-black uppercase flex items-center gap-2">
          <Layers className="w-6 h-6" />
          MERGE MULTIPLE PDFs
        </h2>
        <p className="text-xs font-bold font-mono mt-1">
          Combine 2 or more PDF documents into a single seamlessly ordered file. Reorder documents easily.
        </p>
      </div>

      <FileUploader
        accept="application/pdf"
        multiple={true}
        title="ADD PDF FILES TO MERGE"
        subtitle="Select or drop multiple PDF files. Processed 100% locally."
        onFilesSelected={handleFilesAdded}
        iconType="pdf"
      />

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="bg-white border-4 border-black p-4 my-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <span className="font-black text-sm uppercase">
              QUEUED DOCUMENTS ({files.length})
            </span>
            <button
              onClick={() => setFiles([])}
              className="text-xs font-bold text-red-600 hover:underline uppercase"
            >
              CLEAR ALL
            </button>
          </div>

          <div className="space-y-2">
            {files.map((f, idx) => (
              <div
                key={`${f.name}-${idx}`}
                className="bg-amber-50 border-2 border-black p-3 flex flex-wrap items-center justify-between gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-black text-[#FFE600] font-mono font-black px-2 py-0.5 text-xs">
                    #{idx + 1}
                  </span>
                  <FileText className="w-5 h-5 text-black" />
                  <div>
                    <span className="font-bold text-sm block truncate max-w-xs">{f.name}</span>
                    <span className="text-xs font-mono text-slate-600">{formatBytes(f.size)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveFile(idx, 'up')}
                    disabled={idx === 0}
                    className="bg-white border border-black p-1 hover:bg-slate-100 disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => moveFile(idx, 'down')}
                    disabled={idx === files.length - 1}
                    className="bg-white border border-black p-1 hover:bg-slate-100 disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => removeFile(idx)}
                    className="bg-[#FF0055] text-white border border-black p-1 hover:bg-red-600 ml-2"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t-2 border-black flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-xs font-bold">
              Total Combined Size: {formatBytes(files.reduce((acc, f) => acc + f.size, 0))}
            </span>

            <button
              onClick={handleMerge}
              disabled={files.length < 2 || isProcessing}
              className="bg-[#00FF66] border-3 border-black px-6 py-3 font-black text-sm uppercase flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-300 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              {isProcessing ? 'MERGING PDFS...' : `MERGE ${files.length} PDFS NOW`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
