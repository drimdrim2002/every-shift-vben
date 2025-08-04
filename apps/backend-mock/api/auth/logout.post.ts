import {
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie,
} from '~/utils/cookie-utils';

// Supabase 로그아웃 로직
async function logoutWithSupabase(event: any) {
  try {
    // @ts-ignore - 동적 import
    const { supabase } = await import('@vben/utils');

    // Supabase에서 로그아웃
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.warn('Supabase 로그아웃 중 오류:', error);
      // 오류가 있어도 로컬 쿠키는 정리
    }

    clearRefreshTokenCookie(event);
    return useResponseSuccess('Logout successful');
  } catch (error) {
    console.error('Supabase 로그아웃 오류:', error);
    // 오류가 있어도 로컬 쿠키는 정리
    clearRefreshTokenCookie(event);
    return useResponseSuccess('Logout completed with warnings');
  }
}

// Mock 로그아웃 로직 (기존)
function logoutWithMock(event: any) {
  clearRefreshTokenCookie(event);
  return useResponseSuccess('Logout successful');
}

export default defineEventHandler(async (event) => {
  const refreshToken = getRefreshTokenFromCookie(event);
  if (!refreshToken) {
    return useResponseSuccess('Already logged out');
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase =
    process.env.VITE_USE_SUPABASE === 'true' ||
    process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 로그아웃');
    return await logoutWithSupabase(event);
  } else {
    console.log('🔄 Mock 로그아웃');
    return logoutWithMock(event);
  }
});
