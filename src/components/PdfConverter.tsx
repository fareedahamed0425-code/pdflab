import React, { useState } from 'react';
import { RefreshCw, FileText, Download, Image as ImageIcon, Presentation, FileCode, CheckCircle2 } from 'lucide-react';
import { PdfTargetFormat, ProcessedResult } from '../types';
import { 
  convertImagesToPdf, 
  convertPdfToImages, 
  convertPdfToPPT, 
  convertPdfToWord 
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
    setFiles(newFiles);
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
        // Converting Images/Text to PDF
        const pdfBytes = await convertImagesToPdf(files);
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
            IMAGES / TXT ➔ PDF
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
          accept={direction === 'pdf-to-other' ? 'application/pdf' : 'image/*,.txt'}
          title={direction === 'pdf-to-other' ? 'UPLOAD PDF TO CONVERT' : 'UPLOAD IMAGES OR TXT'}
          subtitle={
            direction === 'pdf-to-other'
              ? `Target Format: ${targetFormat.toUpperCase()}`
              : 'Select JPG, PNG or TXT files to convert to PDF.'
          }
          onFilesSelected={handleFilesSelected}
          iconType={direction === 'pdf-to-other' ? 'pdf' : 'image'}
        />
      ) : (
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="bg-amber-50 border-2 border-black p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-black" />
              <div>
                <span className="font-bold text-sm block">{files[0].name}</span>
                <span className="text-xs font-mono text-slate-600">{formatBytes(files[0].size)}</span>
              </div>
            </div>

            <button
              onClick={() => setFiles([])}
              className="bg-slate-200 border border-black px-2 py-1 font-bold text-xs uppercase"
            >
              CHANGE FILE
            </button>
          </div>

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
