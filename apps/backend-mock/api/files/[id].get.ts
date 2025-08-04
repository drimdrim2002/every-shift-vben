import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 파일 상세 조회
async function getFileDetailWithSupabase(event: any, userinfo: any, fileId: string) {
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
      .select(`
        *,
        uploader:uploaded_by (
          email
        )
      `)
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

    // 권한 확인 - 공개 파일이거나, 파일 소유자이거나, 관리자여야 조회 가능
    if (!fileRecord.is_public && !isAdmin && fileRecord.uploaded_by !== user.id) {
      setResponseStatus(event, 403);
      return useResponseError('파일 조회 권한이 없습니다.');
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from(fileRecord.bucket_name)
      .getPublicUrl(fileRecord.file_name);

    // 서명된 URL 생성 (비공개 파일의 경우)
    let signedUrl = null;
    if (!fileRecord.is_public) {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(fileRecord.bucket_name)
        .createSignedUrl(fileRecord.file_name, 3600); // 1시간 유효

      if (!signedUrlError) {
        signedUrl = signedUrlData.signedUrl;
      }
    }

    return useResponseSuccess({
      id: fileRecord.id,
      url: fileRecord.is_public ? urlData.publicUrl : signedUrl,
      publicUrl: urlData.publicUrl,
      signedUrl,
      originalName: fileRecord.original_name,
      fileName: fileRecord.file_name,
      filePath: fileRecord.file_path,
      fileSize: fileRecord.file_size,
      mimeType: fileRecord.mime_type,
      bucket: fileRecord.bucket_name,
      altText: fileRecord.alt_text,
      description: fileRecord.description,
      tags: fileRecord.tags || [],
      width: fileRecord.width,
      height: fileRecord.height,
      isImage: fileRecord.is_image,
      isPublic: fileRecord.is_public,
      accessLevel: fileRecord.access_level,
      uploadedBy: fileRecord.uploaded_by,
      uploaderEmail: fileRecord.uploader?.email,
      uploadedAt: fileRecord.uploaded_at,
      createdAt: fileRecord.created_at,
      updatedAt: fileRecord.updated_at,
    });

  } catch (error) {
    console.error('Supabase 파일 상세 조회 오류:', error);
    return useResponseError('파일 상세 조회 중 오류가 발생했습니다.');
  }
}

// Mock 파일 상세 조회
function getFileDetailWithMock(fileId: string) {
  // Mock 파일 상세 데이터
  const mockFileDetail = {
    id: fileId,
    url: 'https://unpkg.com/@vbenjs/static-source@0.1.7/source/logo-v1.webp',
    publicUrl: 'https://unpkg.com/@vbenjs/static-source@0.1.7/source/logo-v1.webp',
    signedUrl: null,
    originalName: 'logo-v1.webp',
    fileName: 'general/mock-file.webp',
    filePath: 'general/mock-file.webp',
    fileSize: 12345,
    mimeType: 'image/webp',
    bucket: 'user-uploads',
    altText: 'Mock logo image',
    description: 'This is a mock file for testing purposes',
    tags: ['logo', 'mock', 'test'],
    width: 200,
    height: 200,
    isImage: true,
    isPublic: true,
    accessLevel: 'public',
    uploadedBy: 'mock-user-id',
    uploaderEmail: 'user@example.com',
    uploadedAt: '2024-01-01T10:00:00Z',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  };

  console.log('Mock 파일 상세 조회:', fileId);

  return useResponseSuccess(mockFileDetail);
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
    console.log('🔄 Supabase 파일 상세 조회');
    return await getFileDetailWithSupabase(event, userinfo, fileId);
  } else {
    console.log('🔄 Mock 파일 상세 조회');
    return getFileDetailWithMock(fileId);
  }
});
