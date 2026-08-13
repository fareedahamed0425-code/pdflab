import React, { useRef, useState } from 'react';
import { UploadCloud, File, Film, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { formatBytes } from '../utils/security';

interface FileUploaderProps {
  accept: string; // e.g. "application/pdf" or "video/*" or "image/*,.pdf"
  title: string;
  subtitle: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  iconType?: 'pdf' | 'video' | 'image' | 'generic';
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  accept,
  title,
  subtitle,
  multiple = false,
  onFilesSelected,
  iconType = 'pdf',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndEmit = (files: FileList | File[]) => {
    setErrorMsg(null);
    const validFiles: File[] = [];
    const fileArray = Array.from(files);

    if (fileArray.length === 0) return;

    for (const f of fileArray) {
      if (f.size > 500 * 1024 * 1024) {
        setErrorMsg(`File ${f.name} exceeds 500MB browser limit.`);
        return;
      }
      validFiles.push(f);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      validateAndEmit(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndEmit(e.target.files);
    }
  };

  return (
    <div className="w-full my-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-4 border-dashed border-black p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'bg-[#FFE600] scale-[1.01] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'
            : 'bg-white hover:bg-amber-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="bg-black text-white p-4 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            {iconType === 'video' ? (
              <Film className="w-8 h-8 text-[#FF0055]" />
            ) : iconType === 'image' ? (
              <ImageIcon className="w-8 h-8 text-[#00E5FF]" />
            ) : (
              <UploadCloud className="w-8 h-8 text-[#FFE600]" />
            )}
          </div>

          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">{title}</h3>
            <p className="text-xs font-bold text-slate-700 font-mono mt-1">{subtitle}</p>
          </div>

          <div className="mt-2 inline-flex items-center gap-2 bg-[#00FF66] border-2 border-black px-4 py-2 font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-300">
            CHOOSE FILE{multiple ? 'S' : ''} OR DRAG & DROP
          </div>

          <div className="text-[10px] font-mono uppercase bg-slate-100 border border-black px-2 py-0.5 mt-1">
            🔒 Processed 100% locally in browser memory
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 bg-[#FF0055] text-white border-2 border-black p-3 font-bold text-xs flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
