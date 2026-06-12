// Checked-in default env module. Keep secrets empty here.
// Local secrets are written to runtimeEnv.local.ts by scripts/with-env.js.
export const RUNTIME_ENV = {
  GEMINI_API_KEY: '',
  GOOGLE_API_KEY: '',
  OPENAI_API_KEY: '',
  PAYNOTE_AI_PROVIDER: '',
  PAYNOTE_AI_API_KEY: '',
  PAYNOTE_AI_PROXY_URL: '',
  PAYNOTE_AI_PROXY_TOKEN: '',
  PAYNOTE_AI_MODEL: '',
  PAYNOTE_AI_LOCAL_ONLY: '',
  PAYNOTE_AI_TIMEOUT_MS: '',
  PAYNOTE_API_URL: '',
  PAYNOTE_AUTH_REDIRECT_URL: '',
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
} as const;
