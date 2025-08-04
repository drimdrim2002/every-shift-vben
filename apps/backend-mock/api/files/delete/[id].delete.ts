import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 파일 삭제
async function deleteFileWithSupabase(event: any, userinfo: any, fileId: string) {
  try {
    // @ts-ignore - 동적 import
    const { supabase } = await import('@vben/utils');

    // 현재 사용자 ID 가져오기
    const authHeader = getHeader(event, 'Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return unAuthorizedResponse(event);
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return unAuthorizedResponse(event);
    }

    // 파일 정보 조회
    const { data: fileRecord, error: findError } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('id', fileId)
      .single();

    if (findError || !fileRecord) {
      setResponseStatus(event, 404);
      return useResponseError('파일을 찾을 수 없습니다.');
    }

    // 관리자인지 확인
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(ur => ['super', 'admin'].includes(ur.role));

    // 권한 확인 - 파일 소유자이거나 관리자여야 삭제 가능
    if (!isAdmin && fileRecord.uploaded_by !== user.id) {
      setResponseStatus(event, 403);
      return useResponseError('파일 삭제 권한이 없습니다.');
    }

    // Supabase Storage에서 실제 파일 삭제
    const { error: storageDeleteError } = await supabase.storage
      .from(fileRecord.bucket_name)
      .remove([fileRecord.file_name]);

    if (storageDeleteError) {
      console.error('Storage 파일 삭제 실패:', storageDeleteError);
      return useResponseError('파일 삭제에 실패했습니다: ' + storageDeleteError.message);
    }

    // 데이터베이스에서 파일 기록 삭제
    const { error: dbDeleteError } = await supabase
      .from('file_uploads')
      .delete()
      .eq('id', fileId);

    if (dbDeleteError) {
      console.error('파일 기록 삭제 실패:', dbDeleteError);
      return useResponseError('파일 기록 삭제에 실패했습니다.');
    }

    return useResponseSuccess({
      id: fileId,
      originalName: fileRecord.original_name,
      message: '파일이 성공적으로 삭제되었습니다.',
    });

  } catch (error) {
    console.error('Supabase 파일 삭제 오류:', error);
    return useResponseError('파일 삭제 중 오류가 발생했습니다.');
  }
}

// Mock 파일 삭제
function deleteFileWithMock(fileId: string) {
  // Mock에서는 단순히 성공 응답만 반환
  console.log('Mock 파일 삭제:', fileId);

  return useResponseSuccess({
    id: fileId,
    originalName: 'mock-file.webp',
    message: '파일이 성공적으로 삭제되었습니다.',
  });
}

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 경로에서 파일 ID 추출
  const fileId = getRouterParam(event, 'id');
  if (!fileId) {
    setResponseStatus(event, 400);
    return useResponseError('파일 ID가 필요합니다.');
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase = process.env.VITE_USE_SUPABASE === 'true' ||
                     process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 파일 삭제');
    return await deleteFileWithSupabase(event, userinfo, fileId);
  } else {
    console.log('🔄 Mock 파일 삭제');
    return deleteFileWithMock(fileId);
  }
});
