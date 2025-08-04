import type { SupabaseClient } from '@supabase/supabase-js';

import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase 설정 가져오기 (브라우저와 Node.js 환경 모두 지원)
function getEnvVar(key: string): string | undefined {
  // 브라우저 환경 (Vite)
  if (typeof window !== 'undefined') {
    try {
      // import.meta가 존재하고 env 속성이 있는지 확인
      if (import.meta !== undefined && (import.meta as any).env) {
        const value = (import.meta as any).env[key];
        if (value) {
          return value;
        }
      }

      // 환경 변수가 없으면 디버깅 정보 출력
      console.warn(`브라우저 환경에서 ${key} 환경 변수를 찾을 수 없습니다.`);
      console.warn('import.meta:', typeof import.meta);
      console.warn('import.meta.env:', (import.meta as any)?.env);
    } catch (error) {
      console.warn(`환경 변수 로딩 오류 (${key}):`, error);
    }
  }

  // Node.js 환경 (Nitro)
  // eslint-disable-next-line n/prefer-global/process
  if (globalThis.process !== undefined && globalThis.process.env) {
    // eslint-disable-next-line n/prefer-global/process
    return globalThis.process.env[key];
  }

  return undefined;
}

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// 환경 변수 검증 및 디버깅
console.warn('Supabase 환경 변수 로딩 결과:');
console.warn('VITE_SUPABASE_URL:', supabaseUrl ? '✓ 설정됨' : '✗ 없음');
console.warn(
  'VITE_SUPABASE_ANON_KEY:',
  supabaseAnonKey ? '✓ 설정됨' : '✗ 없음',
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일에 다음 변수들을 추가해주세요:\n' +
      'VITE_SUPABASE_URL=your_supabase_url\n' +
      'VITE_SUPABASE_ANON_KEY=your_supabase_anon_key',
  );
  console.warn(
    '현재 환경:',
    typeof window === 'undefined' ? 'Node.js' : '브라우저',
  );
}

// Supabase 클라이언트 생성
export const supabase: SupabaseClient = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      // 실시간 기능 설정
      params: {
        eventsPerSecond: 10,
      },
    },
  },
);

// Supabase 연결 여부 확인 함수
export const isSupabaseEnabled = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

// 개발 모드에서 Supabase 사용 여부 확인 (브라우저와 Node.js 환경 모두 지원)
export const useSupabaseInDev = (): boolean => {
  const useSupabase = getEnvVar('VITE_USE_SUPABASE');
  return useSupabase === 'true';
};

export default supabase;
