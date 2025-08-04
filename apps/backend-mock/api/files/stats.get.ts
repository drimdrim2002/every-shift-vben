import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 파일 통계 조회
async function getFileStatsWithSupabase(event: any, userinfo: any) {
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

    // 기본 쿼리
    let baseQuery = supabase.from('file_uploads');

    // 관리자가 아니면 자신의 파일만 조회
    if (!isAdmin) {
      baseQuery = baseQuery.select('*').eq('uploaded_by', user.id);
    } else {
      baseQuery = baseQuery.select('*');
    }

    // 전체 통계
    const { data: allFiles, error: allFilesError } = await baseQuery;

    if (allFilesError) {
      console.error('파일 통계 조회 실패:', allFilesError);
      return useResponseError('파일 통계 조회에 실패했습니다.');
    }

    // 통계 계산
    const totalFiles = allFiles?.length || 0;
    const totalSize = allFiles?.reduce((sum, file) => sum + file.file_size, 0) || 0;
    const imageFiles = allFiles?.filter(file => file.is_image).length || 0;
    const publicFiles = allFiles?.filter(file => file.is_public).length || 0;
    const privateFiles = totalFiles - publicFiles;

    // 버킷별 통계
    const bucketStats = allFiles?.reduce((acc, file) => {
      if (!acc[file.bucket_name]) {
        acc[file.bucket_name] = {
          bucket: file.bucket_name,
          fileCount: 0,
          totalSize: 0,
          imageCount: 0,
          publicCount: 0,
          privateCount: 0,
        };
      }

      acc[file.bucket_name].fileCount++;
      acc[file.bucket_name].totalSize += file.file_size;
      if (file.is_image) acc[file.bucket_name].imageCount++;
      if (file.is_public) acc[file.bucket_name].publicCount++;
      else acc[file.bucket_name].privateCount++;

      return acc;
    }, {} as Record<string, any>) || {};

    // MIME 타입별 통계
    const mimeTypeStats = allFiles?.reduce((acc, file) => {
      const mainType = file.mime_type.split('/')[0];
      if (!acc[mainType]) {
        acc[mainType] = {
          type: mainType,
          count: 0,
          size: 0,
        };
      }
      acc[mainType].count++;
      acc[mainType].size += file.file_size;
      return acc;
    }, {} as Record<string, any>) || {};

    // 최근 업로드 파일들 (최대 5개)
    const recentFiles = allFiles
      ?.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
      .slice(0, 5)
      .map(file => ({
        id: file.id,
        originalName: file.original_name,
        fileSize: file.file_size,
        mimeType: file.mime_type,
        uploadedAt: file.uploaded_at,
        isImage: file.is_image,
      })) || [];

    // 크기별 분포
    const sizeDistribution = {
      small: allFiles?.filter(f => f.file_size < 1024 * 1024).length || 0, // < 1MB
      medium: allFiles?.filter(f => f.file_size >= 1024 * 1024 && f.file_size < 10 * 1024 * 1024).length || 0, // 1MB - 10MB
      large: allFiles?.filter(f => f.file_size >= 10 * 1024 * 1024).length || 0, // > 10MB
    };

    return useResponseSuccess({
      overview: {
        totalFiles,
        totalSize,
        imageFiles,
        documentFiles: totalFiles - imageFiles,
        publicFiles,
        privateFiles,
        averageSize: totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0,
      },
      bucketStats: Object.values(bucketStats),
      mimeTypeStats: Object.values(mimeTypeStats),
      sizeDistribution,
      recentFiles,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Supabase 파일 통계 조회 오류:', error);
    return useResponseError('파일 통계 조회 중 오류가 발생했습니다.');
  }
}

// Mock 파일 통계 조회
function getFileStatsWithMock() {
  // Mock 통계 데이터
  const mockStats = {
    overview: {
      totalFiles: 25,
      totalSize: 52428800, // ~50MB
      imageFiles: 18,
      documentFiles: 7,
      publicFiles: 20,
      privateFiles: 5,
      averageSize: 2097152, // ~2MB
    },
    bucketStats: [
      {
        bucket: 'user-uploads',
        fileCount: 15,
        totalSize: 31457280,
        imageCount: 12,
        publicCount: 15,
        privateCount: 0,
      },
      {
        bucket: 'product-images',
        fileCount: 8,
        totalSize: 16777216,
        imageCount: 8,
        publicCount: 8,
        privateCount: 0,
      },
      {
        bucket: 'documents',
        fileCount: 2,
        totalSize: 4194304,
        imageCount: 0,
        publicCount: 0,
        privateCount: 2,
      },
    ],
    mimeTypeStats: [
      { type: 'image', count: 18, size: 41943040 },
      { type: 'application', count: 5, size: 8388608 },
      { type: 'text', count: 2, size: 2097152 },
    ],
    sizeDistribution: {
      small: 20, // < 1MB
      medium: 4, // 1MB - 10MB
      large: 1,  // > 10MB
    },
    recentFiles: [
      {
        id: '1',
        originalName: 'recent-upload.jpg',
        fileSize: 2048000,
        mimeType: 'image/jpeg',
        uploadedAt: '2024-01-05T10:00:00Z',
        isImage: true,
      },
      {
        id: '2',
        originalName: 'document.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        uploadedAt: '2024-01-04T15:30:00Z',
        isImage: false,
      },
    ],
    lastUpdated: new Date().toISOString(),
  };

  console.log('Mock 파일 통계 조회');

  return useResponseSuccess(mockStats);
}

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase = process.env.VITE_USE_SUPABASE === 'true' ||
                     process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 파일 통계 조회');
    return await getFileStatsWithSupabase(event, userinfo);
  } else {
    console.log('🔄 Mock 파일 통계 조회');
    return getFileStatsWithMock();
  }
});
