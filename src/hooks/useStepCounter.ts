import { useCallback, useEffect, useRef, useState } from 'react';

const SEUIL = 11.5;    // m/s² — magnitude avec gravité : marche ≈ 12-15, repos ≈ 9.8
const COOLDOWN_MS = 350; // min 350ms entre deux pas (~170 pas/min max)

export interface StepCounterState {
  actif: boolean;
  supporté: boolean;
  erreur: string | null;
  demarrer: () => Promise<void>;
  arreter: () => void;
}

export function useStepCounter(
  onNouveauPas: (totalDepuisDemarrage: number) => void,
): StepCounterState {
  const [actif, setActif] = useState(false);
  const [supporté, setSupporté] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const compteurRef = useRef(0);
  const dernierPasRef = useRef(0);
  const picDetecteRef = useRef(false);
  const callbackRef = useRef(onNouveauPas);

  useEffect(() => { callbackRef.current = onNouveauPas; }, [onNouveauPas]);

  useEffect(() => {
    setSupporté('DeviceMotionEvent' in window);
  }, []);

  const demarrer = useCallback(async () => {
    if (!('DeviceMotionEvent' in window)) {
      setErreur('Accéléromètre non disponible sur cet appareil');
      return;
    }
    // iOS 13+ requires explicit permission
    const dme = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof dme.requestPermission === 'function') {
      try {
        const perm = await dme.requestPermission();
        if (perm !== 'granted') { setErreur('Permission refusée'); return; }
      } catch {
        setErreur('Impossible de demander la permission');
        return;
      }
    }
    compteurRef.current = 0;
    dernierPasRef.current = 0;
    picDetecteRef.current = false;
    setErreur(null);
    setActif(true);
  }, []);

  const arreter = useCallback(() => setActif(false), []);

  useEffect(() => {
    if (!actif) return;

    const handleMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);
      const now = Date.now();

      if (mag > SEUIL && !picDetecteRef.current && now - dernierPasRef.current >= COOLDOWN_MS) {
        picDetecteRef.current = true;
        dernierPasRef.current = now;
        compteurRef.current += 1;
        callbackRef.current(compteurRef.current);
      } else if (mag <= SEUIL) {
        picDetecteRef.current = false;
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [actif]);

  return { actif, supporté, erreur, demarrer, arreter };
}
