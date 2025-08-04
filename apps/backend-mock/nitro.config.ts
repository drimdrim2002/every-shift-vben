import errorHandler from './error';

process.env.COMPATIBILITY_DATE = new Date().toISOString();

// 환경 변수 기본값 설정 (Supabase 모드 활성화)
process.env.USE_SUPABASE = process.env.USE_SUPABASE || 'true';
process.env.VITE_USE_SUPABASE = process.env.VITE_USE_SUPABASE || 'true';
process.env.VITE_SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || 'https://kkxchntkzopfrpnvzzth.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreGNobnRrem9wZnJwbnZ6enRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTEyNDgsImV4cCI6MjA2OTc4NzI0OH0.wcRVKBmlsBBXBfOJ8Vypit-b47gRFVvecp1TVxonvmU';

export default defineNitroConfig({
  devErrorHandler: errorHandler,
  errorHandler: '~/error',
  runtimeConfig: {
    // 서버 사이드 환경 변수
    useSupabase: process.env.USE_SUPABASE,
    public: {
      // 클라이언트 사이드 환경 변수
      useSupabase: process.env.VITE_USE_SUPABASE,
      supabaseUrl: process.env.VITE_SUPABASE_URL,
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
    },
  },
  routeRules: {
    '/api/**': {
      cors: true,
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers':
          'Accept, Authorization, Content-Length, Content-Type, If-Match, If-Modified-Since, If-None-Match, If-Unmodified-Since, X-CSRF-TOKEN, X-Requested-With',
        'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': '*',
      },
    },
  },
});
