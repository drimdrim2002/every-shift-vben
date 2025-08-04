import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 파일 정보 수정
async function updateFileWithSupabase(event: any, userinfo: any, fileId: string, updateData: any) {
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

    // 기존 파일 정보 조회
    const { data: existingFile, error: findError } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('id', fileId)
      .single();

    if (findError || !existingFile) {
      setResponseStatus(event, 404);
      return useResponseError('파일을 찾을 수 없습니다.');
    }

    // 관리자인지 확인
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(ur => ['super', 'admin'].includes(ur.role));

    // 권한 확인 - 파일 소유자이거나 관리자여야 수정 가능
    if (!isAdmin && existingFile.uploaded_by !== user.id) {
      setResponseStatus(event, 403);
      return useResponseError('파일 수정 권한이 없습니다.');
    }

    // 수정할 데이터 준비
    const dataToUpdate: any = {
      updated_at: new Date().toISOString(),
    };

    // 허용된 필드만 업데이트
    if (updateData.altText !== undefined) dataToUpdate.alt_text = updateData.altText;
    if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
    if (updateData.tags !== undefined) dataToUpdate.tags = Array.isArray(updateData.tags) ? updateData.tags : [];
    if (updateData.isPublic !== undefined) {
      dataToUpdate.is_public = updateData.isPublic;
      dataToUpdate.access_level = updateData.isPublic ? 'public' : 'private';
    }

    // 파일 정보 업데이트
    const { data: updatedFile, error: updateError } = await supabase
      .from('file_uploads')
      .update(dataToUpdate)
      .eq('id', fileId)
      .select()
      .single();

    if (updateError) {
      console.error('파일 정보 업데이트 실패:', updateError);
      return useResponseError('파일 정보 업데이트에 실패했습니다: ' + updateError.message);
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from(updatedFile.bucket_name)
      .getPublicUrl(updatedFile.file_name);

    return useResponseSuccess({
      id: updatedFile.id,
      url: urlData.publicUrl,
      originalName: updatedFile.original_name,
      fileName: updatedFile.file_name,
      fileSize: updatedFile.file_size,
      mimeType: updatedFile.mime_type,
      bucket: updatedFile.bucket_name,
      altText: updatedFile.alt_text,
      description: updatedFile.description,
      tags: updatedFile.tags || [],
      width: updatedFile.width,
      height: updatedFile.height,
      isImage: updatedFile.is_image,
      isPublic: updatedFile.is_public,
      accessLevel: updatedFile.access_level,
      uploadedBy: updatedFile.uploaded_by,
      uploadedAt: updatedFile.uploaded_at,
      createdAt: updatedFile.created_at,
      updatedAt: updatedFile.updated_at,
      message: '파일 정보가 성공적으로 업데이트되었습니다.',
    });

  } catch (error) {
    console.error('Supabase 파일 정보 수정 오류:', error);
    return useResponseError('파일 정보 수정 중 오류가 발생했습니다.');
  }
}

// Mock 파일 정보 수정
function updateFileWithMock(fileId: string, updateData: any) {
  // Mock에서는 단순히 업데이트된 데이터 반환
  console.log('Mock 파일 정보 수정:', { fileId, updateData });

  return useResponseSuccess({
    id: fileId,
    url: 'https://unpkg.com/@vbenjs/static-source@0.1.7/source/logo-v1.webp',
    originalName: 'logo-v1.webp',
    fileName: 'general/mock-file.webp',
    fileSize: 12345,
    mimeType: 'image/webp',
    bucket: 'user-uploads',
    altText: updateData.altText || 'Updated alt text',
    description: updateData.description || 'Updated description',
    tags: updateData.tags || ['updated'],
    isImage: true,
    isPublic: updateData.isPublic ?? true,
    accessLevel: updateData.isPublic ? 'public' : 'private',
    updatedAt: new Date().toISOString(),
    message: '파일 정보가 성공적으로 업데이트되었습니다.',
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

  // 요청 데이터 검증
  const body = await readBody(event);

  // 유효성 검사
  if (body.tags && !Array.isArray(body.tags)) {
    setResponseStatus(event, 400);
    return useResponseError('태그는 배열 형태여야 합니다.');
  }

  if (body.isPublic !== undefined && typeof body.isPublic !== 'boolean') {
    setResponseStatus(event, 400);
    return useResponseError('isPublic 필드는 boolean 값이어야 합니다.');
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase = process.env.VITE_USE_SUPABASE === 'true' ||
                     process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 파일 정보 수정');
    return await updateFileWithSupabase(event, userinfo, fileId, body);
  } else {
    console.log('🔄 Mock 파일 정보 수정');
    return updateFileWithMock(fileId, body);
  }
});
