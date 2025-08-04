import type { UploadFile } from 'ant-design-vue/es/upload/interface';

import { computed, ref } from 'vue';

import { supabase } from '@vben/utils';

import { message } from 'ant-design-vue';

export interface FileUploadOptions {
  bucket?: string;
  category?: string;
  isPublic?: boolean;
  altText?: string;
  description?: string;
  tags?: string[];
  maxSize?: number; // bytes
  allowedTypes?: string[];
}

export interface UploadedFileInfo {
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

export function useFileUpload(options: FileUploadOptions = {}) {
  const {
    bucket = 'user-uploads',
    category = 'general',
    isPublic = true,
    altText = '',
    description = '',
    tags: _tags = [],
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  } = options;

  const uploading = ref(false);
  const uploadProgress = ref(0);
  const uploadedFiles = ref<UploadedFileInfo[]>([]);

  // 환경 변수에서 Supabase 사용 여부 확인
  const isSupabaseEnabled = computed(() => {
    return import.meta.env.VITE_USE_SUPABASE === 'true';
  });

  // 파일 유효성 검사
  const validateFile = (file: File): { error?: string; valid: boolean } => {
    // 파일 크기 검사
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `파일 크기는 ${Math.round(maxSize / 1024 / 1024)}MB 이하여야 합니다.`,
      };
    }

    // 파일 형식 검사
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: '지원하지 않는 파일 형식입니다.',
      };
    }

    return { valid: true };
  };

  // 단일 파일 업로드 (Backend API 사용)
  const uploadSingleFile = async (
    file: File,
    uploadOptions: Partial<FileUploadOptions> = {},
  ): Promise<UploadedFileInfo> => {
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const formData = new FormData();
    formData.append('file', file);

    // 쿼리 파라미터 준비
    const params = new URLSearchParams({
      bucket: uploadOptions.bucket || bucket,
      category: uploadOptions.category || category,
      public: String(uploadOptions.isPublic ?? isPublic),
      alt_text: uploadOptions.altText || altText,
      description: uploadOptions.description || description,
      ...(uploadOptions.tags && { tags: JSON.stringify(uploadOptions.tags) }),
    });

    try {
      uploading.value = true;
      uploadProgress.value = 0;

      // 진행률 시뮬레이션 (실제로는 backend에서 처리)
      const progressInterval = setInterval(() => {
        if (uploadProgress.value < 90) {
          uploadProgress.value += Math.random() * 30;
        }
      }, 200);

      const response = await fetch(`/api/upload?${params}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      clearInterval(progressInterval);
      uploadProgress.value = 100;

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(result.message || 'Upload failed');
      }

      const uploadedFile: UploadedFileInfo = result.data;
      uploadedFiles.value.push(uploadedFile);

      message.success('파일이 성공적으로 업로드되었습니다.');
      return uploadedFile;
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      message.error(
        error instanceof Error ? error.message : '파일 업로드에 실패했습니다.',
      );
      throw error;
    } finally {
      uploading.value = false;
      uploadProgress.value = 0;
    }
  };

  // 다중 파일 업로드
  const uploadMultipleFiles = async (
    files: File[],
    uploadOptions: Partial<FileUploadOptions> = {},
  ): Promise<UploadedFileInfo[]> => {
    const results: UploadedFileInfo[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const result = await uploadSingleFile(file, uploadOptions);
        results.push(result);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '알 수 없는 오류';
        errors.push(`${file.name}: ${errorMessage}`);
      }
    }

    if (errors.length > 0) {
      console.warn('일부 파일 업로드 실패:', errors);
      message.warning(`${errors.length}개 파일 업로드가 실패했습니다.`);
    }

    return results;
  };

  // Ant Design Vue Upload 컴포넌트용 커스텀 업로드 함수
  const customUpload = async (options: any) => {
    const { file, onProgress, onSuccess, onError } = options;

    try {
      // 진행률 리포팅 시뮬레이션
      const progressInterval = setInterval(() => {
        if (uploadProgress.value < 90) {
          uploadProgress.value += Math.random() * 30;
          onProgress({ percent: uploadProgress.value });
        }
      }, 200);

      const result = await uploadSingleFile(file);

      clearInterval(progressInterval);
      onProgress({ percent: 100 });
      onSuccess(result);

      return result;
    } catch (error) {
      onError(error);
      throw error;
    }
  };

  // Ant Design Upload 파일 리스트 변환
  const convertToAntdFileList = (files: UploadedFileInfo[]): UploadFile[] => {
    return files.map((file, index) => ({
      uid: file.id || String(index),
      name: file.originalName,
      status: 'done' as const,
      url: file.url,
      response: file,
    }));
  };

  // 업로드된 파일 제거
  const removeUploadedFile = (fileId: string) => {
    uploadedFiles.value = uploadedFiles.value.filter(
      (file) => file.id !== fileId,
    );
  };

  // 모든 업로드된 파일 지우기
  const clearUploadedFiles = () => {
    uploadedFiles.value = [];
  };

  // 직접 Supabase Storage 업로드 (고급 사용자용)
  const uploadToSupabaseStorage = async (
    file: File,
    storagePath: string,
    bucketName = 'user-uploads',
  ): Promise<string> => {
    if (!isSupabaseEnabled.value) {
      throw new Error('Supabase가 활성화되지 않았습니다.');
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase Storage 업로드 실패: ${error.message}`);
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  return {
    // 상태
    uploading: computed(() => uploading.value),
    uploadProgress: computed(() => uploadProgress.value),
    uploadedFiles: computed(() => uploadedFiles.value),
    isSupabaseEnabled,

    // 메서드
    validateFile,
    uploadSingleFile,
    uploadMultipleFiles,
    customUpload,
    convertToAntdFileList,
    removeUploadedFile,
    clearUploadedFiles,
    uploadToSupabaseStorage,

    // 설정
    maxSize,
    allowedTypes,
  };
}
