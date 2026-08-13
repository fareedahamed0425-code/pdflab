export type ToolMode = 
  | 'edit' 
  | 'merge' 
  | 'split' 
  | 'compress' 
  | 'convert' 
  | 'video' 
  | 'security';

export type PdfTargetFormat = 'ppt' | 'docx' | 'jpg' | 'png' | 'txt';
export type ConvertDirection = 'pdf-to-other' | 'other-to-pdf';

export type VideoTargetFormat = 'mp4' | 'webm' | 'gif' | 'mp3' | 'wav';
export type VideoResolution = 'original' | '1080p' | '720p' | '480p' | '360p';

export interface VideoConvertOptions {
  targetFormat: VideoTargetFormat;
  resolution: VideoResolution;
  trimStart: number; // in seconds
  trimEnd: number;   // in seconds
  quality: 'high' | 'medium' | 'low';
  frameRate: number; // e.g. 30, 24, 15
}

export type AnnotationType = 'text' | 'draw' | 'shape' | 'image' | 'signature';

export interface Annotation {
  id: string;
  pageIndex: number;
  type: AnnotationType;
  x: number; // percentage or pt relative to page width
  y: number; // percentage or pt relative to page height
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  color?: string;
  fontStyle?: 'normal' | 'bold' | 'italic';
  pathPoints?: Array<{ x: number; y: number }>;
  strokeWidth?: number;
  imageUrl?: string;
}

export interface PdfPageMeta {
  pageNumber: number;
  width: number;
  height: number;
  aspectRatio: number;
  thumbnailUrl?: string;
  rotation: number; // 0, 90, 180, 270
}

export interface ProcessedResult {
  blob: Blob;
  fileName: string;
  fileSize: number;
  originalSize?: number;
  type: string;
  savingsPercentage?: number;
}
