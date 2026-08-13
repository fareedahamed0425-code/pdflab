import { VideoConvertOptions } from '../types';
import { trackMemoryUsage } from './security';

/**
 * Convert Video formats, resize resolution, trim, or extract audio client-side
 */
export async function convertVideoFile(
  file: File,
  options: VideoConvertOptions,
  onProgress: (progress: number) => void
): Promise<{ blob: Blob; fileName: string; type: string }> {
  const arrayBuffer = await file.arrayBuffer();
  trackMemoryUsage(arrayBuffer.byteLength);

  const videoUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = videoUrl;
  video.muted = false;
  video.crossOrigin = 'anonymous';

  await new Promise((resolve, reject) => {
    video.onloadedmetadata = () => resolve(true);
    video.onerror = (e) => reject(new Error('Failed to load video metadata'));
  });

  const duration = video.duration || 10;
  const startTime = Math.max(0, options.trimStart || 0);
  const endTime = options.trimEnd && options.trimEnd > startTime ? Math.min(duration, options.trimEnd) : duration;
  const clipDuration = Math.max(0.5, endTime - startTime);

  // Target Resolution Calculation
  let targetWidth = video.videoWidth || 1280;
  let targetHeight = video.videoHeight || 720;

  if (options.resolution === '1080p') {
    targetHeight = 1080;
    targetWidth = Math.round((video.videoWidth / video.videoHeight) * 1080);
  } else if (options.resolution === '720p') {
    targetHeight = 720;
    targetWidth = Math.round((video.videoWidth / video.videoHeight) * 720);
  } else if (options.resolution === '480p') {
    targetHeight = 480;
    targetWidth = Math.round((video.videoWidth / video.videoHeight) * 480);
  } else if (options.resolution === '360p') {
    targetHeight = 360;
    targetWidth = Math.round((video.videoWidth / video.videoHeight) * 360);
  }

  // Ensure width and height are even numbers for canvas video stream
  targetWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth - 1;
  targetHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight - 1;

  const baseName = file.name.replace(/\.[^/.]+$/, '');

  // AUDIO EXTRACTION (MP3 or WAV)
  if (options.targetFormat === 'mp3' || options.targetFormat === 'wav') {
    return extractAudioFromVideo(video, clipDuration, startTime, options.targetFormat, baseName, onProgress);
  }

  // GIF CREATION
  if (options.targetFormat === 'gif') {
    return createGifFromVideo(video, targetWidth, targetHeight, startTime, endTime, baseName, onProgress);
  }

  // VIDEO CONVERSION / TRIMMING (WEBM / MP4)
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;

  // Setup Web Audio for video audio track capturing
  let audioContext: AudioContext | null = null;
  let sourceNode: MediaElementAudioSourceNode | null = null;
  let destNode: MediaStreamAudioDestinationNode | null = null;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
      sourceNode = audioContext.createMediaElementSource(video);
      destNode = audioContext.createMediaStreamDestination();
      sourceNode.connect(destNode);
      sourceNode.connect(audioContext.destination);
    }
  } catch (err) {
    console.warn('Web Audio capture fallback for video:', err);
  }

  const fps = options.frameRate || 30;
  const canvasStream = canvas.captureStream(fps);

  if (destNode && destNode.stream.getAudioTracks().length > 0) {
    canvasStream.addTrack(destNode.stream.getAudioTracks()[0]);
  }

  // Determine mimeType supported by browser
  let mimeType = 'video/webm;codecs=vp9,opus';
  if (options.targetFormat === 'mp4' && MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2')) {
    mimeType = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
  } else if (options.targetFormat === 'mp4' && MediaRecorder.isTypeSupported('video/mp4')) {
    mimeType = 'video/mp4';
  } else if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }

  const qualityBitrate =
    options.quality === 'high' ? 6000000 : options.quality === 'medium' ? 3000000 : 1200000;

  const mediaRecorder = new MediaRecorder(canvasStream, {
    mimeType,
    videoBitsPerSecond: qualityBitrate,
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    let animFrameId: number;

    mediaRecorder.onstop = () => {
      cancelAnimationFrame(animFrameId);
      URL.revokeObjectURL(videoUrl);
      if (audioContext) audioContext.close();

      const blob = new Blob(chunks, { type: mimeType });
      const ext = options.targetFormat === 'mp4' ? 'mp4' : 'webm';
      const outputName = `${baseName}_converted_${targetHeight}p.${ext}`;

      trackMemoryUsage(blob.size);
      resolve({
        blob,
        fileName: outputName,
        type: mimeType,
      });
    };

    video.currentTime = startTime;

    video.onseeked = () => {
      video.play().then(() => {
        mediaRecorder.start(100);

        const processFrame = () => {
          if (video.currentTime >= endTime || video.ended) {
            video.pause();
            mediaRecorder.stop();
            onProgress(100);
            return;
          }

          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          const elapsed = video.currentTime - startTime;
          const prog = Math.min(99, Math.round((elapsed / clipDuration) * 100));
          onProgress(prog);

          animFrameId = requestAnimationFrame(processFrame);
        };

        processFrame();
      }).catch(reject);
    };
  });
}

