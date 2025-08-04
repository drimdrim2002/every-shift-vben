import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 사용자 정보 조회
async function getUserInfoWithSupabase(event: any) {
  try {
    // @ts-ignore - 동적 import
    const { supabase } = await import('@vben/utils');

    // Authorization 헤더에서 토큰 가져오기
    const authHeader = getHeader(event, 'Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return unAuthorizedResponse(event);
    }

    const token = authHeader.split(' ')[1];

    // Supabase에서 사용자 정보 조회
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return unAuthorizedResponse(event);
    }

    // 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.warn('Profile 조회 실패, 기본값 사용:', profileError);
    }

    // 사용자 역할 조회
    const { data: userRoles } = await supabase
      .rpc('get_user_roles', { user_id: user.id })
      .then(result => result)
      .catch(() => ({ data: ['user'] }));

    // 사용자 권한 조회
    const { data: userPermissions } = await supabase
      .rpc('get_user_permissions', { user_id: user.id })
      .then(result => result)
      .catch(() => ({ data: [] }));

    // 응답 데이터 구성 (기존 mock 형식과 호환)
    const userData = {
      id: user.id,
      username: profile?.username || user.email?.split('@')[0] || '',
      realName: profile?.full_name || profile?.username || '',
      roles: userRoles || ['user'],
      codes: userPermissions?.map((p: any) => p.name) || [],
      homePath: profile?.department === 'admin' ? '/workspace' : '/analytics',
      email: user.email,
      avatar: profile?.avatar_url,
      phone: profile?.phone,
      address: profile?.address,
      company: profile?.company,
      jobTitle: profile?.job_title,
      department: profile?.department,
      bio: profile?.bio,
      isActive: profile?.is_active ?? true,
    };

    return useResponseSuccess(userData);

  } catch (error) {
    console.error('Supabase 사용자 정보 조회 오류:', error);
    return unAuthorizedResponse(event);
  }
}

// Mock 사용자 정보 조회 (기존)
function getUserInfoWithMock(event: any) {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }
  return useResponseSuccess(userinfo);
}

export default eventHandler(async (event) => {
  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase = process.env.VITE_USE_SUPABASE === 'true' ||
                     process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 사용자 정보 조회');
    return await getUserInfoWithSupabase(event);
  } else {
    console.log('🔄 Mock 사용자 정보 조회');
    return getUserInfoWithMock(event);
  }
});
