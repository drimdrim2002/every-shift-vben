import { verifyAccessToken } from '~/utils/jwt-utils';
import { MOCK_CODES } from '~/utils/mock-data';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 토큰 검증 함수
async function verifySupabaseToken(event: any) {
  try {
    // @ts-ignore - 동적 import
    const { supabase } = await import('@vben/utils');

    const authHeader = getHeader(event, 'Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];

    // Supabase 토큰으로 사용자 정보 조회
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return null;
    }

    // 사용자 프로필 정보 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      id: data.user.id,
      username: profile?.username || data.user.email?.split('@')[0] || '',
      email: data.user.email,
      realName: profile?.full_name || profile?.username || '',
    };
  } catch (error) {
    console.error('Supabase 토큰 검증 실패:', error);
    return null;
  }
}

export default defineEventHandler(async (event) => {
  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase =
    process.env.VITE_USE_SUPABASE === 'true' ||
    process.env.USE_SUPABASE === 'true';

  let userinfo = null;

  if (useSupabase) {
    console.log('🔄 Supabase Token 검증 사용');
    userinfo = await verifySupabaseToken(event);
  } else {
    console.log('🔄 Mock Token 검증 사용');
    userinfo = verifyAccessToken(event);
  }

  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const codes =
    MOCK_CODES.find((item) => item.username === userinfo.username)?.codes ?? [];

  return useResponseSuccess(codes);
});