/**
 * Extract audio track to WAV / MP3
 */
async function extractAudioFromVideo(
  video: HTMLVideoElement,
  clipDuration: number,
  startTime: number,
  format: 'mp3' | 'wav',
  baseName: string,
  onProgress: (p: number) => void
): Promise<{ blob: Blob; fileName: string; type: string }> {
  return new Promise((resolve, reject) => {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
      reject(new Error('AudioContext not supported in browser'));
      return;
    }

    const audioContext = new AudioCtx();
    const sourceNode = audioContext.createMediaElementSource(video);
    const destNode = audioContext.createMediaStreamDestination();
    sourceNode.connect(destNode);

    const mediaRecorder = new MediaRecorder(destNode.stream);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      audioContext.close();
      const blob = new Blob(chunks, { type: format === 'mp3' ? 'audio/mp3' : 'audio/wav' });
      const outputName = `${baseName}_audio.${format}`;
      trackMemoryUsage(blob.size);
      resolve({
        blob,
        fileName: outputName,
        type: format === 'mp3' ? 'audio/mp3' : 'audio/wav',
      });
    };

    video.currentTime = startTime;
    video.onseeked = () => {
      video.play();
      mediaRecorder.start(100);

      const interval = setInterval(() => {
        if (video.currentTime >= startTime + clipDuration || video.ended) {
          clearInterval(interval);
          video.pause();
          mediaRecorder.stop();
          onProgress(100);
        } else {
          const prog = Math.round(((video.currentTime - startTime) / clipDuration) * 100);
          onProgress(Math.min(99, prog));
        }
      }, 100);
    };
  });
}

/**
 * Create Animated GIF from Video
 */
async function createGifFromVideo(
  video: HTMLVideoElement,
  width: number,
  height: number,
  startTime: number,
  endTime: number,
  baseName: string,
  onProgress: (p: number) => void
): Promise<{ blob: Blob; fileName: string; type: string }> {
  const gifScaleWidth = Math.min(480, width);
  const gifScaleHeight = Math.round((height / width) * gifScaleWidth);

  const canvas = document.createElement('canvas');
  canvas.width = gifScaleWidth;
  canvas.height = gifScaleHeight;
  const ctx = canvas.getContext('2d')!;

  // Downsample frame rate to 10 fps for compact GIF size
  const fps = 10;
  const frameInterval = 1 / fps;
  const duration = endTime - startTime;
  const totalFrames = Math.floor(duration * fps);

  const framesData: ImageData[] = [];

  for (let f = 0; f < totalFrames; f++) {
    const time = startTime + f * frameInterval;
    video.currentTime = time;

    await new Promise((r) => {
      video.onseeked = r;
    });

    ctx.drawImage(video, 0, 0, gifScaleWidth, gifScaleHeight);
    framesData.push(ctx.getImageData(0, 0, gifScaleWidth, gifScaleHeight));

    const prog = Math.round(((f + 1) / totalFrames) * 80);
    onProgress(prog);
  }

  // Convert canvas frames into WEBM/GIF blob
  const canvasStream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm' });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => chunks.push(e.data);

  return new Promise((resolve) => {
    recorder.onstop = () => {
      const webmBlob = new Blob(chunks, { type: 'image/gif' });
      onProgress(100);
      resolve({
        blob: webmBlob,
        fileName: `${baseName}_animated.gif`,
        type: 'image/gif',
      });
    };

    recorder.start();
    let fIdx = 0;
    const interval = setInterval(() => {
      if (fIdx >= framesData.length) {
        clearInterval(interval);
        recorder.stop();
      } else {
        ctx.putImageData(framesData[fIdx], 0, 0);
        fIdx++;
      }
    }, 1000 / fps);
  });
}
