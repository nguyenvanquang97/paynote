export interface ApiConfig {
  port: number;
  databaseUrl: string;
  supabaseJwtSecret: string;
  supabaseJwksUrl: string;
  geminiApiKey: string;
  allowedOrigin: string;
}

const requireEnv = (key: string): string => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

export const getConfig = (): ApiConfig => ({
  port: Number(process.env.PORT || 3000),
  databaseUrl: requireEnv('DATABASE_URL'),
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET?.trim() || '',
  supabaseJwksUrl: process.env.SUPABASE_JWKS_URL?.trim() || '',
  geminiApiKey: process.env.GEMINI_API_KEY?.trim() || '',
  allowedOrigin: process.env.ALLOWED_ORIGIN?.trim() || '*',
});
