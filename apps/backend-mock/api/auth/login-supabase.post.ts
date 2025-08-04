import { supabase } from '@vben/utils';
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie
} from '~/utils/cookie-utils';
import { forbiddenResponse } from '~/utils/response';

export default defineEventHandler(async (event) => {
  const { password, username, email } = await readBody(event);

  // username과 email 중 하나는 필수
  const loginEmail = email || `${username}@vben.local`;

  if (!password || (!username && !email)) {
    setResponseStatus(event, 400);
    return useResponseError(
      'BadRequestException',
      'Username/Email and password are required',
    );
  }

  try {
    // 1. Supabase Auth로 로그인
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: password,
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
      console.error('Profile 조회 실패:', profileError);
      return forbiddenResponse(event, 'User profile not found.');
    }

    // 3. 사용자 역할 조회
    const { data: userRoles, error: roleError } = await supabase
      .rpc('get_user_roles', { user_id: authData.user.id });

    if (roleError) {
      console.error('사용자 역할 조회 실패:', roleError);
    }

    // 4. 사용자 권한 조회
    const { data: userPermissions, error: permError } = await supabase
      .rpc('get_user_permissions', { user_id: authData.user.id });

    if (permError) {
      console.error('사용자 권한 조회 실패:', permError);
    }

    // 5. 응답 데이터 구성 (기존 mock 형식과 호환)
    const userData = {
      id: profile.id,
      username: profile.username || authData.user.email?.split('@')[0] || '',
      realName: profile.full_name || profile.username || '',
      roles: userRoles || [],
      codes: userPermissions?.map((p: any) => p.name) || [],
      homePath: profile.department === 'admin' ? '/workspace' : '/analytics',
      email: authData.user.email,
      avatar: profile.avatar_url,
      phone: profile.phone,
      address: profile.address,
      company: profile.company,
      jobTitle: profile.job_title,
      department: profile.department,
      bio: profile.bio,
      isActive: profile.is_active,
    };

    // 6. 세션 토큰을 쿠키에 저장 (기존 방식과 호환)
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
});
