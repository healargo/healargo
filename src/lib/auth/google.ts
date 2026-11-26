/**
 * Auth.js reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET by default.
 * Also accept GOOGLE_CLIENT_* aliases used in some Google Cloud docs.
 */
export function getGoogleAuthCredentials() {
  const clientId =
    process.env.AUTH_GOOGLE_ID?.trim() ||
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    "";
  const clientSecret =
    process.env.AUTH_GOOGLE_SECRET?.trim() ||
    process.env.GOOGLE_CLIENT_SECRET?.trim() ||
    "";

  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isGoogleAuthEnabled(): boolean {
  return getGoogleAuthCredentials() !== null;
}
