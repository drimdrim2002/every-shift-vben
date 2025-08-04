<template>
  <div class="file-upload-basic">
    <a-upload
      v-model:file-list="fileList"
      :custom-request="handleUpload"
      :before-upload="beforeUpload"
      :show-upload-list="showUploadList"
      :multiple="multiple"
      :accept="accept"
      :disabled="disabled || uploading"
      @change="handleChange"
      @remove="handleRemove"
    >
      <slot>
        <a-button
          :loading="uploading"
          :disabled="disabled"
          type="primary"
        >
          <UploadOutlined />
          {{ uploading ? '업로드 중...' : '파일 선택' }}
        </a-button>
      </slot>
    </a-upload>

    <!-- 업로드 진행률 -->
    <div v-if="uploading && showProgress" class="mt-2">
      <a-progress
        :percent="Math.round(uploadProgress)"
        :status="uploadProgress < 100 ? 'active' : 'success'"
        size="small"
      />
    </div>

    <!-- 업로드된 파일 미리보기 -->
    <div v-if="showPreview && uploadedFiles.length > 0" class="mt-4">
      <h4 class="text-sm font-medium text-gray-700 mb-2">업로드된 파일</h4>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="file in uploadedFiles"
          :key="file.id"
          class="relative group border rounded-lg p-2 hover:bg-gray-50"
        >
          <!-- 이미지 미리보기 -->
          <div v-if="file.isImage" class="aspect-square overflow-hidden rounded-md mb-2">
            <img
              :src="file.url"
              :alt="file.originalName"
              class="w-full h-full object-cover"
            />
          </div>

          <!-- 파일 아이콘 -->
          <div v-else class="aspect-square flex items-center justify-center bg-gray-100 rounded-md mb-2">
            <FileOutlined class="text-2xl text-gray-400" />
          </div>

          <!-- 파일 정보 -->
          <div class="text-xs">
            <p class="font-medium truncate" :title="file.originalName">
              {{ file.originalName }}
            </p>
            <p class="text-gray-500">
              {{ formatFileSize(file.fileSize) }}
            </p>
          </div>

          <!-- 삭제 버튼 -->
          <a-button
            v-if="showRemoveButton"
            size="small"
            type="text"
            danger
            class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
            @click="handleFileRemove(file.id)"
          >
            <DeleteOutlined />
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { UploadFile, UploadProps } from 'ant-design-vue/es/upload/interface';
import { message } from 'ant-design-vue';
import { UploadOutlined, FileOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { useFileUpload } from '#/composables';
import type { FileUploadOptions, UploadedFileInfo } from '#/composables';

export interface FileUploadBasicProps {
  // 업로드 옵션
  bucket?: string;
  category?: string;
  isPublic?: boolean;
  altText?: string;
  description?: string;
  tags?: string[];

  // UI 옵션
  multiple?: boolean;
  disabled?: boolean;
  showUploadList?: boolean;
  showProgress?: boolean;
  showPreview?: boolean;
  showRemoveButton?: boolean;

  // 파일 제한
  maxSize?: number;
  allowedTypes?: string[];
  accept?: string;

  // 스타일
  listType?: 'text' | 'picture' | 'picture-card';
}

export interface FileUploadBasicEmits {
  (e: 'success', file: UploadedFileInfo): void;
  (e: 'error', error: Error): void;
  (e: 'change', files: UploadedFileInfo[]): void;
  (e: 'remove', fileId: string): void;
}

const props = withDefaults(defineProps<FileUploadBasicProps>(), {
  bucket: 'user-uploads',
  category: 'general',
  isPublic: true,
  altText: '',
  description: '',
  tags: () => [],

  multiple: false,
  disabled: false,
  showUploadList: true,
  showProgress: true,
  showPreview: true,
  showRemoveButton: true,

  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: () => [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf', 'text/plain', 'text/csv',
  ],
  accept: '',

  listType: 'text',
});

const emit = defineEmits<FileUploadBasicEmits>();

// 파일 업로드 composable
const uploadOptions: FileUploadOptions = {
  bucket: props.bucket,
  category: props.category,
  isPublic: props.isPublic,
  altText: props.altText,
  description: props.description,
  tags: props.tags,
  maxSize: props.maxSize,
  allowedTypes: props.allowedTypes,
};

const {
  uploading,
  uploadProgress,
  uploadedFiles,
  validateFile,
  uploadSingleFile,
  removeUploadedFile,
  clearUploadedFiles,
} = useFileUpload(uploadOptions);

// 로컬 상태
const fileList = ref<UploadFile[]>([]);

// 계산된 속성
const accept = computed(() => {
  if (props.accept) return props.accept;
  return props.allowedTypes.join(',');
});

// 파일 크기 포맷팅
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 업로드 전 검증
const beforeUpload = (file: File): boolean => {
  const validation = validateFile(file);

  if (!validation.valid) {
    message.error(validation.error || '파일 검증 실패');
    return false;
  }

  return true;
};

// 커스텀 업로드 핸들러
const handleUpload = async (options: any) => {
  const { file, onProgress, onSuccess, onError } = options;

  try {
    // 진행률 업데이트
    const progressWatcher = watch(uploadProgress, (newValue) => {
      onProgress({ percent: newValue });
    });

    const result = await uploadSingleFile(file);

    progressWatcher(); // 리스너 정리
    onSuccess(result);
    emit('success', result);
    emit('change', uploadedFiles.value);

  } catch (error) {
    onError(error);
    emit('error', error instanceof Error ? error : new Error('Upload failed'));
  }
};

// 파일 리스트 변경 핸들러
const handleChange: UploadProps['onChange'] = (info) => {
  if (info.file.status === 'uploading') {
    // 업로드 중
  } else if (info.file.status === 'done') {
    message.success(`${info.file.name} 파일이 성공적으로 업로드되었습니다.`);
  } else if (info.file.status === 'error') {
    message.error(`${info.file.name} 파일 업로드에 실패했습니다.`);
  }
};

// 파일 제거 핸들러
const handleRemove = (file: UploadFile): boolean => {
  if (file.response && file.response.id) {
    handleFileRemove(file.response.id);
  }
  return true;
};

// 업로드된 파일 제거
const handleFileRemove = (fileId: string) => {
  removeUploadedFile(fileId);
  emit('remove', fileId);
  emit('change', uploadedFiles.value);
  message.success('파일이 제거되었습니다.');
};

// 모든 파일 제거
const clearFiles = () => {
  clearUploadedFiles();
  fileList.value = [];
  emit('change', []);
};

// 외부에서 사용할 수 있는 메서드들
defineExpose({
  clearFiles,
  uploadedFiles,
  uploading,
  uploadProgress,
});
</script>

<style scoped>
.file-upload-basic {
  @apply w-full;
}

.ant-upload-list {
  @apply mt-2;
}
</style>
