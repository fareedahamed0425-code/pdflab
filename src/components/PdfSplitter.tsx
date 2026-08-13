import React, { useEffect, useState } from 'react';
import { Scissors, Download, CheckSquare, Square, FileText } from 'lucide-react';
import { PdfPageMeta, ProcessedResult } from '../types';
import { getPdfPagesMeta, splitPDF } from '../utils/pdfEngine';
import { FileUploader } from './FileUploader';
import { formatBytes } from '../utils/security';

interface PdfSplitterProps {
  onComplete: (result: ProcessedResult) => void;
}

export const PdfSplitter: React.FC<PdfSplitterProps> = ({ onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pagesMeta, setPagesMeta] = useState<PdfPageMeta[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [splitMode, setSplitMode] = useState<'selected' | 'all'>('selected');
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!file) return;

    let isMounted = true;
    setLoading(true);

    getPdfPagesMeta(file).then((meta) => {
      if (!isMounted) return;
      setPagesMeta(meta);
      setSelectedPages(meta.map((p) => p.pageNumber)); // Default select all
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [file]);

  const togglePageSelect = (pageNumber: number) => {
    if (selectedPages.includes(pageNumber)) {
      setSelectedPages(selectedPages.filter((p) => p !== pageNumber));
    } else {
      setSelectedPages([...selectedPages, pageNumber].sort((a, b) => a - b));
    }
  };

  const selectAll = () => {
    setSelectedPages(pagesMeta.map((p) => p.pageNumber));
  };

  const deselectAll = () => {
    setSelectedPages([]);
  };

  const handleSplit = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      if (splitMode === 'selected') {
        const results = await splitPDF(file, selectedPages);
        if (results.length > 0) {
          const res = results[0];
          const blob = new Blob([res.bytes], { type: 'application/pdf' });
          onComplete({
            blob,
            fileName: res.fileName,
            fileSize: blob.size,
            type: 'application/pdf',
          });
        }
      } else {
        // Split every page into separate file - combine into first page or zip
        const results = await splitPDF(file, []);
        if (results.length > 0) {
          const res = results[0];
          const blob = new Blob([res.bytes], { type: 'application/pdf' });
          onComplete({
            blob,
            fileName: res.fileName,
            fileSize: blob.size,
            type: 'application/pdf',
          });
        }
      }
    } catch (err) {
      console.error('Split error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="max-w-4xl mx-auto my-4">
        <div className="bg-[#FF55FF] border-4 border-black p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black uppercase flex items-center gap-2">
            <Scissors className="w-6 h-6" />
            SPLIT & EXTRACT PDF PAGES
          </h2>
          <p className="text-xs font-bold font-mono mt-1">
            Visual page extractor. Choose specific pages to extract into a new PDF or split pages apart.
          </p>
        </div>

        <FileUploader
          accept="application/pdf"
          title="UPLOAD PDF TO SPLIT"
          subtitle="Select PDF document. Page thumbnails will be generated locally."
          onFilesSelected={(files) => setFile(files[0])}
          iconType="pdf"
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto my-4">
      {/* Header Bar */}
      <div className="bg-white border-4 border-black p-4 mb-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="bg-black text-[#FF55FF] px-2 py-0.5 text-xs font-mono font-bold">
            SPLITTING DOCUMENT
          </span>
          <h3 className="font-black text-lg truncate max-w-sm">{file.name}</h3>
          <span className="text-xs font-mono text-slate-600">
            {pagesMeta.length} Pages • {formatBytes(file.size)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFile(null)}
            className="bg-slate-200 border-2 border-black px-3 py-2 font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-300"
          >
            CHANGE FILE
          </button>
        </div>
      </div>

      {/* Mode Controls */}
      <div className="bg-white border-4 border-black p-4 mb-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSplitMode('selected')}
            className={`px-3 py-1.5 font-black text-xs uppercase border-2 border-black ${
              splitMode === 'selected'
                ? 'bg-[#FFE600] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-slate-100'
            }`}
          >
            EXTRACT SELECTED PAGES ({selectedPages.length})
          </button>

          <button
            onClick={() => setSplitMode('all')}
            className={`px-3 py-1.5 font-black text-xs uppercase border-2 border-black ${
              splitMode === 'all'
                ? 'bg-[#FF55FF] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-slate-100'
            }`}
          >
            SPLIT EVERY PAGE INDIVIDUALLY
          </button>
        </div>

        {splitMode === 'selected' && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <button onClick={selectAll} className="bg-amber-100 border border-black px-2 py-1 font-bold">
              SELECT ALL
            </button>
            <button onClick={deselectAll} className="bg-slate-100 border border-black px-2 py-1 font-bold">
              DESELECT ALL
            </button>
          </div>
        )}
      </div>

      {/* Visual Page Thumbnails Grid */}
      {loading ? (
        <div className="bg-white border-4 border-black p-12 text-center font-mono font-bold text-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          GENERATING LOCAL PAGE THUMBNAILS...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          {pagesMeta.map((p) => {
            const isSelected = selectedPages.includes(p.pageNumber);
            return (
              <div
                key={p.pageNumber}
                onClick={() => togglePageSelect(p.pageNumber)}
                className={`border-3 border-black p-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#FFE600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1'
                    : 'bg-white opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1 font-mono text-xs font-bold">
                  <span>PAGE {p.pageNumber}</span>
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-black" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <div className="border-2 border-black bg-slate-100 aspect-3/4 overflow-hidden flex items-center justify-center">
                  {p.thumbnailUrl ? (
                    <img src={p.thumbnailUrl} alt={`Page ${p.pageNumber}`} className="w-full h-full object-contain" />
                  ) : (
                    <FileText className="w-8 h-8 text-slate-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Footer */}
      <div className="bg-[#00FF66] border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
        <span className="font-mono text-xs font-black uppercase">
          {splitMode === 'selected'
            ? `READY TO EXTRACT ${selectedPages.length} PAGES`
            : `READY TO SPLIT INTO ${pagesMeta.length} INDIVIDUAL FILES`}
        </span>

        <button
          onClick={handleSplit}
          disabled={isProcessing || (splitMode === 'selected' && selectedPages.length === 0)}
          className="bg-black text-white border-2 border-black px-6 py-3 font-black text-sm uppercase flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-5 h-5 text-[#00FF66]" />
          {isProcessing ? 'PROCESSING SPLIT...' : 'EXTRACT / SPLIT NOW'}
        </button>
      </div>
    </div>
  );
};
