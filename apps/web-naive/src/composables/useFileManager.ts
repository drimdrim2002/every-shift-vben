import { computed, reactive, ref } from 'vue';

export interface FileRecord {
  id: string;
  url: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  bucket: string;
  altText?: string;
  description?: string;
  tags: string[];
  width?: number;
  height?: number;
  isImage: boolean;
  isPublic: boolean;
  accessLevel: string;
  uploadedBy?: string;
  uploaderEmail?: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileListParams {
  page?: number;
  pageSize?: number;
  bucket?: string;
  search?: string;
  mimeType?: string;
  isImage?: boolean;
  isPublic?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FileStats {
  overview: {
    averageSize: number;
    documentFiles: number;
    imageFiles: number;
    privateFiles: number;
    publicFiles: number;
    totalFiles: number;
    totalSize: number;
  };
  bucketStats: Array<{
    bucket: string;
    fileCount: number;
    imageCount: number;
    privateCount: number;
    publicCount: number;
    totalSize: number;
  }>;
  mimeTypeStats: Array<{
    count: number;
    size: number;
    type: string;
  }>;
  sizeDistribution: {
    large: number;
    medium: number;
    small: number;
  };
  recentFiles: Array<{
    fileSize: number;
    id: string;
    isImage: boolean;
    mimeType: string;
    originalName: string;
    uploadedAt: string;
  }>;
}

export function useFileManager() {
  const loading = ref(false);
  const files = ref<FileRecord[]>([]);
  const total = ref(0);
  const stats = ref<FileStats | null>(null);

  // 기본 검색 파라미터
  const searchParams = reactive<FileListParams>({
    page: 1,
    pageSize: 10,
    bucket: '',
    search: '',
    mimeType: '',
    isImage: undefined,
    isPublic: undefined,
    sortBy: 'uploadedAt',
    sortOrder: 'desc',
  });

  // 계산된 속성
  const hasFiles = computed(() => files.value.length > 0);
  const totalPages = computed(() =>
    Math.ceil(total.value / (searchParams.pageSize || 10)),
  );
  const isLoading = computed(() => loading.value);

  // 파일 목록 조회
  const fetchFiles = async (params: Partial<FileListParams> = {}) => {
    try {
      loading.value = true;

      // 파라미터 병합
      const queryParams = { ...searchParams, ...params };

      // URL 쿼리스트링 생성
      const searchParamsString = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          searchParamsString.append(key, String(value));
        }
      });

      const response = await fetch(`/api/files/list?${searchParamsString}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('파일 목록 조회 실패');
      }

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(result.message || '파일 목록 조회 실패');
      }

      files.value = result.data;
      total.value = result.total || 0;

      return result;
    } catch (error) {
      console.error('파일 목록 조회 오류:', error);
      console.error(
        error instanceof Error
          ? error.message
          : '파일 목록 조회에 실패했습니다.',
      );
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 파일 상세 정보 조회
  const fetchFileDetail = async (fileId: string): Promise<FileRecord> => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('파일 정보 조회 실패');
      }

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(result.message || '파일 정보 조회 실패');
      }

      return result.data;
    } catch (error) {
      console.error('파일 상세 조회 오류:', error);
      console.error(
        error instanceof Error
          ? error.message
          : '파일 정보 조회에 실패했습니다.',
      );
      throw error;
    }
  };

  // 파일 정보 수정
  const updateFile = async (
    fileId: string,
    updateData: Partial<FileRecord>,
  ): Promise<FileRecord> => {
    try {
      const response = await fetch(`/api/files/update/${fileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('파일 정보 수정 실패');
      }

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(result.message || '파일 정보 수정 실패');
      }

      // 로컬 상태 업데이트
      const fileIndex = files.value.findIndex((f) => f.id === fileId);
      if (fileIndex !== -1) {
        files.value[fileIndex] = { ...files.value[fileIndex], ...result.data };
      }

      console.warn('파일 정보가 성공적으로 수정되었습니다.');
      return result.data;
    } catch (error) {
      console.error('파일 수정 오류:', error);
      console.error(
        error instanceof Error
          ? error.message
          : '파일 정보 수정에 실패했습니다.',
      );
      throw error;
    }
  };

  // 파일 삭제
  const deleteFile = async (fileId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/files/delete/${fileId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('파일 삭제 실패');
      }

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(result.message || '파일 삭제 실패');
      }

      // 로컬 상태에서 제거
      files.value = files.value.filter((f) => f.id !== fileId);
      total.value = Math.max(0, total.value - 1);

      console.warn('파일이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('파일 삭제 오류:', error);
      console.error(
        error instanceof Error ? error.message : '파일 삭제에 실패했습니다.',
      );
      throw error;
    }
  };

  // 일괄 파일 삭제
  const bulkDeleteFiles = async (fileIds: string[]): Promise<void> => {
    if (fileIds.length === 0) {
      console.warn('삭제할 파일을 선택해주세요.');
      return;
    }

    if (fileIds.length > 50) {
      console.error('한 번에 최대 50개 파일까지만 삭제할 수 있습니다.');
      return;
    }

    try {
      const response = await fetch('/api/files/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ fileIds }),
      });

      if (!response.ok) {
        throw new Error('일괄 삭제 실패');
      }

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(result.message || '일괄 삭제 실패');
      }

      // 로컬 상태에서 성공적으로 삭제된 파일들 제거
      if (result.data.successfulDeletions) {
        const deletedIds = result.data.successfulDeletions.map(
          (item: any) => item.id,
        );
        files.value = files.value.filter((f) => !deletedIds.includes(f.id));
        total.value = Math.max(0, total.value - deletedIds.length);
      }

      console.warn(
        `${result.data.successCount}개 파일이 성공적으로 삭제되었습니다.`,
      );

      if (result.data.failureCount > 0) {
        console.warn(`${result.data.failureCount}개 파일 삭제에 실패했습니다.`);
      }
    } catch (error) {
      console.error('일괄 삭제 오류:', error);
      console.error(
        error instanceof Error ? error.message : '일괄 삭제에 실패했습니다.',
      );
      throw error;
    }
  };

  // 파일 통계 조회
  const fetchFileStats = async (): Promise<FileStats> => {
    try {
      const response = await fetch('/api/files/stats', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('파일 통계 조회 실패');
      }

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(result.message || '파일 통계 조회 실패');
      }

      stats.value = result.data;
      return result.data;
    } catch (error) {
      console.error('파일 통계 조회 오류:', error);
      console.error(
        error instanceof Error
          ? error.message
          : '파일 통계 조회에 실패했습니다.',
      );
      throw error;
    }
  };

  // 검색 파라미터 업데이트
  const updateSearchParams = (params: Partial<FileListParams>) => {
    Object.assign(searchParams, params);
  };

  // 검색 파라미터 초기화
  const resetSearchParams = () => {
    Object.assign(searchParams, {
      page: 1,
      pageSize: 10,
      bucket: '',
      search: '',
      mimeType: '',
      isImage: undefined,
      isPublic: undefined,
      sortBy: 'uploadedAt',
      sortOrder: 'desc',
    });
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  // 파일 타입 아이콘 가져오기
  const getFileTypeIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'file-image';
    if (mimeType.includes('pdf')) return 'file-pdf';
    if (mimeType.includes('word')) return 'file-word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet'))
      return 'file-excel';
    if (mimeType.includes('text')) return 'file-text';
    return 'file';
  };

  return {
    // 상태
    files: computed(() => files.value),
    total: computed(() => total.value),
    stats: computed(() => stats.value),
    searchParams,
    hasFiles,
    totalPages,
    isLoading,

    // 메서드
    fetchFiles,
    fetchFileDetail,
    updateFile,
    deleteFile,
    bulkDeleteFiles,
    fetchFileStats,
    updateSearchParams,
    resetSearchParams,

    // 유틸리티
    formatFileSize,
    getFileTypeIcon,
  };
}
