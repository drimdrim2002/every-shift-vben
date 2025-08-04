import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from '~/utils/cookie-utils';
import { generateAccessToken, generateRefreshToken } from '~/utils/jwt-utils';
import { forbiddenResponse } from '~/utils/response';

// Supabase 로그인 로직
async function loginWithSupabase(event: any, email: string, password: string) {
  // @ts-ignore - 동적 import
  const { supabase } = await import('@vben/utils');

  try {
    // 1. Supabase Auth로 로그인
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.user) {
      clearRefreshTokenCookie(event);
      return forbiddenResponse(event, 'Username or password is incorrect.');
    }

    // 2. 사용자 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.warn('Profile 조회 실패, 기본값 사용:', profileError);
    }

    // 3. 사용자 역할 조회
    const { data: userRoles } = await supabase
      .rpc('get_user_roles', { user_id: authData.user.id })
      .then((result) => result)
      .catch(() => ({ data: ['user'] })); // 기본 역할

    // 4. 응답 데이터 구성 (기존 mock 형식과 호환)
    const userData = {
      id: authData.user.id,
      username: profile?.username || authData.user.email?.split('@')[0] || '',
      realName:
        profile?.full_name ||
        profile?.username ||
        authData.user.email?.split('@')[0] ||
        '',
      roles: userRoles || ['user'],
      homePath: profile?.department === 'admin' ? '/workspace' : '/analytics',
      email: authData.user.email,
    };

    // 5. 세션 토큰을 쿠키에 저장
    if (authData.session?.refresh_token) {
      setRefreshTokenCookie(event, authData.session.refresh_token);
    }

    return useResponseSuccess({
      ...userData,
      accessToken: authData.session?.access_token,
    });
  } catch (error) {
    console.error('Supabase 로그인 오류:', error);
    return forbiddenResponse(event, 'Authentication failed.');
  }
}

// Mock 로그인 로직 (기존)
function loginWithMock(event: any, username: string, password: string) {
  const findUser = MOCK_USERS.find(
    (item) => item.username === username && item.password === password,
  );

  if (!findUser) {
    clearRefreshTokenCookie(event);
    return forbiddenResponse(event, 'Username or password is incorrect.');
  }

  const accessToken = generateAccessToken(findUser);
  const refreshToken = generateRefreshToken(findUser);

  setRefreshTokenCookie(event, refreshToken);

  return useResponseSuccess({
    ...findUser,
    accessToken,
  });
}

export default defineEventHandler(async (event) => {
  const { password, email } = await readBody(event);

  if (!password || !email) {
    setResponseStatus(event, 400);
    return useResponseError(
      'BadRequestException',
      'Email and password are required',
    );
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase =
    process.env.VITE_USE_SUPABASE === 'true' ||
    process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase Auth 사용');
    return await loginWithSupabase(event, email, password);
  } else {
    console.log('🔄 Mock Auth 사용');
    return loginWithMock(event, email?.split('@')[0] || '', password);
  }
});
