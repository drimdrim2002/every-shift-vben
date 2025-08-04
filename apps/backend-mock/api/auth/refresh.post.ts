import {
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie,
  setRefreshTokenCookie,
} from '~/utils/cookie-utils';
import { verifyRefreshToken, generateAccessToken } from '~/utils/jwt-utils';
import { forbiddenResponse } from '~/utils/response';

// Supabase 리프레시 로직
async function refreshWithSupabase(event: any, refreshToken: string) {
  try {
    // @ts-ignore - 동적 import
    const { supabase } = await import('@vben/utils');

    // Supabase 세션 갱신
    const { data: authData, error: authError } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (authError || !authData.session) {
      clearRefreshTokenCookie(event);
      return forbiddenResponse(event);
    }

    // 새 리프레시 토큰 저장
    if (authData.session.refresh_token) {
      setRefreshTokenCookie(event, authData.session.refresh_token);
    }

    return useResponseSuccess({
      accessToken: authData.session.access_token,
    });

  } catch (error) {
    console.error('Supabase 토큰 갱신 오류:', error);
    clearRefreshTokenCookie(event);
    return forbiddenResponse(event);
  }
}

// Mock 리프레시 로직 (기존)
function refreshWithMock(event: any, refreshToken: string) {
  const userinfo = verifyRefreshToken(refreshToken);
  if (!userinfo) {
    return forbiddenResponse(event);
  }

  const findUser = MOCK_USERS.find(
    (item) => item.username === userinfo.username,
  );
  if (!findUser) {
    return forbiddenResponse(event);
  }

  const accessToken = generateAccessToken(findUser);
  setRefreshTokenCookie(event, refreshToken);

  return useResponseSuccess({
    accessToken,
  });
}

export default defineEventHandler(async (event) => {
  const refreshToken = getRefreshTokenFromCookie(event);
  if (!refreshToken) {
    return forbiddenResponse(event);
  }

  clearRefreshTokenCookie(event);

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase = process.env.VITE_USE_SUPABASE === 'true' ||
                     process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 토큰 갱신');
    return await refreshWithSupabase(event, refreshToken);
  } else {
    console.log('🔄 Mock 토큰 갱신');
    return refreshWithMock(event, refreshToken);
  }
});
