// TODO(prod): En production, ne PAS appeler l'API Anthropic directement depuis
// le client — la clé API serait exposée dans le bundle JavaScript.
// Créer un backend proxy (ex. Node.js/Express) qui :
//   1. Reçoit la photo en multipart ou base64
//   2. Appelle api.anthropic.com côté serveur
//   3. Renvoie le JSON analysé au client
// La variable VITE_ANTHROPIC_API_KEY ne doit exister QUE pour le développement local.

import type { AnalyseRepas } from '../types';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL   = 'claude-sonnet-4-6';

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
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;

  if (!apiKey) {
    throw new Error('Clé API Anthropic manquante. Vérifiez le fichier .env (VITE_ANTHROPIC_API_KEY).');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      // Nécessaire pour les appels directs depuis le navigateur
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imageBase64,
              },
            },
            { type: 'text', text: PROMPT_ANALYSE },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const erreur = await response.text();
    throw new Error(`Erreur API Claude : ${response.status} — ${erreur}`);
  }

  const data = await response.json();
  const texte = data.content?.[0]?.text ?? '';

  try {
    return JSON.parse(texte) as AnalyseRepas;
  } catch {
    throw new Error(`Réponse Claude non analysable : ${texte.slice(0, 200)}`);
  }
}

// Convertit un fichier image en JPEG base64 via Canvas
// (gère les formats non supportés par Claude : HEIC, HEIF, BMP, etc.)
export async function fileToBase64(
  file: File,
): Promise<{ base64: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Redimensionne si l'image est trop grande (max 1568px côté le plus long)
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

      // Convertit toujours en JPEG (compatible avec tous les téléphones)
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
