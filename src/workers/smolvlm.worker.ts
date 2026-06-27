import { pipeline } from '@huggingface/transformers';

type ProgressCallback = (info: { status: string; progress?: number }) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipe: any = null;

// Table nutritionnelle (valeurs pour 1 portion standard)
const NUTRITION_TABLE: Record<string, { cal: number; prot: number; gluc: number; lip: number; portion: string }> = {
  pizza: { cal: 800, prot: 35, gluc: 90, lip: 30, portion: '2 parts' },
  burger: { cal: 550, prot: 28, gluc: 42, lip: 28, portion: '1 burger' },
  salad: { cal: 180, prot: 8, gluc: 12, lip: 10, portion: '1 assiette' },
  pasta: { cal: 450, prot: 16, gluc: 75, lip: 10, portion: '200g' },
  spaghetti: { cal: 450, prot: 16, gluc: 75, lip: 10, portion: '200g' },
  rice: { cal: 350, prot: 8, gluc: 75, lip: 2, portion: '200g' },
  chicken: { cal: 300, prot: 45, gluc: 0, lip: 12, portion: '150g' },
  steak: { cal: 350, prot: 40, gluc: 0, lip: 18, portion: '150g' },
  beef: { cal: 350, prot: 38, gluc: 0, lip: 20, portion: '150g' },
  fish: { cal: 250, prot: 35, gluc: 0, lip: 10, portion: '150g' },
  salmon: { cal: 320, prot: 34, gluc: 0, lip: 18, portion: '150g' },
  soup: { cal: 180, prot: 10, gluc: 20, lip: 6, portion: '300ml' },
  sandwich: { cal: 420, prot: 22, gluc: 45, lip: 16, portion: '1 sandwich' },
  wrap: { cal: 380, prot: 20, gluc: 40, lip: 14, portion: '1 wrap' },
  sushi: { cal: 320, prot: 18, gluc: 45, lip: 6, portion: '8 pièces' },
  omelette: { cal: 280, prot: 20, gluc: 2, lip: 20, portion: '2 oeufs' },
  egg: { cal: 280, prot: 20, gluc: 2, lip: 20, portion: '2 oeufs' },
  bread: { cal: 250, prot: 8, gluc: 48, lip: 3, portion: '2 tranches' },
  cheese: { cal: 300, prot: 18, gluc: 1, lip: 24, portion: '80g' },
  yogurt: { cal: 120, prot: 8, gluc: 14, lip: 3, portion: '125g' },
  fruit: { cal: 100, prot: 1, gluc: 24, lip: 0, portion: '1 portion' },
  apple: { cal: 80, prot: 0, gluc: 20, lip: 0, portion: '1 pomme' },
  banana: { cal: 100, prot: 1, gluc: 25, lip: 0, portion: '1 banane' },
  vegetable: { cal: 80, prot: 3, gluc: 12, lip: 1, portion: '200g' },
  broccoli: { cal: 60, prot: 5, gluc: 8, lip: 1, portion: '200g' },
  cereal: { cal: 350, prot: 10, gluc: 65, lip: 6, portion: '60g + lait' },
  pancake: { cal: 400, prot: 10, gluc: 55, lip: 16, portion: '3 pancakes' },
  waffle: { cal: 420, prot: 10, gluc: 58, lip: 16, portion: '2 gaufres' },
  croissant: { cal: 280, prot: 5, gluc: 30, lip: 16, portion: '1 croissant' },
  cake: { cal: 420, prot: 6, gluc: 60, lip: 18, portion: '1 part' },
  cookie: { cal: 220, prot: 3, gluc: 32, lip: 10, portion: '3 biscuits' },
  chocolate: { cal: 280, prot: 4, gluc: 32, lip: 16, portion: '50g' },
  ice: { cal: 250, prot: 4, gluc: 38, lip: 10, portion: '2 boules' },
  fries: { cal: 380, prot: 5, gluc: 50, lip: 18, portion: '200g' },
  potato: { cal: 200, prot: 4, gluc: 42, lip: 1, portion: '200g' },
  curry: { cal: 500, prot: 28, gluc: 45, lip: 20, portion: '1 assiette' },
  noodle: { cal: 380, prot: 14, gluc: 68, lip: 6, portion: '200g' },
  ramen: { cal: 450, prot: 18, gluc: 65, lip: 14, portion: '1 bol' },
  taco: { cal: 480, prot: 24, gluc: 44, lip: 22, portion: '2 tacos' },
  hot: { cal: 480, prot: 16, gluc: 38, lip: 28, portion: '1 hot-dog' },
  default: { cal: 400, prot: 18, gluc: 45, lip: 15, portion: '1 portion' },
};

function findNutrition(caption: string) {
  const lower = caption.toLowerCase();
  for (const [key, val] of Object.entries(NUTRITION_TABLE)) {
    if (lower.includes(key)) return { key, ...val };
  }
  return { key: 'repas', ...NUTRITION_TABLE.default };
}

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

      pipe = await pipeline(
        'image-to-text',
        'Xenova/blip-image-captioning-base',
        { progress_callback: progressCb },
      );
    }

    const dataUrl = `data:${mimeType};base64,${imageBase64}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const output = await pipe(dataUrl) as any[];
    const caption: string = output[0]?.generated_text ?? '';

    const nutrition = findNutrition(caption);

    const result = JSON.stringify({
      description: caption || 'Repas analysé',
      aliments: [
        {
          nom: caption || 'Aliment',
          portion: nutrition.portion,
          calories: nutrition.cal,
          proteines: nutrition.prot,
          glucides: nutrition.gluc,
          lipides: nutrition.lip,
        },
      ],
      caloriesTotal: nutrition.cal,
      proteinesTotal: nutrition.prot,
      glucidesTotal: nutrition.gluc,
      lipidesTotal: nutrition.lip,
    });

    self.postMessage({ type: 'result', text: result });
  } catch (err) {
    self.postMessage({ type: 'error', message: (err as Error).message });
  }
});
