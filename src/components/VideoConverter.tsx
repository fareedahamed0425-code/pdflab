import React, { useRef, useState } from 'react';
import { Film, Video, Play, Pause, Scissors, Download, Volume2, Sliders, CheckCircle2 } from 'lucide-react';
import { ProcessedResult, VideoConvertOptions, VideoResolution, VideoTargetFormat } from '../types';
import { convertVideoFile } from '../utils/videoEngine';
import { FileUploader } from './FileUploader';
import { formatBytes } from '../utils/security';

interface VideoConverterProps {
  onComplete: (result: ProcessedResult) => void;
}

export const VideoConverter: React.FC<VideoConverterProps> = ({ onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Options
  const [targetFormat, setTargetFormat] = useState<VideoTargetFormat>('webm');
  const [resolution, setResolution] = useState<VideoResolution>('720p');
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(10);
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const [frameRate, setFrameRate] = useState(30);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);

    const url = URL.createObjectURL(selected);
    setVideoUrl(url);

    const tempVid = document.createElement('video');
    tempVid.src = url;
    tempVid.onloadedmetadata = () => {
      const dur = tempVid.duration || 10;
      setDuration(dur);
      setTrimStart(0);
      setTrimEnd(Math.min(dur, 60)); // Default trim to max 60s for speed
    };
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);

    const options: VideoConvertOptions = {
      targetFormat,
      resolution,
      trimStart,
      trimEnd,
      quality,
      frameRate,
    };

    try {
      const res = await convertVideoFile(file, options, (p) => setProgress(p));
      onComplete({
        blob: res.blob,
        fileName: res.fileName,
        fileSize: res.blob.size,
        originalSize: file.size,
        type: res.type,
      });
    } catch (err) {
      console.error('Video conversion error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-4">
      {/* Header Banner */}
      <div className="bg-[#FF0055] text-white border-4 border-black p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-2xl font-black uppercase flex items-center gap-2">
          <Film className="w-6 h-6 text-[#FFE600]" />
          VIDEO FORMAT CONVERTER LAB
        </h2>
        <p className="text-xs font-bold font-mono mt-1 text-slate-100">
          Convert Video Formats (MP4, WEBM, GIF, MP3 Audio, WAV), Resize Resolution, Trim Duration, Adjust Bitrate 100% Client-Side.
        </p>
      </div>

      {!file ? (
        <FileUploader
          accept="video/*"
          title="UPLOAD VIDEO FILE TO CONVERT"
          subtitle="Supports MP4, WEBM, MOV, AVI, MKV up to 500MB. Processed in local browser memory."
          onFilesSelected={handleFileSelected}
          iconType="video"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Preview Player */}
          <div className="lg:col-span-1 bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3">
            <h3 className="font-black text-xs uppercase border-b-2 border-black pb-1">VIDEO PREVIEW</h3>

            {videoUrl && (
              <div className="border-2 border-black bg-black rounded-none overflow-hidden relative aspect-video">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <button
                onClick={togglePlay}
                className="bg-[#FFE600] border border-black p-1.5 font-bold flex items-center gap-1"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'PAUSE' : 'PLAY'}
              </button>
              <span>
                {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
              </span>
            </div>

            <div className="bg-amber-50 border border-black p-2 text-xs font-mono">
              <span className="font-bold block truncate">{file.name}</span>
              <span className="text-slate-600 block">{formatBytes(file.size)}</span>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setVideoUrl(null);
              }}
              className="w-full bg-slate-200 border border-black p-1.5 font-bold text-xs uppercase hover:bg-slate-300"
            >
              CHANGE VIDEO
            </button>
          </div>

          {/* Right Controls Suite */}
          <div className="lg:col-span-2 bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            {/* Target Format Pills */}
            <div>
              <label className="font-black text-xs uppercase block mb-2">TARGET OUTPUT FORMAT:</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {[
                  { id: 'webm', label: 'WEBM', color: 'bg-[#00E5FF]' },
                  { id: 'mp4', label: 'MP4', color: 'bg-[#FFE600]' },
                  { id: 'gif', label: 'GIF (ANIMATED)', color: 'bg-[#FF55FF]' },
                  { id: 'mp3', label: 'MP3 AUDIO', color: 'bg-[#00FF66]' },
                  { id: 'wav', label: 'WAV AUDIO', color: 'bg-[#FF9900]' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTargetFormat(item.id as VideoTargetFormat)}
                    className={`p-2 border-2 border-black font-black text-xs uppercase ${
                      targetFormat === item.id ? `${item.color} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]` : 'bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Resolution */}
            {targetFormat !== 'mp3' && targetFormat !== 'wav' && (
              <div>
                <label className="font-black text-xs uppercase block mb-2">TARGET RESOLUTION:</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {['original', '1080p', '720p', '480p', '360p'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setResolution(r as VideoResolution)}
                      className={`p-2 border-2 border-black font-black text-xs uppercase ${
                        resolution === r ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-50'
                      }`}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trimming Bar */}
            <div className="bg-slate-50 border-2 border-black p-3 space-y-2">
              <div className="flex items-center justify-between font-black text-xs uppercase">
                <span className="flex items-center gap-1">
                  <Scissors className="w-4 h-4 text-red-600" />
                  TRIM CLIP DURATION
                </span>
                <span className="font-mono text-emerald-700">
                  DURATION: {(trimEnd - trimStart).toFixed(1)}s
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <label className="block font-bold">START TIME ({trimStart.toFixed(1)}s):</label>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, trimEnd - 0.5)}
                    step={0.5}
                    value={trimStart}
                    onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                    className="w-full accent-black cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block font-bold">END TIME ({trimEnd.toFixed(1)}s):</label>
                  <input
                    type="range"
                    min={trimStart + 0.5}
                    max={duration || 10}
                    step={0.5}
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                    className="w-full accent-black cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Quality & FPS */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-black text-xs uppercase block mb-1">BITRATE QUALITY:</label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as any)}
                  className="w-full bg-white border-2 border-black p-1.5 font-bold text-xs uppercase"
                >
                  <option value="high">HIGH QUALITY (6 Mbps)</option>
                  <option value="medium">MEDIUM QUALITY (3 Mbps)</option>
                  <option value="low">COMPACT SIZE (1.2 Mbps)</option>
                </select>
              </div>

              <div>
                <label className="font-black text-xs uppercase block mb-1">FRAME RATE:</label>
                <select
                  value={frameRate}
                  onChange={(e) => setFrameRate(parseInt(e.target.value, 10))}
                  className="w-full bg-white border-2 border-black p-1.5 font-bold text-xs uppercase"
                >
                  <option value={60}>60 FPS (Ultra Smooth)</option>
                  <option value={30}>30 FPS (Standard)</option>
                  <option value={24}>24 FPS (Cinematic)</option>
                  <option value={15}>15 FPS (Compact)</option>
                </select>
              </div>
            </div>

            {/* Progress Bar */}
            {isProcessing && (
              <div className="bg-amber-100 border-2 border-black p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-black uppercase">
                  <span>CONVERTING VIDEO IN MEMORY...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-white border border-black h-4 overflow-hidden p-0.5">
                  <div
                    className="bg-[#FF0055] h-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Convert Button */}
            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="w-full bg-[#00FF66] border-3 border-black p-4 font-black text-base uppercase flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-300 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-6 h-6 text-black" />
              {isProcessing ? 'PROCESSING VIDEO RENDERING...' : `CONVERT TO ${targetFormat.toUpperCase()} NOW`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
