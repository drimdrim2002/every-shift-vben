import { requestClient } from '#/api/request';

export namespace FileApi {
  /** 파일 업로드 옵션 */
  export interface UploadOptions {
    bucket?: string;
    category?: string;
    public?: boolean;
    alt_text?: string;
    description?: string;
    tags?: string[];
  }

  /** 파일 정보 */
  export interface FileInfo {
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

  /** 파일 목록 매개변수 */
  export interface ListParams {
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

  /** 파일 목록 응답 */
  export interface ListResponse {
    data: FileInfo[];
    total: number;
    page: number;
    pageSize: number;
  }

  /** 파일 통계 */
  export interface FileStats {
    overview: {
      totalFiles: number;
      totalSize: number;
      imageFiles: number;
      documentFiles: number;
      publicFiles: number;
      privateFiles: number;
      averageSize: number;
    };
    bucketStats: Array<{
      bucket: string;
      fileCount: number;
      totalSize: number;
      imageCount: number;
      publicCount: number;
      privateCount: number;
    }>;
    mimeTypeStats: Array<{
      type: string;
      count: number;
      size: number;
    }>;
    sizeDistribution: {
      small: number;
      medium: number;
      large: number;
    };
    recentFiles: Array<{
      id: string;
      originalName: string;
      fileSize: number;
      mimeType: string;
      uploadedAt: string;
      isImage: boolean;
    }>;
  }

  /** 파일 업데이트 데이터 */
  export interface UpdateData {
    altText?: string;
    description?: string;
    tags?: string[];
    isPublic?: boolean;
  }
}

/**
 * 파일 업로드
 */
export async function uploadFileApi(
  file: File,
  options: FileApi.UploadOptions = {}
): Promise<FileApi.FileInfo> {
  const formData = new FormData();
  formData.append('file', file);

  // 쿼리 파라미터 생성
  const params = new URLSearchParams();
  if (options.bucket) params.append('bucket', options.bucket);
  if (options.category) params.append('category', options.category);
  if (options.public !== undefined) params.append('public', String(options.public));
  if (options.alt_text) params.append('alt_text', options.alt_text);
  if (options.description) params.append('description', options.description);
  if (options.tags) params.append('tags', JSON.stringify(options.tags));

  const url = `/upload${params.toString() ? `?${params.toString()}` : ''}`;

  return requestClient.post<FileApi.FileInfo>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 파일 목록 조회
 */
export async function getFileListApi(params: FileApi.ListParams = {}): Promise<FileApi.ListResponse> {
  return requestClient.get<FileApi.ListResponse>('/files/list', { params });
}

/**
 * 파일 상세 조회
 */
export async function getFileDetailApi(fileId: string): Promise<FileApi.FileInfo> {
  return requestClient.get<FileApi.FileInfo>(`/files/${fileId}`);
}

/**
 * 파일 정보 수정
 */
export async function updateFileApi(
  fileId: string,
  data: FileApi.UpdateData
): Promise<FileApi.FileInfo> {
  return requestClient.put<FileApi.FileInfo>(`/files/update/${fileId}`, data);
}

/**
 * 파일 삭제
 */
export async function deleteFileApi(fileId: string): Promise<void> {
  return requestClient.delete(`/files/delete/${fileId}`);
}

/**
 * 파일 일괄 삭제
 */
export async function bulkDeleteFilesApi(fileIds: string[]): Promise<{
  totalRequested: number;
  totalFound: number;
  successCount: number;
  failureCount: number;
  successfulDeletions: Array<{ id: string; originalName: string }>;
  failedDeletions: Array<{ id: string; originalName: string; error: string }>;
  message: string;
}> {
  return requestClient.post('/files/bulk-delete', { fileIds });
}

/**
 * 파일 통계 조회
 */
export async function getFileStatsApi(): Promise<FileApi.FileStats> {
  return requestClient.get<FileApi.FileStats>('/files/stats');
}
