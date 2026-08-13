import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Paragraph, TextRun, ImageRun, Packer, HeadingLevel } from 'docx';
import PptxGenJS from 'pptxgenjs';
import { Annotation, PdfPageMeta } from '../types';
import { trackMemoryUsage } from './security';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
}

/**
 * Render a single page of PDF to an HTML Canvas
 */
export async function renderPdfPageToCanvas(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale = 1.5
): Promise<HTMLCanvasElement> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport,
    canvas,
  } as any).promise;

  return canvas;
}

/**
 * Extract PDF page thumbnails & metadata
 */
export async function getPdfPagesMeta(file: File): Promise<PdfPageMeta[]> {
  const arrayBuffer = await file.arrayBuffer();
  trackMemoryUsage(arrayBuffer.byteLength);

  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const pagesMeta: PdfPageMeta[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 0.3 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport, canvas } as any).promise;
    const thumbnailUrl = canvas.toDataURL('image/png');

    pagesMeta.push({
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
      aspectRatio: viewport.width / viewport.height,
      thumbnailUrl,
      rotation: 0,
    });
  }

  return pagesMeta;
}

/**
 * MERGE multiple PDF files into one
 */
export async function mergePDFs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    trackMemoryUsage(bytes.byteLength);
    const pdf = await PDFDocument.load(bytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedBytes = await mergedPdf.save();
  trackMemoryUsage(mergedBytes.byteLength);
  return mergedBytes;
}

/**
 * SPLIT a PDF into multiple separate page files or page range
 */
export async function splitPDF(
  file: File,
  selectedPages: number[] // 1-indexed page numbers
): Promise<{ fileName: string; bytes: Uint8Array }[]> {
  const bytes = await file.arrayBuffer();
  trackMemoryUsage(bytes.byteLength);
  const pdf = await PDFDocument.load(bytes);
  const totalPages = pdf.getPageCount();

  const results: { fileName: string; bytes: Uint8Array }[] = [];
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  if (selectedPages.length === 0) {
    // Split all individual pages
    for (let i = 0; i < totalPages; i++) {
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(pdf, [i]);
      newPdf.addPage(copiedPage);
      const pdfBytes = await newPdf.save();
      results.push({
        fileName: `${baseName}_page_${i + 1}.pdf`,
        bytes: pdfBytes,
      });
    }
  } else {
    // Extract chosen pages into a single new document
    const newPdf = await PDFDocument.create();
    const indicesToCopy = selectedPages
      .filter((p) => p >= 1 && p <= totalPages)
      .map((p) => p - 1);

    if (indicesToCopy.length > 0) {
      const copiedPages = await newPdf.copyPages(pdf, indicesToCopy);
      copiedPages.forEach((page) => newPdf.addPage(page));
      const pdfBytes = await newPdf.save();
      results.push({
        fileName: `${baseName}_extracted.pdf`,
        bytes: pdfBytes,
      });
    }
  }

  return results;
}

/**
 * COMPRESS PDF into smaller file size
 */
export async function compressPDF(
  file: File,
  qualityLevel: 'low' | 'medium' | 'high' = 'medium'
): Promise<{ bytes: Uint8Array; originalSize: number; newSize: number }> {
  const originalBytes = await file.arrayBuffer();
  const originalSize = originalBytes.byteLength;
  trackMemoryUsage(originalSize);

  // Render pages at specific scaled quality onto canvas, then re-encode into optimized PDF
  const pdfJsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(originalBytes) }).promise;
  const newPdf = await PDFDocument.create();

  // Scales & JPEG compression factors according to level
  const scaleMap = { low: 0.8, medium: 1.1, high: 1.4 }; // 'low' = maximum compression (smaller size)
  const qualityMap = { low: 0.45, medium: 0.65, high: 0.82 };

  const scale = scaleMap[qualityLevel];
  const jpgQuality = qualityMap[qualityLevel];

  for (let i = 1; i <= pdfJsDoc.numPages; i++) {
    const canvas = await renderPdfPageToCanvas(pdfJsDoc, i, scale);
    const imgDataUrl = canvas.toDataURL('image/jpeg', jpgQuality);
    
    // Convert base64 to byte array
    const base64Data = imgDataUrl.split(',')[1];
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const embeddedImage = await newPdf.embedJpg(imageBytes);
    const page = newPdf.addPage([canvas.width / scale, canvas.height / scale]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: canvas.width / scale,
      height: canvas.height / scale,
    });
  }

  const newBytes = await newPdf.save();
  trackMemoryUsage(newBytes.byteLength);

  return {
    bytes: newBytes,
    originalSize,
    newSize: newBytes.byteLength,
  };
}

