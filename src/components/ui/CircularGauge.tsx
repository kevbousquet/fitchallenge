interface Props {
  valeur: number;      // calories consommées
  objectif: number;   // objectif calorique
  taille?: number;    // diamètre en px
}

export function CircularGauge({ valeur, objectif, taille = 180 }: Props) {
  const ratio = Math.min(valeur / Math.max(objectif, 1), 1);
  const rayon = (taille - 20) / 2;
  const circonference = 2 * Math.PI * rayon;
  const offset = circonference * (1 - ratio);
  const centre = taille / 2;
  const restant = Math.max(objectif - valeur, 0);
  const depasse = valeur > objectif;

  // Couleur selon la progression
  const couleur = depasse
    ? '#ef4444'                // rouge si dépassé
    : ratio > 0.85
    ? '#f97316'                // orange si proche
    : '#22c55e';               // vert sinon

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={taille} height={taille} className="-rotate-90">
        {/* Piste de fond */}
        <circle
          cx={centre}
          cy={centre}
          r={rayon}
          fill="none"
          stroke="currentColor"
          className="text-gray-100 dark:text-gray-700"
          strokeWidth={12}
        />
        {/* Arc de progression */}
        <circle
          cx={centre}
          cy={centre}
          r={rayon}
          fill="none"
          stroke={couleur}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circonference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>

      {/* Texte centré */}
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">
          {restant}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {depasse ? 'dépassé' : 'kcal restantes'}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {valeur} / {objectif}
        </span>
      </div>
    </div>
  );
}
