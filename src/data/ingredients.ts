export type CategorieIngredient =
  | 'viande'
  | 'charcuterie'
  | 'poisson'
  | 'feculents'
  | 'legumes'
  | 'fruits'
  | 'laitiers'
  | 'oeufs'
  | 'matiereGrasse'
  | 'legumineuses'
  | 'sucre'
  | 'divers';

export interface Ingredient {
  nom: string;
  categorie: CategorieIngredient;
  calories100g: number;
  proteines100g: number;
  glucides100g: number;
  lipides100g: number;
  note?: string; // portion usuelle indicative
}

export const CATEGORIE_LABELS: Record<CategorieIngredient, string> = {
  viande:        'Viande',
  charcuterie:   'Charcuterie',
  poisson:       'Poisson',
  feculents:     'Féculent',
  legumes:       'Légume',
  fruits:        'Fruit',
  laitiers:      'Laitier',
  oeufs:         'Œuf',
  matiereGrasse: 'Matière grasse',
  legumineuses:  'Légumineuse',
  sucre:         'Sucre/douceur',
  divers:        'Divers',
};

export const CATEGORIE_COLORS: Record<CategorieIngredient, string> = {
  viande:        'bg-red-400',
  charcuterie:   'bg-rose-300',
  poisson:       'bg-blue-400',
  feculents:     'bg-amber-400',
  legumes:       'bg-green-400',
  fruits:        'bg-orange-400',
  laitiers:      'bg-yellow-300',
  oeufs:         'bg-yellow-400',
  matiereGrasse: 'bg-slate-400',
  legumineuses:  'bg-teal-400',
  sucre:         'bg-pink-400',
  divers:        'bg-slate-300',
};

