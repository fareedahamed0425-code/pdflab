import React, { useState } from 'react';
import { RefreshCw, FileText, Download, Image as ImageIcon, Presentation, FileCode, CheckCircle2, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { PdfTargetFormat, ProcessedResult } from '../types';
import { 
  convertImagesToPdf, 
  convertPdfToImages, 
  convertPdfToPPT, 
  convertPdfToWord,
  convertOfficeToPdf
} from '../utils/pdfEngine';
import { FileUploader } from './FileUploader';
import { formatBytes } from '../utils/security';

interface PdfConverterProps {
  onComplete: (result: ProcessedResult) => void;
}

export const PdfConverter: React.FC<PdfConverterProps> = ({ onComplete }) => {
  const [direction, setDirection] = useState<'pdf-to-other' | 'other-to-pdf'>('pdf-to-other');
  const [targetFormat, setTargetFormat] = useState<PdfTargetFormat>('ppt');
  const [files, setFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);

  const handleFilesSelected = (newFiles: File[]) => {
    if (direction === 'other-to-pdf') {
      setFiles((prev) => [...prev, ...newFiles]);
    } else {
      setFiles([newFiles[0]]);
    }
  };

  const moveFileUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    setFiles(newFiles);
  };

  const moveFileDown = (index: number) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
    setFiles(newFiles);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsConverting(true);

    try {
      const file = files[0];
      const baseName = file.name.replace(/\.[^/.]+$/, '');

      if (direction === 'pdf-to-other') {
        if (targetFormat === 'ppt') {
          const blob = await convertPdfToPPT(file);
          onComplete({
            blob,
            fileName: `${baseName}_presentation.pptx`,
            fileSize: blob.size,
            type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          });
        } else if (targetFormat === 'docx') {
          const blob = await convertPdfToWord(file);
          onComplete({
            blob,
            fileName: `${baseName}_document.docx`,
            fileSize: blob.size,
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          });
        } else if (targetFormat === 'jpg' || targetFormat === 'png') {
          const images = await convertPdfToImages(file, targetFormat);
          if (images.length > 0) {
            const firstImg = images[0];
            onComplete({
              blob: firstImg.blob,
              fileName: `${baseName}_page_1.${targetFormat}`,
              fileSize: firstImg.blob.size,
              type: targetFormat === 'jpg' ? 'image/jpeg' : 'image/png',
            });
          }
        }
      } else {
        // Converting Images/Text/Office to PDF
        let pdfBytes: Uint8Array;
        
        // If files are office docs, we use the office to pdf converter
        const isOfficeDoc = files.some(f => 
          f.name.endsWith('.docx') || f.name.endsWith('.pptx') || f.name.endsWith('.ppt')
        );
        
        if (isOfficeDoc) {
          pdfBytes = await convertOfficeToPdf(files);
        } else {
          pdfBytes = await convertImagesToPdf(files);
        }
        
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        onComplete({
          blob,
          fileName: `${baseName}_converted.pdf`,
          fileSize: blob.size,
          type: 'application/pdf',
        });
      }
    } catch (err) {
      console.error('Conversion error:', err);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-4">
      {/* Header Banner */}
      <div className="bg-[#FF9900] border-4 border-black p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-2xl font-black uppercase flex items-center gap-2">
          <RefreshCw className="w-6 h-6" />
          UNIVERSAL PDF FORMAT CONVERTER
        </h2>
        <p className="text-xs font-bold font-mono mt-1">
          Convert PDF documents into PPT (PowerPoint), Word (.docx), JPG/PNG images, or convert Images/TXT into PDF.
        </p>
      </div>

      {/* Direction & Target Selector */}
      <div className="bg-white border-4 border-black p-4 mb-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDirection('pdf-to-other');
              setFiles([]);
            }}
            className={`px-4 py-2 font-black text-xs uppercase border-2 border-black ${
              direction === 'pdf-to-other'
                ? 'bg-[#FFE600] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-slate-100'
            }`}
          >
            PDF ➔ OTHER FORMATS (PPT, WORD, JPG)
          </button>

          <button
            onClick={() => {
              setDirection('other-to-pdf');
              setFiles([]);
            }}
            className={`px-4 py-2 font-black text-xs uppercase border-2 border-black ${
              direction === 'other-to-pdf'
                ? 'bg-[#00E5FF] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-slate-100'
            }`}
          >
            FILES (JPG, PPT, WORD) ➔ PDF
          </button>
        </div>

        {direction === 'pdf-to-other' && (
          <div>
            <label className="font-black text-xs uppercase block mb-2">TARGET FORMAT:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setTargetFormat('ppt')}
                className={`p-3 border-2 border-black font-black text-xs uppercase flex items-center justify-center gap-2 ${
                  targetFormat === 'ppt' ? 'bg-[#FF0055] text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-50'
                }`}
              >
                <Presentation className="w-4 h-4" />
                PPT (POWERPOINT)
              </button>

              <button
                onClick={() => setTargetFormat('docx')}
                className={`p-3 border-2 border-black font-black text-xs uppercase flex items-center justify-center gap-2 ${
                  targetFormat === 'docx' ? 'bg-[#00E5FF] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-50'
                }`}
              >
                <FileCode className="w-4 h-4" />
                WORD (.DOCX)
              </button>

              <button
                onClick={() => setTargetFormat('jpg')}
                className={`p-3 border-2 border-black font-black text-xs uppercase flex items-center justify-center gap-2 ${
                  targetFormat === 'jpg' ? 'bg-[#00FF66] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-50'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                JPG IMAGE
              </button>

              <button
                onClick={() => setTargetFormat('png')}
                className={`p-3 border-2 border-black font-black text-xs uppercase flex items-center justify-center gap-2 ${
                  targetFormat === 'png' ? 'bg-[#FFE600] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-50'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                PNG IMAGE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* File Uploader */}
      {files.length === 0 ? (
        <FileUploader
          accept={direction === 'pdf-to-other' ? 'application/pdf' : 'image/*,.txt,.ppt,.pptx,.docx'}
          title={direction === 'pdf-to-other' ? 'UPLOAD PDF TO CONVERT' : 'UPLOAD FILES (JPG, PPT, DOCX)'}
          multiple={direction === 'other-to-pdf'}
          subtitle={
            direction === 'pdf-to-other'
              ? `Target Format: ${targetFormat.toUpperCase()}`
              : 'Select JPG, PNG, TXT, PPTX or DOCX files to convert to PDF.'
          }
          onFilesSelected={handleFilesSelected}
          iconType={direction === 'pdf-to-other' ? 'pdf' : 'image'}
        />
      ) : (
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
          {direction === 'pdf-to-other' ? (
            <div className="bg-amber-50 border-2 border-black p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-black" />
                <div>
                  <span className="font-bold text-sm block truncate max-w-xs sm:max-w-md">{files[0]?.name}</span>
                  <span className="text-xs font-mono text-slate-600">{formatBytes(files[0]?.size || 0)}</span>
                </div>
              </div>

              <button
                onClick={() => setFiles([])}
                className="bg-slate-200 border border-black px-2 py-1 font-bold text-xs uppercase hover:bg-slate-300"
              >
                CHANGE FILE
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-sm uppercase">SELECTED FILES ({files.length})</h3>
                <div className="flex gap-2">
                  <label className="cursor-pointer bg-[#FFE600] border-2 border-black px-3 py-1 font-bold text-xs uppercase hover:bg-amber-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    ADD MORE
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*,.txt,.ppt,.pptx,.docx" 
                      onChange={(e) => {
                        if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                        e.target.value = '';
                      }} 
                      className="hidden" 
                    />
                  </label>
                  <button
                    onClick={() => setFiles([])}
                    className="bg-slate-200 border-2 border-black px-3 py-1 font-bold text-xs uppercase hover:bg-slate-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    CLEAR ALL
                  </button>
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="bg-amber-50 border-2 border-black p-2 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {file.type.includes('image') ? (
                        <ImageIcon className="w-5 h-5 text-black shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-black shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="font-bold text-sm block truncate max-w-[150px] sm:max-w-xs">{file.name}</span>
                        <span className="text-xs font-mono text-slate-600">{formatBytes(file.size)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveFileUp(index)}
                        disabled={index === 0}
                        className="p-1 border border-black disabled:opacity-30 hover:bg-slate-200 bg-white"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveFileDown(index)}
                        disabled={index === files.length - 1}
                        className="p-1 border border-black disabled:opacity-30 hover:bg-slate-200 bg-white"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 border border-black hover:bg-red-200 bg-[#FF0055] text-white"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleConvert}
            disabled={isConverting}
            className="w-full bg-[#00FF66] border-3 border-black p-4 font-black text-base uppercase flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-300 cursor-pointer"
          >
            <RefreshCw className="w-6 h-6" />
            {isConverting ? 'CONVERTING FILE IN MEMORY...' : `CONVERT TO ${targetFormat.toUpperCase()} NOW`}
          </button>
        </div>
      )}
    </div>
  );
};