/**
 * CONVERT PDF to Images (JPG or PNG)
 */
export async function convertPdfToImages(
  file: File,
  format: 'jpg' | 'png' = 'jpg',
  scale = 2.0
): Promise<{ pageNumber: number; blob: Blob; dataUrl: string }[]> {
  const arrayBuffer = await file.arrayBuffer();
  trackMemoryUsage(arrayBuffer.byteLength);

  const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const results = [];

  const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const canvas = await renderPdfPageToCanvas(pdfDoc, i, scale);
    const dataUrl = canvas.toDataURL(mimeType, 0.92);

    const res = await fetch(dataUrl);
    const blob = await res.blob();

    results.push({
      pageNumber: i,
      blob,
      dataUrl,
    });
  }

  return results;
}

/**
 * CONVERT PDF to Word (.docx)
 */
export async function convertPdfToWord(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  trackMemoryUsage(arrayBuffer.byteLength);

  const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const docParagraphs: Paragraph[] = [];

  docParagraphs.push(
    new Paragraph({
      text: file.name.replace(/\.[^/.]+$/, ''),
      heading: HeadingLevel.TITLE,
    })
  );

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const textItems = textContent.items.map((item: any) => item.str).join(' ');

    docParagraphs.push(
      new Paragraph({
        text: `--- Page ${i} ---`,
        heading: HeadingLevel.HEADING_2,
      })
    );

    if (textItems.trim().length > 0) {
      // Split into lines or paragraphs
      const lines = textItems.split(/(?<=\.|\?|\!)\s+/);
      lines.forEach((line) => {
        if (line.trim()) {
          docParagraphs.push(
            new Paragraph({
              children: [new TextRun({ text: line.trim(), size: 24 })],
            })
          );
        }
      });
    } else {
      // If page is an image/scanned, render page canvas to embedded image
      const canvas = await renderPdfPageToCanvas(pdfDoc, i, 1.5);
      const imgDataUrl = canvas.toDataURL('image/png');
      const base64Data = imgDataUrl.split(',')[1];
      const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

      docParagraphs.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: imageBuffer,
              transformation: { width: 500, height: Math.round((500 * canvas.height) / canvas.width) },
              type: 'png',
            }),
          ],
        })
      );
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children: docParagraphs }],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

/**
 * CONVERT PDF to PowerPoint (.pptx)
 */
