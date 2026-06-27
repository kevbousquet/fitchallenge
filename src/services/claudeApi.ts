import type { AnalyseRepas } from '../types';

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('../workers/smolvlm.worker.ts', import.meta.url),
      { type: 'module' },
    );
  }
  return worker;
}

export function analyserRepasParPhoto(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
  onProgress?: (pct: number) => void,
): Promise<AnalyseRepas> {
  return new Promise((resolve, reject) => {
    const w = getWorker();

    const handler = (event: MessageEvent) => {
      const { type, text, value, message } = event.data as {
        type: string;
        text?: string;
        value?: number;
        message?: string;
      };

      if (type === 'progress') {
        onProgress?.(value ?? 0);
      } else if (type === 'result') {
        w.removeEventListener('message', handler);
        const cleaned = (text ?? '')
          .replace(/^```json\s*/i, '')
          .replace(/```\s*$/, '')
          .trim();
        try {
          resolve(JSON.parse(cleaned) as AnalyseRepas);
        } catch {
          reject(new Error(`Réponse non analysable : ${(text ?? '').slice(0, 200)}`));
        }
      } else if (type === 'error') {
        w.removeEventListener('message', handler);
        reject(new Error(message ?? 'Erreur inconnue'));
      }
    };

    w.addEventListener('message', handler);
    w.postMessage({ type: 'analyze', imageBase64, mimeType });
  });
}

export async function fileToBase64(
  file: File,
): Promise<{ base64: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const MAX = 1024;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.80);
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType: 'image/jpeg' });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Impossible de lire cette image.'));
    };

    img.src = objectUrl;
  });
}
