const KEY = 'musicon:post_login_redirect';

/** Guarda a dónde debe volver el usuario después de iniciar sesión — sobrevive
 * recargas completas de página, a diferencia del state de React Router, por lo
 * que también funciona con el redirect de OAuth (Google). */
export function saveIntendedPath(path: string) {
  try {
    // Nunca guardamos /login ni la home como "intención" — no tiene sentido
    // volver ahí después de loguearse.
    if (path === '/login' || path === '/') return;
    sessionStorage.setItem(KEY, path);
  } catch {
    // sessionStorage puede fallar (modo privado, cuota) — no es crítico.
  }
}

/** Lee la ruta guardada sin borrarla — útil para armar el redirectTo de OAuth
 * antes de salir de la app. */
export function peekIntendedPath(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Lee y borra la ruta guardada — se usa una sola vez, al volver de loguearse. */
export function takeIntendedPath(): string | null {
  const path = peekIntendedPath();
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // no-op
  }
  return path;
}
