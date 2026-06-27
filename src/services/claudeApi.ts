import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalyseRepas } from '../types';

const PROMPT_ANALYSE = `Analyse cette photo de repas et retourne UNIQUEMENT un objet JSON valide (sans markdown ni texte autour) avec la structure suivante :

{
  "description": "Description courte du repas",
  "aliments": [
    {
      "nom": "Nom de l'aliment",
      "portion": "Quantité estimée (ex: 150g, 1 unité)",
      "calories": 250,
      "proteines": 20,
      "glucides": 30,
      "lipides": 8
    }
  ],
  "caloriesTotal": 450,
  "proteinesTotal": 35,
  "glucidesTotal": 50,
  "lipidesTotal": 12
}

Sois précis dans les estimations. Si tu ne peux pas analyser la photo, renvoie un objet avec caloriesTotal: 0 et aliments: [].`;

export async function analyserRepasParPhoto(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
): Promise<AnalyseRepas> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  if (!apiKey) {
    throw new Error('Clé API Gemini manquante. Vérifiez le fichier .env (VITE_GEMINI_API_KEY).');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent([
    { inlineData: { mimeType, data: imageBase64 } },
    PROMPT_ANALYSE,
  ]);

  const texte = result.response.text();
  const cleaned = texte.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

  try {
    return JSON.parse(cleaned) as AnalyseRepas;
  } catch {
    throw new Error(`Réponse Gemini non analysable : ${texte.slice(0, 200)}`);
  }
}

// Convertit un fichier image en JPEG base64 via Canvas
export async function fileToBase64(
  file: File,
): Promise<{ base64: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const MAX = 1568;
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

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType: 'image/jpeg' });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Impossible de lire cette image. Essayez un autre format.'));
    };

    img.src = objectUrl;
  });
}
