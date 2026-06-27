interface MacroBarProps {
  emoji: string;
  label: string;
  consomme: number;
  objectif: number;
  couleur: string;   // bg color Tailwind (ex: 'bg-blue-500')
  bgClair: string;   // bg léger (ex: 'bg-blue-50 dark:bg-blue-900/20')
  textColor: string; // text color (ex: 'text-blue-600')
}

export function MacroBar({ emoji, label, consomme, objectif, couleur, bgClair, textColor }: MacroBarProps) {
  const pct    = objectif > 0 ? consomme / objectif : 0;
  const depasse = consomme > objectif;
  const reste   = objectif - consomme;
  const largeur = Math.min(pct * 100, 100);

  const couleurBarre = pct > 1.1 ? 'bg-red-500' : pct > 1 ? 'bg-orange-400' : couleur;
  const couleurTexte = pct > 1.1 ? 'text-red-500' : pct > 1 ? 'text-orange-500' : textColor;

  return (
    <div className={`${bgClair} rounded-xl p-3 space-y-1.5`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-slate-700 dark:text-gray-200 flex items-center gap-1">
          <span>{emoji}</span>
          <span>{label}</span>
        </span>
        <span className={`text-sm font-black tabular-nums ${couleurTexte}`}>
          {Math.round(consomme)}g
          <span className="font-medium text-slate-400 dark:text-slate-500"> / {objectif}g</span>
          {depasse && (
            <span className={`ml-1 text-xs font-bold ${couleurTexte}`}>
              (+{Math.round(consomme - objectif)}g)
            </span>
          )}
        </span>
      </div>

      {/* Barre de progression */}
      <div className="h-2 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${couleurBarre}`}
          style={{ width: `${largeur}%` }}
        />
      </div>

      {/* Texte reste / dépassé */}
      <p className={`text-xs ${depasse ? couleurTexte : 'text-slate-400 dark:text-slate-500'}`}>
        {depasse
          ? `Dépassé de ${Math.round(consomme - objectif)}g`
          : `Reste : ${Math.round(reste)}g`}
      </p>
    </div>
  );
}
