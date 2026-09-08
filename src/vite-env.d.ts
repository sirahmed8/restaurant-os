/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_DATABASE_URL?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string;
  readonly CLOUDINARY_API_KEY?: string;
  readonly CLOUDINARY_FOLDER?: string;
  readonly GOOGLE_AI_API_KEY?: string;
  readonly VITE_GOOGLE_AI_API_KEY?: string;
  readonly OPENROUTER_API_KEY?: string;
  readonly VITE_OPENROUTER_API_KEY?: string;
  readonly VITE_OPENWEATHER_API_KEY?: string;
  readonly VITE_OWNER_EMAIL?: string;
  readonly AI_PRIMARY_PROVIDER?: string;
  readonly AI_FALLBACK_PROVIDER?: string;
  readonly AI_ENABLE_AUTO_FALLBACK?: string;
  readonly AI_MODEL_FAST?: string;
  readonly AI_MODEL_SMART?: string;
  readonly AI_MODEL_LITE?: string;
  readonly AI_MODEL_HEAVY?: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
