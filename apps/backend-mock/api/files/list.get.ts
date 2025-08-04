import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, usePageResponseSuccess } from '~/utils/response';

// Supabase 파일 목록 조회
async function getFilesWithSupabase(event: any, _userinfo: any) {
  try {
    // @ts-ignore - 동적 import
    const { supabase } = await import('@vben/utils');

    // 현재 사용자 ID 가져오기
    const authHeader = getHeader(event, 'Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return unAuthorizedResponse(event);
    }

    const token = authHeader.split(' ')[1];
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return unAuthorizedResponse(event);
    }

    // 쿼리 파라미터 추출
    const query = getQuery(event);
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const bucket = (query.bucket as string) || '';
    const search = (query.search as string) || '';
    const mimeType = (query.mimeType as string) || '';
    let isImage: boolean | null = null;
    if (query.isImage === 'true') {
      isImage = true;
    } else if (query.isImage === 'false') {
      isImage = false;
    }
    let isPublic: boolean | null = null;
    if (query.isPublic === 'true') {
      isPublic = true;
    } else if (query.isPublic === 'false') {
      isPublic = false;
    }
    const sortBy = (query.sortBy as string) || 'created_at';
    const sortOrder = (query.sortOrder as string) || 'desc';

    // 관리자인지 확인
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some((ur) =>
      ['admin', 'super'].includes(ur.role),
    );

    // 기본 쿼리
    let dbQuery = supabase.from('file_uploads').select('*', { count: 'exact' });

    // 권한에 따른 필터링
    if (!isAdmin) {
      dbQuery = dbQuery.eq('uploaded_by', user.id);
    }

    // 필터링 조건 추가
    if (bucket) {
      dbQuery = dbQuery.eq('bucket_name', bucket);
    }

    if (search) {
      dbQuery = dbQuery.or(
        `original_name.ilike.%${search}%,description.ilike.%${search}%,alt_text.ilike.%${search}%`,
      );
    }

    if (mimeType) {
      dbQuery = dbQuery.like('mime_type', `${mimeType}%`);
    }

    if (isImage !== null) {
      dbQuery = dbQuery.eq('is_image', isImage);
    }

    if (isPublic !== null) {
      dbQuery = dbQuery.eq('is_public', isPublic);
    }

    // 정렬
    let orderColumn: string;
    switch (sortBy) {
      case 'fileSize': {
        orderColumn = 'file_size';
        break;
      }
      case 'mimeType': {
        orderColumn = 'mime_type';
        break;
      }
      case 'originalName': {
        orderColumn = 'original_name';
        break;
      }
      case 'uploadedAt': {
        orderColumn = 'uploaded_at';
        break;
      }
      default: {
        orderColumn = sortBy;
        break;
      }
    }

    dbQuery = dbQuery.order(orderColumn, { ascending: sortOrder === 'asc' });

    // 페이징
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    dbQuery = dbQuery.range(from, to);

    const { data: files, error: filesError, count } = await dbQuery;

    if (filesError) {
      console.error('파일 목록 조회 실패:', filesError);
      return useResponseError('파일 목록 조회에 실패했습니다.');
    }

    // 각 파일의 공개 URL 생성
    const filesWithUrls = await Promise.all(
      (files || []).map(async (file) => {
        const { data: urlData } = supabase.storage
          .from(file.bucket_name)
          .getPublicUrl(file.file_name);

        return {
          id: file.id,
          url: urlData.publicUrl,
          originalName: file.original_name,
          fileName: file.file_name,
          fileSize: file.file_size,
          mimeType: file.mime_type,
          bucket: file.bucket_name,
          altText: file.alt_text,
          description: file.description,
          tags: file.tags || [],
          width: file.width,
          height: file.height,
          isImage: file.is_image,
          isPublic: file.is_public,
          accessLevel: file.access_level,
          uploadedBy: file.uploaded_by,
          uploadedAt: file.uploaded_at,
          createdAt: file.created_at,
          updatedAt: file.updated_at,
        };
      }),
    );

    return usePageResponseSuccess(
      page.toString(),
      pageSize.toString(),
      filesWithUrls,
      {
        total: count || 0,
        filters: {
          bucket,
          search,
          mimeType,
          isImage,
          isPublic,
        },
      },
    );
  } catch (error) {
    console.error('Supabase 파일 목록 조회 오류:', error);
    return useResponseError('파일 목록 조회 중 오류가 발생했습니다.');
  }
}

// Mock 파일 목록 조회
function getFilesWithMock() {
  // Mock 파일 데이터
  const mockFiles = [
    {
      id: '1',
      url: 'https://unpkg.com/@vbenjs/static-source@0.1.7/source/logo-v1.webp',
      originalName: 'logo-v1.webp',
      fileName: 'general/1734567890-abc123.webp',
      fileSize: 12_345,
      mimeType: 'image/webp',
      bucket: 'user-uploads',
      altText: 'Logo Image',
      description: 'Application logo',
      tags: ['logo', 'branding'],
      width: 200,
      height: 200,
      isImage: true,
      isPublic: true,
      accessLevel: 'public',
      uploadedAt: '2024-01-01T10:00:00Z',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    },
    {
      id: '2',
      url: 'https://example.com/sample-document.pdf',
      originalName: 'sample-document.pdf',
      fileName: 'documents/1734567891-def456.pdf',
      fileSize: 54_321,
      mimeType: 'application/pdf',
      bucket: 'documents',
      altText: '',
      description: 'Sample PDF document',
      tags: ['document', 'pdf'],
      width: null,
      height: null,
      isImage: false,
      isPublic: false,
      accessLevel: 'private',
      uploadedAt: '2024-01-02T11:00:00Z',
      createdAt: '2024-01-02T11:00:00Z',
      updatedAt: '2024-01-02T11:00:00Z',
    },
  ];

  console.log('Mock 파일 목록 조회');

  return usePageResponseSuccess('1', '10', mockFiles, { total: 2 });
}

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase =
    process.env.VITE_USE_SUPABASE === 'true' ||
    process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 파일 목록 조회');
    return await getFilesWithSupabase(event, userinfo);
  } else {
    console.log('🔄 Mock 파일 목록 조회');
    return getFilesWithMock();
  }
});
