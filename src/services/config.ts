/**
 * Centralized runtime configuration — single source of truth for env.
 * No secrets are hardcoded here. All values come from Vite env (.env).
 * Missing values degrade gracefully to offline-first local mode.
 */

function readEnv(key: string): string {
  try {
    const v = (import.meta as unknown as { env?: Record<string, string> }).env?.[key];
    return typeof v === 'string' ? v.trim() : '';
  } catch {
    return '';
  }
}

export const appConfig = {
  isDev: readEnv('DEV') === 'true' || readEnv('NODE_ENV') !== 'production',
  ai: {
    primaryProvider: readEnv('AI_PRIMARY_PROVIDER') || 'google-ai',
    fallbackProvider: readEnv('AI_FALLBACK_PROVIDER') || 'openrouter',
    autoFallback: (readEnv('AI_ENABLE_AUTO_FALLBACK') || 'true') === 'true',
    googleKey: readEnv('GOOGLE_AI_API_KEY') || readEnv('VITE_GOOGLE_AI_API_KEY'),
    openRouterKey: readEnv('OPENROUTER_API_KEY') || readEnv('VITE_OPENROUTER_API_KEY'),
  },
  firebase: {
    apiKey: readEnv('VITE_FIREBASE_API_KEY'),
    authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    databaseURL: readEnv('VITE_FIREBASE_DATABASE_URL'),
    projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: readEnv('VITE_FIREBASE_APP_ID'),
    measurementId: readEnv('VITE_FIREBASE_MEASUREMENT_ID'),
  },
  cloudinary: {
    cloudName: readEnv('VITE_CLOUDINARY_CLOUD_NAME'),
  },
  weather: {
    provider: readEnv('VITE_WEATHER_PROVIDER') || 'open-meteo',
    openWeatherKey: readEnv('VITE_OPENWEATHER_API_KEY'),
  },
} as const;

export function isFirebaseConfigured(): boolean {
  const f = appConfig.firebase;
  return Boolean(f.apiKey && f.authDomain && f.databaseURL && f.projectId && f.appId);
}

export function isAIConfigured(): boolean {
  return Boolean(appConfig.ai.googleKey || appConfig.ai.openRouterKey);
}
