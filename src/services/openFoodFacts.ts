export interface ProduitOFF {
  nom: string;
  marque?: string;
  calories100g: number;
  proteines100g: number;
  glucides100g: number;
  lipides100g: number;
  image?: string;
}

export async function rechercherParCode(code: string): Promise<ProduitOFF | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments ?? {};

    const kcal = n['energy-kcal_100g']
      ?? (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0);

    return {
      nom: p.product_name_fr || p.product_name || p.generic_name_fr || 'Produit inconnu',
      marque: p.brands?.split(',')[0]?.trim(),
      calories100g:  Math.round(kcal),
      proteines100g: Math.round((n['proteins_100g']      ?? 0) * 10) / 10,
      glucides100g:  Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
      lipides100g:   Math.round((n['fat_100g']           ?? 0) * 10) / 10,
      image: p.image_front_small_url || p.image_url,
    };
  } catch {
    return null;
  }
}
