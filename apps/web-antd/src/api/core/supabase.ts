import type { User } from '@supabase/supabase-js';

import { supabase } from '@vben/utils';

export namespace SupabaseApi {
  /** Supabase 로그인 매개변수 */
  export interface LoginParams {
    email: string;
    password: string;
  }

  /** Supabase 로그인 결과 */
  export interface LoginResult {
    user: User;
    session: any;
    accessToken: string;
  }

  /** 사용자 정보 */
  export interface UserInfo {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
    profile?: {
      avatar_url?: string;
      full_name?: string;
      id: string;
      updated_at: string;
      username: string;
      website?: string;
    };
  }

  /** 파일 업로드 결과 */
  export interface FileUploadResult {
    id: string;
    url: string;
    originalName: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    bucket: string;
    isImage: boolean;
    isPublic: boolean;
    uploadedAt: string;
  }
}

/**
 * Supabase 직접 로그인
 */
export async function supabaseLoginApi(
  params: SupabaseApi.LoginParams,
): Promise<SupabaseApi.LoginResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });

  if (error) {
    throw new Error(`로그인 실패: ${error.message}`);
  }

  if (!data.user || !data.session) {
    throw new Error('로그인 데이터가 유효하지 않습니다.');
  }

  return {
    user: data.user,
    session: data.session,
    accessToken: data.session.access_token,
  };
}

/**
 * Supabase 로그아웃
 */
export async function supabaseLogoutApi(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`로그아웃 실패: ${error.message}`);
  }
}

/**
 * Supabase 현재 사용자 정보 조회
 */
export async function supabaseGetUserInfoApi(): Promise<SupabaseApi.UserInfo> {
  // 현재 사용자 가져오기
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('사용자 정보를 가져올 수 없습니다.');
  }

  try {
    // 사용자 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // 데이터가 없는 경우가 아닌 실제 오류
      console.warn('프로필 조회 실패:', profileError);
    }

    // 사용자 역할 조회
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.warn('역할 조회 실패:', rolesError);
    }

    const roles = userRoles?.map((ur) => ur.role) || [];

    // 사용자 권한 조회 (RPC 함수 사용)
    const { data: permissions, error: permissionsError } = await supabase.rpc(
      'get_user_permissions',
      { target_user_id: user.id },
    );

    if (permissionsError) {
      console.warn('권한 조회 실패:', permissionsError);
    }

    return {
      id: user.id,
      email: user.email || '',
      roles,
      permissions: permissions || [],
      profile: profile || undefined,
    };
  } catch (error) {
    console.error('사용자 정보 조회 중 오류:', error);

    // 최소한의 정보라도 반환
    return {
      id: user.id,
      email: user.email || '',
      roles: [],
      permissions: [],
    };
  }
}

/**
 * Supabase 토큰 새로고침
 */
export async function supabaseRefreshTokenApi(): Promise<string> {
  const { data, error } = await supabase.auth.refreshSession();

  if (error || !data.session) {
    throw new Error(
      `토큰 새로고침 실패: ${error?.message || '세션이 유효하지 않습니다.'}`,
    );
  }

  return data.session.access_token;
}

/**
 * Supabase Storage 파일 업로드
 */
export async function supabaseUploadFileApi(
  file: File,
  bucket: string = 'user-uploads',
  path?: string,
): Promise<SupabaseApi.FileUploadResult> {
  // 고유한 파일 경로 생성
  const fileExtension = file.name.split('.').pop() || '';
  const uniquePath =
    path ||
    `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExtension}`;

  // Supabase Storage에 업로드
  const { data: uploadResult, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(uniquePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`파일 업로드 실패: ${uploadError.message}`);
  }

  // 공개 URL 생성
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(uniquePath);

  // 현재 사용자 ID 가져오기
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 파일 메타데이터 저장
  const { data: fileRecord, error: recordError } = await supabase
    .from('file_uploads')
    .insert({
      original_name: file.name,
      file_name: uniquePath,
      file_path: uploadResult.path,
      file_size: file.size,
      mime_type: file.type,
      bucket_name: bucket,
      is_image: file.type.startsWith('image/'),
      uploaded_by: user?.id,
      is_public: true,
      access_level: 'public',
    })
    .select()
    .single();

  if (recordError) {
    console.warn('파일 메타데이터 저장 실패:', recordError);
  }

  return {
    id: fileRecord?.id || Date.now().toString(),
    url: urlData.publicUrl,
    originalName: file.name,
    fileName: uniquePath,
    fileSize: file.size,
    mimeType: file.type,
    bucket,
    isImage: file.type.startsWith('image/'),
    isPublic: true,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Supabase Storage 파일 삭제
 */
export async function supabaseDeleteFileApi(
  bucket: string,
  path: string,
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`파일 삭제 실패: ${error.message}`);
  }
}

/**
 * Supabase Storage 파일 목록 조회
 */
export async function supabaseListFilesApi(
  bucket: string,
  folder: string = '',
): Promise<any[]> {
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 100,
    offset: 0,
  });

  if (error) {
    throw new Error(`파일 목록 조회 실패: ${error.message}`);
  }

  return data || [];
}

/**
 * 환경 변수에서 Supabase 사용 여부 확인
 */
export function isSupabaseEnabled(): boolean {
  return import.meta.env.VITE_USE_SUPABASE === 'true';
}

/**
 * Supabase 연결 상태 확인
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    return !error;
  } catch (error) {
    console.error('Supabase 연결 확인 실패:', error);
    return false;
  }
}
