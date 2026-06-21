const CLIENT_ID_KEY  = 'fitchallenge_gfit_clientid';
const TOKEN_KEY      = 'fitchallenge_gfit_token';
const TOKEN_EXP_KEY  = 'fitchallenge_gfit_expiry';
const SCOPE          = 'https://www.googleapis.com/auth/fitness.activity.read';

export function getClientId(): string {
  return localStorage.getItem(CLIENT_ID_KEY) ?? '';
}
export function setClientId(id: string) {
  localStorage.setItem(CLIENT_ID_KEY, id.trim());
}

export function getToken(): string | null {
  const token  = localStorage.getItem(TOKEN_KEY);
  const expiry = parseInt(localStorage.getItem(TOKEN_EXP_KEY) ?? '0');
  if (!token || Date.now() > expiry) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXP_KEY);
    return null;
  }
  return token;
}

export function isConnecte(): boolean {
  return !!getToken();
}

export function deconnecter() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXP_KEY);
}

export async function connecter(clientId: string): Promise<boolean> {
  return new Promise((resolve) => {
    const params = new URLSearchParams({
      client_id:     clientId,
      redirect_uri:  window.location.origin + '/gfit-callback',
      response_type: 'token',
      scope:         SCOPE,
    });

    const popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      'google_fit_auth',
      'width=520,height=640,popup=1',
    );
    if (!popup) { resolve(false); return; }

    const timer = setInterval(() => {
      try {
        if (popup.closed) { clearInterval(timer); resolve(false); return; }
        const url = new URL(popup.location.href);
        if (url.origin === window.location.origin) {
          const hash  = new URLSearchParams(url.hash.slice(1));
          const token = hash.get('access_token');
          const exp   = parseInt(hash.get('expires_in') ?? '3600');
          popup.close();
          clearInterval(timer);
          if (token) {
            localStorage.setItem(TOKEN_KEY, token);
            // 1 min de marge avant expiration
            localStorage.setItem(TOKEN_EXP_KEY, String(Date.now() + (exp - 60) * 1000));
            resolve(true);
          } else {
            resolve(false);
          }
        }
      } catch { /* cross-origin : popup toujours chez Google */ }
    }, 500);
  });
}

export async function recupererPasAujourdhui(): Promise<number | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);

    const res = await fetch(
      'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
      {
        method: 'POST',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: 'com.google.step_count.delta',
            dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
          }],
          bucketByTime:    { durationMillis: 86_400_000 },
          startTimeMillis: debutJour.getTime(),
          endTimeMillis:   Date.now(),
        }),
      },
    );

    if (res.status === 401) { deconnecter(); return null; }
    if (!res.ok) return null;

    const data = await res.json();
    const points = data.bucket?.[0]?.dataset?.[0]?.point ?? [];
    return points.reduce((s: number, p: any) => s + (p.value?.[0]?.intVal ?? 0), 0);
  } catch {
    return null;
  }
}
