import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 파일 업로드
async function uploadFileWithSupabase(event: any, userinfo: any) {
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

    // multipart 폼 데이터 파싱
    const form = await readMultipartFormData(event);
    if (!form || form.length === 0) {
      setResponseStatus(event, 400);
      return useResponseError('업로드할 파일이 없습니다.');
    }

    const fileItem = form.find(item => item.name === 'file');
    if (!fileItem || !fileItem.data || !fileItem.filename) {
      setResponseStatus(event, 400);
      return useResponseError('유효한 파일이 아닙니다.');
    }

    // 쿼리 파라미터에서 버킷 정보 추출
    const query = getQuery(event);
    const bucketName = (query.bucket as string) || 'user-uploads';
    const category = (query.category as string) || 'general';
    const isPublic = query.public !== 'false';

    // 파일 확장자 및 MIME 타입 검증
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf', 'text/plain', 'text/csv',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const mimeType = fileItem.type || 'application/octet-stream';
    if (!allowedMimeTypes.includes(mimeType)) {
      setResponseStatus(event, 400);
      return useResponseError('지원하지 않는 파일 형식입니다.');
    }

    // 파일 크기 제한 (10MB)
    const maxFileSize = 10 * 1024 * 1024;
    if (fileItem.data.length > maxFileSize) {
      setResponseStatus(event, 400);
      return useResponseError('파일 크기는 10MB 이하여야 합니다.');
    }

    // 고유한 파일명 생성
    const fileExtension = fileItem.filename.split('.').pop() || '';
    const uniqueFileName = `${category}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

    // Supabase Storage에 파일 업로드
    const { data: uploadResult, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(uniqueFileName, fileItem.data, {
        contentType: mimeType,
        upsert: false
      });

    if (uploadError) {
      console.error('파일 업로드 실패:', uploadError);
      return useResponseError('파일 업로드에 실패했습니다: ' + uploadError.message);
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uniqueFileName);

    // 이미지인지 확인 및 메타데이터 추출
    const isImage = mimeType.startsWith('image/');
    let width, height;

    if (isImage && mimeType !== 'image/svg+xml') {
      // 간단한 이미지 크기 추출 (실제 구현에서는 sharp 등을 사용할 수 있음)
      try {
        // 여기서는 기본값으로 설정
        width = null;
        height = null;
      } catch (error) {
        console.warn('이미지 크기 추출 실패:', error);
      }
    }

    // 파일 업로드 기록 저장
    const { data: fileRecord, error: recordError } = await supabase
      .from('file_uploads')
      .insert({
        original_name: fileItem.filename,
        file_name: uniqueFileName,
        file_path: uploadResult.path,
        file_size: fileItem.data.length,
        mime_type: mimeType,
        bucket_name: bucketName,
        alt_text: query.alt_text as string || '',
        description: query.description as string || '',
        tags: query.tags ? JSON.parse(query.tags as string) : [],
        width,
        height,
        is_image: isImage,
        uploaded_by: user.id,
        is_public: isPublic,
        access_level: isPublic ? 'public' : 'private'
      })
      .select()
      .single();

    if (recordError) {
      console.error('파일 기록 저장 실패:', recordError);
      // 파일은 업로드되었지만 기록 저장 실패 - 파일 삭제
      await supabase.storage.from(bucketName).remove([uniqueFileName]);
      return useResponseError('파일 업로드 기록 저장에 실패했습니다.');
    }

    return useResponseSuccess({
      id: fileRecord.id,
      url: urlData.publicUrl,
      originalName: fileRecord.original_name,
      fileName: fileRecord.file_name,
      fileSize: fileRecord.file_size,
      mimeType: fileRecord.mime_type,
      bucket: fileRecord.bucket_name,
      isImage: fileRecord.is_image,
      width: fileRecord.width,
      height: fileRecord.height,
      isPublic: fileRecord.is_public,
      uploadedAt: fileRecord.uploaded_at,
      message: '파일이 성공적으로 업로드되었습니다.'
    });

  } catch (error) {
    console.error('Supabase 파일 업로드 오류:', error);
    return useResponseError('파일 업로드 중 오류가 발생했습니다.');
  }
}

// Mock 파일 업로드 (기존)
function uploadFileWithMock() {
  // Mock에서는 기존과 동일하게 고정 URL 반환
  console.log('Mock 파일 업로드');

  return useResponseSuccess({
    id: Date.now().toString(),
    url: 'https://unpkg.com/@vbenjs/static-source@0.1.7/source/logo-v1.webp',
    originalName: 'logo-v1.webp',
    fileName: 'mock-file.webp',
    fileSize: 12345,
    mimeType: 'image/webp',
    bucket: 'user-uploads',
    isImage: true,
    isPublic: true,
    uploadedAt: new Date().toISOString(),
    message: 'Mock 파일 업로드 완료'
  });
}

export default eventHandler(async (event) => {
  // POST 메서드만 허용
  if (getMethod(event) !== 'POST') {
    setResponseStatus(event, 405);
    return useResponseError('POST 메서드만 지원합니다.');
  }

  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase = process.env.VITE_USE_SUPABASE === 'true' ||
                     process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 파일 업로드');
    return await uploadFileWithSupabase(event, userinfo);
  } else {
    console.log('🔄 Mock 파일 업로드');
    return uploadFileWithMock();
  }
});
