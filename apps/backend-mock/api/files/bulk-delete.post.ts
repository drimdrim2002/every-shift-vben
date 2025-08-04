import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 파일 일괄 삭제
async function bulkDeleteFilesWithSupabase(event: any, userinfo: any, fileIds: string[]) {
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

    // 관리자인지 확인
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(ur => ['super', 'admin'].includes(ur.role));

    // 삭제할 파일들 조회
    let fileQuery = supabase
      .from('file_uploads')
      .select('*')
      .in('id', fileIds);

    // 관리자가 아니면 자신의 파일만 조회
    if (!isAdmin) {
      fileQuery = fileQuery.eq('uploaded_by', user.id);
    }

    const { data: filesToDelete, error: findError } = await fileQuery;

    if (findError) {
      console.error('파일 조회 실패:', findError);
      return useResponseError('파일 조회 중 오류가 발생했습니다.');
    }

    if (!filesToDelete || filesToDelete.length === 0) {
      setResponseStatus(event, 404);
      return useResponseError('삭제할 파일을 찾을 수 없습니다.');
    }

    const successfulDeletions: any[] = [];
    const failedDeletions: any[] = [];

    // 각 파일을 순차적으로 삭제
    for (const file of filesToDelete) {
      try {
        // Supabase Storage에서 파일 삭제
        const { error: storageDeleteError } = await supabase.storage
          .from(file.bucket_name)
          .remove([file.file_name]);

        if (storageDeleteError) {
          console.error(`Storage 파일 삭제 실패 (${file.id}):`, storageDeleteError);
          failedDeletions.push({
            id: file.id,
            originalName: file.original_name,
            error: storageDeleteError.message,
          });
          continue;
        }

        // 데이터베이스에서 파일 기록 삭제
        const { error: dbDeleteError } = await supabase
          .from('file_uploads')
          .delete()
          .eq('id', file.id);

        if (dbDeleteError) {
          console.error(`파일 기록 삭제 실패 (${file.id}):`, dbDeleteError);
          failedDeletions.push({
            id: file.id,
            originalName: file.original_name,
            error: dbDeleteError.message,
          });
        } else {
          successfulDeletions.push({
            id: file.id,
            originalName: file.original_name,
          });
        }
      } catch (error) {
        console.error(`파일 삭제 중 오류 (${file.id}):`, error);
        failedDeletions.push({
          id: file.id,
          originalName: file.original_name,
          error: '알 수 없는 오류가 발생했습니다.',
        });
      }
    }

    return useResponseSuccess({
      totalRequested: fileIds.length,
      totalFound: filesToDelete.length,
      successCount: successfulDeletions.length,
      failureCount: failedDeletions.length,
      successfulDeletions,
      failedDeletions,
      message: `${successfulDeletions.length}개 파일이 성공적으로 삭제되었습니다.${failedDeletions.length > 0 ? ` ${failedDeletions.length}개 파일 삭제에 실패했습니다.` : ''}`,
    });

  } catch (error) {
    console.error('Supabase 파일 일괄 삭제 오류:', error);
    return useResponseError('파일 일괄 삭제 중 오류가 발생했습니다.');
  }
}

// Mock 파일 일괄 삭제
function bulkDeleteFilesWithMock(fileIds: string[]) {
  // Mock에서는 모든 삭제가 성공한다고 가정
  const successfulDeletions = fileIds.map(id => ({
    id,
    originalName: `mock-file-${id}.jpg`,
  }));

  console.log('Mock 파일 일괄 삭제:', fileIds);

  return useResponseSuccess({
    totalRequested: fileIds.length,
    totalFound: fileIds.length,
    successCount: fileIds.length,
    failureCount: 0,
    successfulDeletions,
    failedDeletions: [],
    message: `${fileIds.length}개 파일이 성공적으로 삭제되었습니다.`,
  });
}

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 요청 데이터 검증
  const body = await readBody(event);

  if (!Array.isArray(body.fileIds) || body.fileIds.length === 0) {
    setResponseStatus(event, 400);
    return useResponseError('삭제할 파일 ID 목록이 필요합니다.');
  }

  const fileIds = body.fileIds;

  // ID 유효성 검증
  for (const id of fileIds) {
    if (!id || typeof id !== 'string') {
      setResponseStatus(event, 400);
      return useResponseError('올바른 파일 ID 형식이 아닙니다.');
    }
  }

  // 최대 삭제 개수 제한
  if (fileIds.length > 50) {
    setResponseStatus(event, 400);
    return useResponseError('한 번에 최대 50개 파일까지만 삭제할 수 있습니다.');
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase = process.env.VITE_USE_SUPABASE === 'true' ||
                     process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 파일 일괄 삭제');
    return await bulkDeleteFilesWithSupabase(event, userinfo, fileIds);
  } else {
    console.log('🔄 Mock 파일 일괄 삭제');
    return bulkDeleteFilesWithMock(fileIds);
  }
});