export const INGREDIENTS: Ingredient[] = [
  // ── Viandes ──────────────────────────────────────────────────────────────
  { nom: 'Poulet blanc grillé',      categorie: 'viande',  calories100g: 165, proteines100g: 31,  glucides100g: 0,   lipides100g: 3.6, note: '1 blanc ≈ 150g' },
  { nom: 'Cuisse de poulet rôtie',   categorie: 'viande',  calories100g: 215, proteines100g: 26,  glucides100g: 0,   lipides100g: 12,  note: '1 cuisse ≈ 130g' },
  { nom: 'Steak bœuf',               categorie: 'viande',  calories100g: 190, proteines100g: 22,  glucides100g: 0,   lipides100g: 11  },
  { nom: 'Steak haché 5% MG',        categorie: 'viande',  calories100g: 140, proteines100g: 20,  glucides100g: 0,   lipides100g: 6   },
  { nom: 'Steak haché 15% MG',       categorie: 'viande',  calories100g: 215, proteines100g: 19,  glucides100g: 0,   lipides100g: 15  },
  { nom: 'Filet de porc',            categorie: 'viande',  calories100g: 143, proteines100g: 22,  glucides100g: 0,   lipides100g: 6   },
  { nom: 'Côte de porc',             categorie: 'viande',  calories100g: 230, proteines100g: 21,  glucides100g: 0,   lipides100g: 16  },
  { nom: 'Escalope de dinde',        categorie: 'viande',  calories100g: 140, proteines100g: 27,  glucides100g: 0,   lipides100g: 3   },
  { nom: 'Merguez',                  categorie: 'viande',  calories100g: 330, proteines100g: 16,  glucides100g: 2,   lipides100g: 29, note: '1 merguez ≈ 80g' },
  { nom: 'Saucisse de Francfort',    categorie: 'viande',  calories100g: 290, proteines100g: 13,  glucides100g: 2,   lipides100g: 26, note: '1 saucisse ≈ 60g' },
  { nom: 'Agneau (côtelette)',        categorie: 'viande',  calories100g: 290, proteines100g: 24,  glucides100g: 0,   lipides100g: 21, note: '1 côtelette ≈ 100g' },
  { nom: 'Rôti de bœuf',             categorie: 'viande',  calories100g: 200, proteines100g: 26,  glucides100g: 0,   lipides100g: 10  },
  { nom: 'Veau escalope',            categorie: 'viande',  calories100g: 130, proteines100g: 21,  glucides100g: 0,   lipides100g: 5   },
  { nom: 'Lapin',                    categorie: 'viande',  calories100g: 162, proteines100g: 21,  glucides100g: 0,   lipides100g: 8   },

  // ── Charcuterie ──────────────────────────────────────────────────────────
  { nom: 'Jambon blanc',             categorie: 'charcuterie', calories100g: 107, proteines100g: 17,  glucides100g: 1,   lipides100g: 4,  note: '1 tranche ≈ 30g' },
  { nom: 'Jambon cru',               categorie: 'charcuterie', calories100g: 145, proteines100g: 26,  glucides100g: 0,   lipides100g: 4,  note: '1 tranche ≈ 20g' },
  { nom: 'Lardons',                  categorie: 'charcuterie', calories100g: 340, proteines100g: 17,  glucides100g: 0,   lipides100g: 30  },
  { nom: 'Saucisson sec',            categorie: 'charcuterie', calories100g: 430, proteines100g: 25,  glucides100g: 1,   lipides100g: 36, note: '1 tranche ≈ 10g' },
  { nom: 'Chorizo',                  categorie: 'charcuterie', calories100g: 455, proteines100g: 24,  glucides100g: 2,   lipides100g: 39, note: '1 tranche ≈ 15g' },
  { nom: 'Boudin noir',              categorie: 'charcuterie', calories100g: 280, proteines100g: 16,  glucides100g: 9,   lipides100g: 20  },
  { nom: 'Mortadelle',               categorie: 'charcuterie', calories100g: 315, proteines100g: 15,  glucides100g: 2,   lipides100g: 28, note: '1 tranche ≈ 30g' },
  { nom: 'Rillettes de porc',        categorie: 'charcuterie', calories100g: 450, proteines100g: 14,  glucides100g: 0,   lipides100g: 44  },

  // ── Poissons & fruits de mer ──────────────────────────────────────────────
  { nom: 'Saumon frais',             categorie: 'poisson', calories100g: 208, proteines100g: 20,  glucides100g: 0,   lipides100g: 14  },
  { nom: 'Thon en boîte (naturel)',  categorie: 'poisson', calories100g: 116, proteines100g: 26,  glucides100g: 0,   lipides100g: 1   },
  { nom: 'Cabillaud',                categorie: 'poisson', calories100g: 82,  proteines100g: 18,  glucides100g: 0,   lipides100g: 1   },
  { nom: 'Maquereau',                categorie: 'poisson', calories100g: 205, proteines100g: 19,  glucides100g: 0,   lipides100g: 14  },
  { nom: 'Sardines en boîte',        categorie: 'poisson', calories100g: 191, proteines100g: 25,  glucides100g: 0,   lipides100g: 10  },
  { nom: 'Crevettes cuites',         categorie: 'poisson', calories100g: 99,  proteines100g: 21,  glucides100g: 0,   lipides100g: 1,  note: '100g ≈ 1 petite assiette' },
  { nom: 'Dorade',                   categorie: 'poisson', calories100g: 121, proteines100g: 20,  glucides100g: 0,   lipides100g: 4   },
  { nom: 'Truite',                   categorie: 'poisson', calories100g: 168, proteines100g: 20,  glucides100g: 0,   lipides100g: 9   },
  { nom: 'Moules cuites',            categorie: 'poisson', calories100g: 86,  proteines100g: 12,  glucides100g: 4,   lipides100g: 2   },
  { nom: 'Colin (lieu noir)',         categorie: 'poisson', calories100g: 81,  proteines100g: 17,  glucides100g: 0,   lipides100g: 1   },
  { nom: 'Sole',                     categorie: 'poisson', calories100g: 90,  proteines100g: 17,  glucides100g: 0,   lipides100g: 2   },

  // ── Féculents ────────────────────────────────────────────────────────────
  { nom: 'Riz blanc cuit',           categorie: 'feculents', calories100g: 130, proteines100g: 2.5, glucides100g: 28,  lipides100g: 0.3, note: '1 assiette ≈ 180g' },
  { nom: 'Riz complet cuit',         categorie: 'feculents', calories100g: 150, proteines100g: 3,   glucides100g: 31,  lipides100g: 1    },
  { nom: 'Pâtes cuites',             categorie: 'feculents', calories100g: 157, proteines100g: 5.5, glucides100g: 30,  lipides100g: 0.9, note: '1 assiette ≈ 200g' },
  { nom: 'Pomme de terre cuite',     categorie: 'feculents', calories100g: 87,  proteines100g: 2,   glucides100g: 20,  lipides100g: 0.1, note: '1 pomme de terre ≈ 150g' },
  { nom: 'Patate douce cuite',       categorie: 'feculents', calories100g: 90,  proteines100g: 2,   glucides100g: 21,  lipides100g: 0.1  },
  { nom: 'Couscous cuit',            categorie: 'feculents', calories100g: 112, proteines100g: 4,   glucides100g: 23,  lipides100g: 0.2, note: '1 assiette ≈ 180g' },
  { nom: 'Quinoa cuit',              categorie: 'feculents', calories100g: 120, proteines100g: 4,   glucides100g: 22,  lipides100g: 2    },
  { nom: 'Semoule cuite',            categorie: 'feculents', calories100g: 110, proteines100g: 4,   glucides100g: 23,  lipides100g: 0.1  },
  { nom: 'Pain blanc',               categorie: 'feculents', calories100g: 265, proteines100g: 8,   glucides100g: 49,  lipides100g: 3,   note: '1 tranche ≈ 30g' },
  { nom: 'Pain complet',             categorie: 'feculents', calories100g: 247, proteines100g: 9,   glucides100g: 45,  lipides100g: 3,   note: '1 tranche ≈ 30g' },
  { nom: 'Baguette',                 categorie: 'feculents', calories100g: 280, proteines100g: 9,   glucides100g: 55,  lipides100g: 1.5, note: '1 baguette ≈ 250g' },
  { nom: 'Flocons d\'avoine',        categorie: 'feculents', calories100g: 370, proteines100g: 13,  glucides100g: 60,  lipides100g: 7    },
  { nom: 'Polenta cuite',            categorie: 'feculents', calories100g: 72,  proteines100g: 1.7, glucides100g: 16,  lipides100g: 0.3  },
  { nom: 'Gnocchis',                 categorie: 'feculents', calories100g: 178, proteines100g: 4,   glucides100g: 37,  lipides100g: 1.5  },
  { nom: 'Boulgour cuit',            categorie: 'feculents', calories100g: 83,  proteines100g: 3,   glucides100g: 18,  lipides100g: 0.2  },

  // ── Légumes ───────────────────────────────────────────────────────────────
  { nom: 'Salade verte',             categorie: 'legumes', calories100g: 15,  proteines100g: 1.3, glucides100g: 2,   lipides100g: 0.2  },
  { nom: 'Tomate',                   categorie: 'legumes', calories100g: 18,  proteines100g: 0.9, glucides100g: 3.5, lipides100g: 0.2  },
  { nom: 'Concombre',                categorie: 'legumes', calories100g: 12,  proteines100g: 0.6, glucides100g: 2,   lipides100g: 0.1  },
  { nom: 'Carotte',                  categorie: 'legumes', calories100g: 41,  proteines100g: 0.9, glucides100g: 10,  lipides100g: 0.2  },
  { nom: 'Brocoli',                  categorie: 'legumes', calories100g: 34,  proteines100g: 2.8, glucides100g: 7,   lipides100g: 0.4  },
  { nom: 'Courgette',                categorie: 'legumes', calories100g: 17,  proteines100g: 1.2, glucides100g: 3.5, lipides100g: 0.3  },
  { nom: 'Poivron rouge',            categorie: 'legumes', calories100g: 31,  proteines100g: 1,   glucides100g: 6,   lipides100g: 0.3  },
  { nom: 'Épinards',                 categorie: 'legumes', calories100g: 23,  proteines100g: 2.9, glucides100g: 3.6, lipides100g: 0.4  },
  { nom: 'Champignons',              categorie: 'legumes', calories100g: 22,  proteines100g: 3.1, glucides100g: 3.3, lipides100g: 0.3  },
  { nom: 'Haricots verts',           categorie: 'legumes', calories100g: 31,  proteines100g: 1.8, glucides100g: 7,   lipides100g: 0.1  },
  { nom: 'Aubergine',                categorie: 'legumes', calories100g: 25,  proteines100g: 1,   glucides100g: 6,   lipides100g: 0.2  },
  { nom: 'Chou-fleur',               categorie: 'legumes', calories100g: 27,  proteines100g: 2,   glucides100g: 5,   lipides100g: 0.3  },
  { nom: 'Poireau',                  categorie: 'legumes', calories100g: 31,  proteines100g: 2,   glucides100g: 6,   lipides100g: 0.3  },
  { nom: 'Oignon',                   categorie: 'legumes', calories100g: 40,  proteines100g: 1.1, glucides100g: 9,   lipides100g: 0.1  },
  { nom: 'Céleri branche',           categorie: 'legumes', calories100g: 16,  proteines100g: 0.7, glucides100g: 3,   lipides100g: 0.2  },
  { nom: 'Asperges',                 categorie: 'legumes', calories100g: 20,  proteines100g: 2.2, glucides100g: 3.7, lipides100g: 0.1  },
  { nom: 'Petits pois',              categorie: 'legumes', calories100g: 81,  proteines100g: 5.4, glucides100g: 14,  lipides100g: 0.4  },
  { nom: 'Maïs en boîte',            categorie: 'legumes', calories100g: 86,  proteines100g: 3,   glucides100g: 19,  lipides100g: 1    },
  { nom: 'Betterave cuite',          categorie: 'legumes', calories100g: 44,  proteines100g: 1.7, glucides100g: 10,  lipides100g: 0.1  },
  { nom: 'Radis',                    categorie: 'legumes', calories100g: 16,  proteines100g: 0.7, glucides100g: 3.4, lipides100g: 0.1  },

  // ── Fruits ────────────────────────────────────────────────────────────────
  { nom: 'Pomme',                    categorie: 'fruits', calories100g: 52,  proteines100g: 0.3, glucides100g: 14,  lipides100g: 0.2, note: '1 pomme ≈ 150g' },
  { nom: 'Banane',                   categorie: 'fruits', calories100g: 89,  proteines100g: 1.1, glucides100g: 23,  lipides100g: 0.3, note: '1 banane ≈ 120g' },
  { nom: 'Orange',                   categorie: 'fruits', calories100g: 47,  proteines100g: 0.9, glucides100g: 12,  lipides100g: 0.1, note: '1 orange ≈ 150g' },
  { nom: 'Fraises',                  categorie: 'fruits', calories100g: 32,  proteines100g: 0.7, glucides100g: 8,   lipides100g: 0.3  },
  { nom: 'Raisin',                   categorie: 'fruits', calories100g: 69,  proteines100g: 0.7, glucides100g: 18,  lipides100g: 0.2  },
  { nom: 'Kiwi',                     categorie: 'fruits', calories100g: 61,  proteines100g: 1.1, glucides100g: 15,  lipides100g: 0.5, note: '1 kiwi ≈ 80g' },
  { nom: 'Mangue',                   categorie: 'fruits', calories100g: 60,  proteines100g: 0.8, glucides100g: 15,  lipides100g: 0.4  },
  { nom: 'Poire',                    categorie: 'fruits', calories100g: 57,  proteines100g: 0.4, glucides100g: 15,  lipides100g: 0.1, note: '1 poire ≈ 170g' },
  { nom: 'Ananas',                   categorie: 'fruits', calories100g: 50,  proteines100g: 0.5, glucides100g: 13,  lipides100g: 0.1  },
  { nom: 'Myrtilles',                categorie: 'fruits', calories100g: 57,  proteines100g: 0.7, glucides100g: 14,  lipides100g: 0.3  },
  { nom: 'Cerise',                   categorie: 'fruits', calories100g: 63,  proteines100g: 1,   glucides100g: 16,  lipides100g: 0.2  },
  { nom: 'Pastèque',                 categorie: 'fruits', calories100g: 30,  proteines100g: 0.6, glucides100g: 8,   lipides100g: 0.2  },

  // ── Produits laitiers ────────────────────────────────────────────────────
  { nom: 'Lait entier',              categorie: 'laitiers', calories100g: 61,  proteines100g: 3.2, glucides100g: 4.8, lipides100g: 3.3, note: '1 verre ≈ 200ml' },
  { nom: 'Lait demi-écrémé',         categorie: 'laitiers', calories100g: 46,  proteines100g: 3.2, glucides100g: 4.8, lipides100g: 1.6, note: '1 verre ≈ 200ml' },
  { nom: 'Yaourt nature entier',     categorie: 'laitiers', calories100g: 59,  proteines100g: 3.8, glucides100g: 4.7, lipides100g: 3.1, note: '1 pot ≈ 125g' },
  { nom: 'Yaourt 0%',                categorie: 'laitiers', calories100g: 36,  proteines100g: 4.1, glucides100g: 5.2, lipides100g: 0.1, note: '1 pot ≈ 125g' },
  { nom: 'Fromage blanc 0%',         categorie: 'laitiers', calories100g: 45,  proteines100g: 8,   glucides100g: 4,   lipides100g: 0.2  },
  { nom: 'Fromage blanc 20%',        categorie: 'laitiers', calories100g: 79,  proteines100g: 8,   glucides100g: 4,   lipides100g: 3    },
  { nom: 'Emmental',                 categorie: 'laitiers', calories100g: 380, proteines100g: 28,  glucides100g: 0,   lipides100g: 30,  note: '1 tranche ≈ 25g' },
  { nom: 'Camembert',                categorie: 'laitiers', calories100g: 264, proteines100g: 18,  glucides100g: 1,   lipides100g: 21,  note: '1 portion ≈ 30g' },
  { nom: 'Mozzarella',               categorie: 'laitiers', calories100g: 280, proteines100g: 18,  glucides100g: 2,   lipides100g: 22   },
  { nom: 'Parmesan',                 categorie: 'laitiers', calories100g: 431, proteines100g: 38,  glucides100g: 0,   lipides100g: 30,  note: '1 c.à.s ≈ 10g' },
  { nom: 'Chèvre frais',             categorie: 'laitiers', calories100g: 220, proteines100g: 14,  glucides100g: 1,   lipides100g: 18   },
  { nom: 'Crème fraîche épaisse',    categorie: 'laitiers', calories100g: 292, proteines100g: 2.2, glucides100g: 2.8, lipides100g: 30,  note: '1 c.à.s ≈ 20g' },
  { nom: 'Beurre',                   categorie: 'laitiers', calories100g: 751, proteines100g: 0.7, glucides100g: 0.6, lipides100g: 83,  note: '1 noisette ≈ 5g' },

  // ── Œufs ─────────────────────────────────────────────────────────────────
  { nom: 'Œuf entier',               categorie: 'oeufs', calories100g: 155, proteines100g: 13,  glucides100g: 1.1, lipides100g: 11, note: '1 œuf ≈ 60g' },
  { nom: 'Blanc d\'œuf',             categorie: 'oeufs', calories100g: 52,  proteines100g: 11,  glucides100g: 0.7, lipides100g: 0.2, note: '1 blanc ≈ 35g' },

  // ── Matières grasses ──────────────────────────────────────────────────────
  { nom: 'Huile d\'olive',           categorie: 'matiereGrasse', calories100g: 884, proteines100g: 0, glucides100g: 0,   lipides100g: 100, note: '1 c.à.s ≈ 10g' },
  { nom: 'Huile de tournesol',       categorie: 'matiereGrasse', calories100g: 884, proteines100g: 0, glucides100g: 0,   lipides100g: 100, note: '1 c.à.s ≈ 10g' },
  { nom: 'Huile de coco',            categorie: 'matiereGrasse', calories100g: 900, proteines100g: 0, glucides100g: 0,   lipides100g: 100  },
  { nom: 'Margarine',                categorie: 'matiereGrasse', calories100g: 720, proteines100g: 0.5, glucides100g: 0.5, lipides100g: 80  },
  { nom: 'Mayonnaise',               categorie: 'matiereGrasse', calories100g: 680, proteines100g: 1.5, glucides100g: 3,  lipides100g: 75,  note: '1 c.à.s ≈ 15g' },
  { nom: 'Vinaigrette',              categorie: 'matiereGrasse', calories100g: 500, proteines100g: 0.2, glucides100g: 3,  lipides100g: 55,  note: '1 c.à.s ≈ 10g' },

  // ── Légumineuses ──────────────────────────────────────────────────────────
  { nom: 'Lentilles cuites',         categorie: 'legumineuses', calories100g: 116, proteines100g: 9,   glucides100g: 20,  lipides100g: 0.4  },
  { nom: 'Pois chiches cuits',       categorie: 'legumineuses', calories100g: 164, proteines100g: 9,   glucides100g: 27,  lipides100g: 3    },
  { nom: 'Haricots rouges cuits',    categorie: 'legumineuses', calories100g: 127, proteines100g: 8.7, glucides100g: 22,  lipides100g: 0.5  },
  { nom: 'Haricots blancs cuits',    categorie: 'legumineuses', calories100g: 127, proteines100g: 8.7, glucides100g: 22,  lipides100g: 0.5  },
  { nom: 'Fèves cuites',             categorie: 'legumineuses', calories100g: 110, proteines100g: 8,   glucides100g: 19,  lipides100g: 0.5  },
  { nom: 'Tofu nature',              categorie: 'legumineuses', calories100g: 76,  proteines100g: 8,   glucides100g: 1.9, lipides100g: 4.8  },
  { nom: 'Edamame',                  categorie: 'legumineuses', calories100g: 122, proteines100g: 11,  glucides100g: 10,  lipides100g: 5    },

  // ── Sucres & douceurs ─────────────────────────────────────────────────────
  { nom: 'Sucre blanc',              categorie: 'sucre', calories100g: 400, proteines100g: 0,   glucides100g: 100, lipides100g: 0,  note: '1 c.à.c ≈ 5g' },
  { nom: 'Miel',                     categorie: 'sucre', calories100g: 304, proteines100g: 0.3, glucides100g: 82,  lipides100g: 0,  note: '1 c.à.s ≈ 20g' },
  { nom: 'Confiture',                categorie: 'sucre', calories100g: 250, proteines100g: 0.5, glucides100g: 63,  lipides100g: 0,  note: '1 c.à.s ≈ 20g' },
  { nom: 'Nutella',                  categorie: 'sucre', calories100g: 539, proteines100g: 6,   glucides100g: 57,  lipides100g: 31, note: '1 c.à.s ≈ 20g' },
  { nom: 'Chocolat noir 70%',        categorie: 'sucre', calories100g: 560, proteines100g: 5.5, glucides100g: 57,  lipides100g: 33, note: '1 carré ≈ 10g' },
  { nom: 'Chocolat au lait',         categorie: 'sucre', calories100g: 535, proteines100g: 8,   glucides100g: 58,  lipides100g: 30, note: '1 carré ≈ 10g' },

  // ── Divers ────────────────────────────────────────────────────────────────
  { nom: 'Sauce tomate',             categorie: 'divers', calories100g: 45,  proteines100g: 1.5, glucides100g: 8,   lipides100g: 1    },
  { nom: 'Noix',                     categorie: 'divers', calories100g: 654, proteines100g: 15,  glucides100g: 14,  lipides100g: 65,  note: '1 noix ≈ 10g' },
  { nom: 'Amandes',                  categorie: 'divers', calories100g: 579, proteines100g: 21,  glucides100g: 22,  lipides100g: 50,  note: '1 poignée ≈ 25g' },
  { nom: 'Cacahuètes',               categorie: 'divers', calories100g: 567, proteines100g: 26,  glucides100g: 16,  lipides100g: 49,  note: '1 poignée ≈ 25g' },
  { nom: 'Bouillon de légumes',      categorie: 'divers', calories100g: 10,  proteines100g: 0.5, glucides100g: 2,   lipides100g: 0    },
  { nom: 'Ketchup',                  categorie: 'divers', calories100g: 112, proteines100g: 1.5, glucides100g: 27,  lipides100g: 0.1, note: '1 c.à.s ≈ 15g' },
  { nom: 'Moutarde',                 categorie: 'divers', calories100g: 60,  proteines100g: 4,   glucides100g: 5,   lipides100g: 3,   note: '1 c.à.c ≈ 5g' },
  { nom: 'Crème de soja',            categorie: 'divers', calories100g: 150, proteines100g: 1.5, glucides100g: 4,   lipides100g: 14   },
];