export async function convertPdfToPPT(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  trackMemoryUsage(arrayBuffer.byteLength);

  const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const pptx = new PptxGenJS();

  pptx.author = 'Brutal PDF Lab';
  pptx.title = file.name;

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const slide = pptx.addSlide();
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const extractedText = textContent.items.map((item: any) => item.str).join(' ').trim();

    // Render canvas image of slide
    const canvas = await renderPdfPageToCanvas(pdfDoc, i, 1.8);
    const imgDataUrl = canvas.toDataURL('image/png');

    // Add full page slide background image
    slide.addImage({
      data: imgDataUrl,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
    });

    if (extractedText.length > 0) {
      slide.addNotes(extractedText);
    }
  }

  const buffer = await pptx.write({ outputType: 'arraybuffer' });
  return new Blob([buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
}

/**
 * CONVERT Images / Text to PDF
 */
export async function convertImagesToPdf(files: File[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    trackMemoryUsage(arrayBuffer.byteLength);

    if (file.type.includes('image/jpeg') || file.type.includes('image/jpg')) {
      const image = await pdfDoc.embedJpg(arrayBuffer);
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    } else if (file.type.includes('image/png')) {
      const image = await pdfDoc.embedPng(arrayBuffer);
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    } else if (file.type.includes('text/plain')) {
      const text = await file.text();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      page.drawText(text.substring(0, 3000), {
        x: 50,
        y: 800,
        size: 11,
        font,
        color: rgb(0, 0, 0),
        maxWidth: 500,
        lineHeight: 14,
      });
    }
  }

  const bytes = await pdfDoc.save();
  return bytes;
}

/**
 * APPLY ANNOTATIONS & EDIT PDF
 */
export async function applyAnnotationsToPdf(
  originalFile: File,
  annotations: Annotation[],
  pageRotations: Record<number, number> = {},
  deletedPages: number[] = []
): Promise<Uint8Array> {
  const arrayBuffer = await originalFile.arrayBuffer();
  trackMemoryUsage(arrayBuffer.byteLength);

  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const totalPages = pdfDoc.getPageCount();

  // Apply rotations
  Object.entries(pageRotations).forEach(([pageIdxStr, rot]) => {
    const idx = parseInt(pageIdxStr, 10);
    if (idx >= 0 && idx < totalPages) {
      const page = pdfDoc.getPage(idx);
      page.setRotation(degrees(rot));
    }
  });

  // Apply text, drawings, images, shapes
  for (const ann of annotations) {
    if (ann.pageIndex < 0 || ann.pageIndex >= totalPages) continue;
    const page = pdfDoc.getPage(ann.pageIndex);
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Convert relative % position to absolute PDF points
    const absX = (ann.x / 100) * pageWidth;
    const absY = pageHeight - (ann.y / 100) * pageHeight; // PDF y-axis inverted

    if (ann.type === 'text' && ann.text) {
      const font = await pdfDoc.embedFont(
        ann.fontStyle === 'bold' ? StandardFonts.HelveticaBold : StandardFonts.Helvetica
      );
      
      const hexColor = ann.color || '#000000';
      const r = parseInt(hexColor.slice(1, 3), 16) / 255 || 0;
      const g = parseInt(hexColor.slice(3, 5), 16) / 255 || 0;
      const b = parseInt(hexColor.slice(5, 7), 16) / 255 || 0;

      page.drawText(ann.text, {
        x: absX,
        y: absY - (ann.fontSize || 16),
        size: ann.fontSize || 16,
        font,
        color: rgb(r, g, b),
      });
    } else if (ann.type === 'draw' && ann.pathPoints && ann.pathPoints.length > 1) {
      const hexColor = ann.color || '#FF0055';
      const r = parseInt(hexColor.slice(1, 3), 16) / 255 || 0;
      const g = parseInt(hexColor.slice(3, 5), 16) / 255 || 0;
      const b = parseInt(hexColor.slice(5, 7), 16) / 255 || 0;

      for (let i = 0; i < ann.pathPoints.length - 1; i++) {
        const p1 = ann.pathPoints[i];
        const p2 = ann.pathPoints[i + 1];
        page.drawLine({
          start: { x: (p1.x / 100) * pageWidth, y: pageHeight - (p1.y / 100) * pageHeight },
          end: { x: (p2.x / 100) * pageWidth, y: pageHeight - (p2.y / 100) * pageHeight },
          thickness: ann.strokeWidth || 3,
          color: rgb(r, g, b),
        });
      }
    } else if (ann.type === 'image' && ann.imageUrl) {
      try {
        const imageRes = await fetch(ann.imageUrl);
        const imageBytes = await imageRes.arrayBuffer();
        let pdfImg;
        if (ann.imageUrl.includes('png')) {
          pdfImg = await pdfDoc.embedPng(imageBytes);
        } else {
          pdfImg = await pdfDoc.embedJpg(imageBytes);
        }
        const imgW = ann.width ? (ann.width / 100) * pageWidth : 120;
        const imgH = ann.height ? (ann.height / 100) * pageHeight : 80;

        page.drawImage(pdfImg, {
          x: absX,
          y: absY - imgH,
          width: imgW,
          height: imgH,
        });
      } catch (err) {
        console.error('Error embedding image annotation:', err);
      }
    } else if (ann.type === 'shape') {
      const hexColor = ann.color || '#FFE600';
      const r = parseInt(hexColor.slice(1, 3), 16) / 255 || 0;
      const g = parseInt(hexColor.slice(3, 5), 16) / 255 || 0;
      const b = parseInt(hexColor.slice(5, 7), 16) / 255 || 0;

      const rectW = ann.width ? (ann.width / 100) * pageWidth : 100;
      const rectH = ann.height ? (ann.height / 100) * pageHeight : 50;

      page.drawRectangle({
        x: absX,
        y: absY - rectH,
        width: rectW,
        height: rectH,
        color: rgb(r, g, b),
        opacity: 0.4,
      });
    }
  }

  // Remove deleted pages in reverse order
  const sortedDelete = [...deletedPages].sort((a, b) => b - a);
  for (const pIdx of sortedDelete) {
    if (pIdx >= 0 && pIdx < pdfDoc.getPageCount()) {
      pdfDoc.removePage(pIdx);
    }
  }

  const finalBytes = await pdfDoc.save();
  return finalBytes;
}
