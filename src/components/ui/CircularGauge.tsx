interface Props {
  valeur: number;
  objectif: number;
  taille?: number;
}

export function CircularGauge({ valeur, objectif, taille = 200 }: Props) {
  const ratio = Math.min(valeur / Math.max(objectif, 1), 1);
  const epaisseur = 10;
  const rayon = (taille - epaisseur * 2) / 2;
  const circonference = 2 * Math.PI * rayon;
  const offset = circonference * (1 - ratio);
  const centre = taille / 2;
  const restant = Math.max(objectif - valeur, 0);
  const depasse = valeur > objectif;
  const pct = Math.round(ratio * 100);

  const couleur = depasse ? '#ef4444' : ratio > 0.85 ? '#f97316' : '#16a34a';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={taille} height={taille} className="-rotate-90">
        <circle
          cx={centre} cy={centre} r={rayon}
          fill="none" stroke="#f1f5f9"
          strokeWidth={epaisseur}
        />
        <circle
          cx={centre} cy={centre} r={rayon}
          fill="none" stroke={couleur}
          strokeWidth={epaisseur}
          strokeLinecap="round"
          strokeDasharray={circonference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>

      <div className="absolute flex flex-col items-center">
        <span className="text-[11px] font-semibold tracking-widest uppercase text-slate-400 mb-1">
          {depasse ? 'Dépassé' : 'Restant'}
        </span>
        <span
          className="font-black tabular-nums leading-none"
          style={{ fontSize: taille * 0.19, color: couleur }}
        >
          {depasse ? `+${valeur - objectif}` : restant}
        </span>
        <span className="text-[11px] font-medium text-slate-400 mt-1">kcal</span>
        <div className="mt-2 flex items-center gap-1.5">
          <div className="h-1 w-16 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: couleur }}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
        </div>
        <span className="text-[10px] text-slate-300 mt-1">{valeur} / {objectif} kcal</span>
      </div>
    </div>
  );
}
