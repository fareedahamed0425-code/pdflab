import React, { useEffect, useRef, useState } from 'react';
import { 
  Type, 
  PenTool, 
  Square, 
  RotateCw, 
  Trash2, 
  Download, 
  Plus, 
  Minus, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon,
  CheckCircle2,
  FileCheck,
  Highlighter
} from 'lucide-react';
import { Annotation, PdfPageMeta, ProcessedResult } from '../types';
import { applyAnnotationsToPdf, getPdfPagesMeta, renderPdfPageToCanvas } from '../utils/pdfEngine';
import * as pdfjsLib from 'pdfjs-dist';
import { FileUploader } from './FileUploader';

interface PdfEditorProps {
  onComplete: (result: ProcessedResult) => void;
}

export const PdfEditor: React.FC<PdfEditorProps> = ({ onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pagesMeta, setPagesMeta] = useState<PdfPageMeta[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isProcessingExport, setIsProcessingExport] = useState(false);

  // Editor Tools & Annotations
  const [activeTool, setActiveTool] = useState<'text' | 'draw' | 'shape' | 'image'>('text');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [textInput, setTextInput] = useState('Sample Text');
  const [fontSize, setFontSize] = useState(18);
  const [color, setColor] = useState('#FF0055');
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
  const [deletedPages, setDeletedPages] = useState<number[]>([]);

  // Canvas Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  // Load PDF when file selected
  useEffect(() => {
    if (!file) return;

    let isMounted = true;
    setLoading(true);

    const loadPdf = async () => {
      try {
        const meta = await getPdfPagesMeta(file);
        if (!isMounted) return;
        setPagesMeta(meta);

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        pdfDocRef.current = pdf;

        setCurrentPageIndex(0);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load PDF:', err);
        setLoading(false);
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [file]);

  // Render current page onto preview canvas
  useEffect(() => {
    if (!pdfDocRef.current || pagesMeta.length === 0) return;

    const renderPage = async () => {
      const pageNum = currentPageIndex + 1;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const page = await pdfDocRef.current!.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.2, rotation: pageRotations[currentPageIndex] || 0 });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext('2d')!;
      await page.render({ canvasContext: context, viewport, canvas } as any).promise;
    };

    renderPage();
  }, [currentPageIndex, pageRotations, pagesMeta]);

  // Handle clicking on canvas to place text or shape
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'draw') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeTool === 'text') {
      const newAnn: Annotation = {
        id: 'ann-' + Date.now(),
        pageIndex: currentPageIndex,
        type: 'text',
        x,
        y,
        text: textInput || 'Sample Text',
        fontSize,
        color,
      };
      setAnnotations([...annotations, newAnn]);
    } else if (activeTool === 'shape') {
      const newAnn: Annotation = {
        id: 'ann-' + Date.now(),
        pageIndex: currentPageIndex,
        type: 'shape',
        x,
        y,
        width: 25,
        height: 12,
        color,
      };
      setAnnotations([...annotations, newAnn]);
    }
  };

  // Drawing mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'draw') return;
    setIsDrawing(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCurrentPath([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || activeTool !== 'draw') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCurrentPath((prev) => [...prev, { x, y }]);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 1) {
      const newAnn: Annotation = {
        id: 'ann-' + Date.now(),
        pageIndex: currentPageIndex,
        type: 'draw',
        x: currentPath[0].x,
        y: currentPath[0].y,
        pathPoints: currentPath,
        color,
        strokeWidth: 4,
      };
      setAnnotations([...annotations, newAnn]);
    }
    setCurrentPath([]);
  };

  // Rotate Current Page
  const handleRotateCurrent = () => {
    const currentRot = pageRotations[currentPageIndex] || 0;
    const nextRot = (currentRot + 90) % 360;
    setPageRotations({ ...pageRotations, [currentPageIndex]: nextRot });
  };

  // Delete Current Page
  const handleDeleteCurrent = () => {
    if (deletedPages.includes(currentPageIndex)) return;
    setDeletedPages([...deletedPages, currentPageIndex]);
  };

  // Remove annotation
  const removeAnnotation = (id: string) => {
    setAnnotations(annotations.filter((a) => a.id !== id));
  };

  // Save & Export
  const handleExport = async () => {
    if (!file) return;
    setIsProcessingExport(true);
    try {
      const editedBytes = await applyAnnotationsToPdf(
        file,
        annotations,
        pageRotations,
        deletedPages
      );
      const blob = new Blob([editedBytes], { type: 'application/pdf' });
      onComplete({
        blob,
        fileName: `${file.name.replace(/\.[^/.]+$/, '')}_edited.pdf`,
        fileSize: blob.size,
        type: 'application/pdf',
      });
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsProcessingExport(false);
    }
  };

  if (!file) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#FFE600] border-4 border-black p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black uppercase">VISUAL PDF EDITOR</h2>
          <p className="text-xs font-bold font-mono">
            Add text, freehand markups, shapes, rotate or delete pages with live preview.
          </p>
        </div>
        <FileUploader
          accept="application/pdf"
          title="UPLOAD PDF TO EDIT"
          subtitle="Supports all PDF files. 100% Client-Side In-Memory Editing."
          onFilesSelected={(files) => setFile(files[0])}
          iconType="pdf"
        />
      </div>
    );
  }

  const activePageAnnotations = annotations.filter((a) => a.pageIndex === currentPageIndex);

  return (
    <div className="max-w-6xl mx-auto my-4">
      {/* Editor Header Bar */}
      <div className="bg-white border-4 border-black p-4 mb-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="bg-black text-[#FFE600] px-2 py-1 font-mono font-bold text-xs uppercase">
            EDITING FILE:
          </span>
          <span className="font-black text-sm max-w-xs truncate">{file.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={isProcessingExport}
            className="bg-[#00FF66] border-2 border-black px-4 py-2 font-black text-xs uppercase flex items-center gap-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {isProcessingExport ? 'PROCESSING...' : 'EXPORT EDITED PDF'}
          </button>

          <button
            onClick={() => setFile(null)}
            className="bg-slate-200 border-2 border-black px-3 py-2 font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-300"
          >
            CHANGE FILE
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar Tools */}
        <div className="lg:col-span-1 bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <h3 className="font-black uppercase text-sm border-b-2 border-black pb-2">TOOLBOX</h3>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTool('text')}
              className={`p-2 border-2 border-black font-black text-xs uppercase flex flex-col items-center gap-1 ${
                activeTool === 'text' ? 'bg-[#FFE600] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-50'
              }`}
            >
              <Type className="w-5 h-5" />
              ADD TEXT
            </button>

            <button
              onClick={() => setActiveTool('draw')}
              className={`p-2 border-2 border-black font-black text-xs uppercase flex flex-col items-center gap-1 ${
                activeTool === 'draw' ? 'bg-[#FF0055] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-50'
              }`}
            >
              <PenTool className="w-5 h-5" />
              PEN MARKUP
            </button>

            <button
              onClick={() => setActiveTool('shape')}
              className={`p-2 border-2 border-black font-black text-xs uppercase flex flex-col items-center gap-1 ${
                activeTool === 'shape' ? 'bg-[#00E5FF] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-50'
              }`}
            >
              <Square className="w-5 h-5" />
              HIGHLIGHT
            </button>

            <button
              onClick={handleRotateCurrent}
              className="p-2 border-2 border-black font-black text-xs uppercase flex flex-col items-center gap-1 bg-[#00FF66] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-300"
            >
              <RotateCw className="w-5 h-5" />
              ROTATE
            </button>
          </div>

          {/* Context Options */}
          {activeTool === 'text' && (
            <div className="bg-amber-50 border-2 border-black p-3 space-y-2 text-xs">
              <label className="font-bold uppercase block">Text Content:</label>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full bg-white border border-black p-1.5 font-bold"
              />

              <div className="flex items-center justify-between">
                <span className="font-bold uppercase">Font Size: {fontSize}px</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setFontSize(Math.max(10, fontSize - 2))} className="bg-white border border-black p-1 font-bold">
                    -
                  </button>
                  <button onClick={() => setFontSize(Math.min(48, fontSize + 2))} className="bg-white border border-black p-1 font-bold">
                    +
                  </button>
                </div>
              </div>

              <label className="font-bold uppercase block">Text Color:</label>
              <div className="flex items-center gap-1.5">
                {['#FF0055', '#000000', '#00E5FF', '#00FF66', '#FFE600'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 border border-black ${color === c ? 'ring-2 ring-black scale-110' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTool === 'draw' && (
            <div className="bg-pink-50 border-2 border-black p-3 space-y-2 text-xs">
              <p className="font-bold uppercase">Draw freely on the page with mouse / touch.</p>
              <label className="font-bold uppercase block">Ink Color:</label>
              <div className="flex items-center gap-1.5">
                {['#FF0055', '#000000', '#00E5FF', '#00FF66', '#FFE600'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 border border-black ${color === c ? 'ring-2 ring-black scale-110' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Page Actions */}
          <div className="border-t-2 border-black pt-3 space-y-2">
            <h4 className="font-black text-xs uppercase">PAGE ACTIONS</h4>
            <button
              onClick={handleDeleteCurrent}
              disabled={deletedPages.includes(currentPageIndex)}
              className="w-full bg-[#FF0055] text-white border-2 border-black p-2 font-bold text-xs uppercase flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-600 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {deletedPages.includes(currentPageIndex) ? 'PAGE DELETED' : 'DELETE THIS PAGE'}
            </button>
          </div>

          {/* Annotations List */}
          {activePageAnnotations.length > 0 && (
            <div className="border-t-2 border-black pt-3">
              <h4 className="font-black text-xs uppercase mb-2">ANNOTATIONS ({activePageAnnotations.length})</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {activePageAnnotations.map((ann, i) => (
                  <div key={ann.id} className="flex items-center justify-between bg-slate-100 border border-black p-1.5 text-xs font-mono">
                    <span className="truncate max-w-[120px]">{ann.type.toUpperCase()}: {ann.text || 'Element'}</span>
                    <button onClick={() => removeAnnotation(ann.id)} className="text-red-600 font-bold hover:underline">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Preview Stage */}
        <div className="lg:col-span-3 bg-slate-200 border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center">
          {/* Page Selector Bar */}
          <div className="flex items-center justify-between w-full max-w-lg bg-white border-2 border-black p-2 mb-4 font-mono font-bold text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <button
              onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
              disabled={currentPageIndex === 0}
              className="bg-black text-white p-1 hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span>
              PAGE {currentPageIndex + 1} OF {pagesMeta.length}
              {deletedPages.includes(currentPageIndex) && (
                <span className="bg-red-600 text-white px-1 ml-2 text-[10px]">DELETED</span>
              )}
            </span>

            <button
              onClick={() => setCurrentPageIndex(Math.min(pagesMeta.length - 1, currentPageIndex + 1))}
              disabled={currentPageIndex === pagesMeta.length - 1}
              className="bg-black text-white p-1 hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Interactive Page Container */}
          <div
            ref={containerRef}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="relative border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] cursor-crosshair overflow-hidden"
            style={{
              opacity: deletedPages.includes(currentPageIndex) ? 0.3 : 1,
            }}
          >
            <canvas ref={canvasRef} className="block" />

            {/* Render Overlay Annotations */}
            {activePageAnnotations.map((ann) => (
              <div
                key={ann.id}
                className="absolute border border-dashed border-black/50 p-1 pointer-events-none"
                style={{
                  left: `${ann.x}%`,
                  top: `${ann.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {ann.type === 'text' && (
                  <span
                    style={{
                      fontSize: `${ann.fontSize}px`,
                      color: ann.color,
                      fontWeight: 'bold',
                    }}
                  >
                    {ann.text}
                  </span>
                )}

                {ann.type === 'shape' && (
                  <div
                    style={{
                      width: '120px',
                      height: '40px',
                      backgroundColor: ann.color,
                      opacity: 0.5,
                      border: '2px solid black',
                    }}
                  />
                )}
              </div>
            ))}

            {/* Drawing preview SVG */}
            {currentPath.length > 1 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <polyline
                  points={currentPath.map((p) => `${p.x}%,${p.y}%`).join(' ')}
                  fill="none"
                  stroke={color}
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
