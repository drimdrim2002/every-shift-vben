// / <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_KEY: string;
  readonly VITE_SUPABASE_PROJECT_SERVICE_ROLE?: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_ENV: 'development' | 'production' | 'staging';
  readonly VITE_API_URL?: string;
  readonly VITE_TESTING_USER_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
