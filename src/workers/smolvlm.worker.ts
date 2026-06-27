import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

const PROMPT = `Analyse cette photo de repas. Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans texte autour) :
{
  "description": "Description courte du repas",
  "aliments": [
    {"nom": "Nom", "portion": "150g", "calories": 200, "proteines": 15, "glucides": 20, "lipides": 8}
  ],
  "caloriesTotal": 400,
  "proteinesTotal": 30,
  "glucidesTotal": 40,
  "lipidesTotal": 15
}
Si tu ne peux pas analyser, renvoie caloriesTotal: 0 et aliments: [].`;

type ProgressCallback = (info: { status: string; progress?: number }) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipe: any = null;

self.addEventListener('message', async (event: MessageEvent) => {
  const { type, imageBase64, mimeType } = event.data as {
    type: string;
    imageBase64: string;
    mimeType: string;
  };

  if (type !== 'analyze') return;

  try {
    if (!pipe) {
      const progressCb: ProgressCallback = (info) => {
        if (info.status === 'progress' && info.progress !== undefined) {
          self.postMessage({ type: 'progress', value: Math.round(info.progress) });
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pipe = await (pipeline as any)(
        'image-text-to-text',
        'HuggingFaceTB/SmolVLM-256M-Instruct',
        { dtype: 'q4', progress_callback: progressCb },
      );
    }

    const dataUrl = `data:${mimeType};base64,${imageBase64}`;

    const messages = [
      {
        role: 'user',
        content: [
          { type: 'image', url: dataUrl },
          { type: 'text', text: PROMPT },
        ],
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const output = await pipe(messages, { max_new_tokens: 512 }) as any[];
    const text: string = output[0]?.generated_text?.at(-1)?.content ?? '';

    self.postMessage({ type: 'result', text });
  } catch (err) {
    self.postMessage({ type: 'error', message: (err as Error).message });
  }
});
