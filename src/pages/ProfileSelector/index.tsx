import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dumbbell, ChevronRight, UserPlus } from 'lucide-react';
import { db } from '../../db/database';
import { useStore } from '../../store/useStore';

export function ProfileSelector() {
  const navigate = useNavigate();
  const { definirUtilisateurActif, chargerUser, chargerJournee } = useStore();

  const users = useLiveQuery(() => db.users.toArray(), []) ?? [];
  const pesees = useLiveQuery(() => db.pesees.toArray(), []) ?? [];

  const choisirProfil = async (userId: number) => {
    definirUtilisateurActif(userId);
    await chargerUser();
    await chargerJournee();
    navigate('/');
  };

  const dernierPoids = (userId: number) => {
    const p = pesees.filter((x) => x.userId === userId).sort((a, b) => b.date.localeCompare(a.date));
    return p[0]?.poids ?? null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-teal-500 flex flex-col items-center justify-center p-6">
      {/* En-tête */}
      <div className="text-center mb-10 text-white">
        <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-4">
          <Dumbbell size={40} className="text-white" />
        </div>
        <h1 className="text-4xl font-black tracking-tight">FitChallenge</h1>
        <p className="text-green-100 mt-2">Choisissez votre profil</p>
      </div>

      {/* Liste des profils */}
      <div className="w-full max-w-sm space-y-3">
        {users.map((u) => {
          const poids = dernierPoids(u.id!);
          const initiale = u.prenom.charAt(0).toUpperCase();
          return (
            <button
              key={u.id}
              onClick={() => choisirProfil(u.id!)}
              className="w-full bg-white dark:bg-gray-800 rounded-3xl p-4 flex items-center gap-4 shadow-xl active:scale-95 transition-transform text-left"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
                {initiale}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 dark:text-white text-lg">{u.prenom}</p>
                <p className="text-sm text-slate-400">
                  Objectif : {u.poidsObjectif} kg
                  {poids && ` · Actuel : ${poids} kg`}
                </p>
                <p className="text-xs text-slate-300 dark:text-slate-500 mt-0.5">
                  Depuis le {format(new Date(u.createdAt), 'd MMMM yyyy', { locale: fr })}
                </p>
              </div>
              <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
            </button>
          );
        })}

        {/* Nouveau profil */}
        <button
          onClick={() => navigate('/onboarding')}
          className="w-full border-2 border-white/50 rounded-3xl p-4 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
        >
          <UserPlus size={18} /> Nouveau profil
        </button>
      </div>

      <p className="text-green-200 text-xs mt-8 text-center">
        Chaque profil a ses propres données, stockées sur cet appareil
      </p>
    </div>
  );
}
