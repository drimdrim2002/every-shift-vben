<script setup lang="ts">
import type { FileRecord } from '#/composables';

import { onMounted, ref } from 'vue';

import {
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileWordOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue';
import { Modal } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useFileManager } from '#/composables';

// 파일 관리 composable
const {
  files,
  total,
  searchParams,
  isLoading,
  fetchFiles,
  deleteFile,
  bulkDeleteFiles,
  updateFile,
  formatFileSize,
  resetSearchParams,
} = useFileManager();

// 로컬 상태
const selectedRowKeys = ref<string[]>([]);
const deletingBulk = ref(false);
const modalVisible = ref(false);
const modalMode = ref<'edit' | 'view'>('view');
const selectedFile = ref<FileRecord | null>(null);
const editingFile = ref<Partial<FileRecord>>({});

// 테이블 컬럼 정의
const columns = [
  {
    title: '미리보기',
    key: 'preview',
    width: 80,
  },
  {
    title: '파일명',
    key: 'name',
    dataIndex: 'originalName',
    sorter: true,
  },
  {
    title: '크기',
    key: 'size',
    dataIndex: 'fileSize',
    width: 100,
    sorter: true,
  },
  {
    title: '타입',
    key: 'type',
    dataIndex: 'mimeType',
    width: 100,
  },
  {
    title: '공개여부',
    key: 'isPublic',
    dataIndex: 'isPublic',
    width: 100,
  },
  {
    title: '업로드 날짜',
    key: 'uploadedAt',
    dataIndex: 'uploadedAt',
    width: 150,
    sorter: true,
  },
  {
    title: '액션',
    key: 'action',
    width: 200,
  },
];

// 컴포넌트 마운트 시 파일 목록 로드
onMounted(() => {
  handleSearch();
});

// 검색 실행
const handleSearch = () => {
  searchParams.page = 1;
  fetchFiles();
};

// 필터 초기화
const handleReset = () => {
  resetSearchParams();
  fetchFiles();
};

// 새로고침
const handleRefresh = () => {
  fetchFiles();
};

// 테이블 변경 핸들러 (페이징, 정렬)
const handleTableChange = (pagination: any, filters: any, sorter: any) => {
  searchParams.page = pagination.current;
  searchParams.pageSize = pagination.pageSize;

  if (sorter.field) {
    searchParams.sortBy = sorter.field;
    searchParams.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
  }

  fetchFiles();
};

// 행 선택 변경
const onSelectionChange = (keys: string[]) => {
  selectedRowKeys.value = keys;
};

// 선택 해제
const clearSelection = () => {
  selectedRowKeys.value = [];
};

// 일괄 삭제
const handleBulkDelete = () => {
  Modal.confirm({
    title: '파일 삭제 확인',
    content: `선택된 ${selectedRowKeys.value.length}개의 파일을 삭제하시겠습니까?`,
    onOk: async () => {
      try {
        deletingBulk.value = true;
        await bulkDeleteFiles(selectedRowKeys.value);
        clearSelection();
        await fetchFiles(); // 목록 새로고침
      } catch (error) {
        console.error('일괄 삭제 실패:', error);
      } finally {
        deletingBulk.value = false;
      }
    },
  });
};

// 파일 보기
const handleView = (file: FileRecord) => {
  selectedFile.value = { ...file };
  modalMode.value = 'view';
  modalVisible.value = true;
};

// 파일 수정
const handleEdit = (file: FileRecord) => {
  selectedFile.value = { ...file };
  editingFile.value = { ...file };
  modalMode.value = 'edit';
  modalVisible.value = true;
};

// 파일 삭제
const handleDelete = (file: FileRecord) => {
  Modal.confirm({
    title: '파일 삭제 확인',
    content: `'${file.originalName}' 파일을 삭제하시겠습니까?`,
    onOk: async () => {
      try {
        await deleteFile(file.id);
        await fetchFiles(); // 목록 새로고침
      } catch (error) {
        console.error('파일 삭제 실패:', error);
      }
    },
  });
};

// 모달 확인
const handleModalOk = async () => {
  if (modalMode.value === 'edit' && selectedFile.value) {
    try {
      await updateFile(selectedFile.value.id, {
        altText: selectedFile.value.altText,
        description: selectedFile.value.description,
        tags: selectedFile.value.tags,
        isPublic: selectedFile.value.isPublic,
      });
      modalVisible.value = false;
      await fetchFiles(); // 목록 새로고침
    } catch (error) {
      console.error('파일 수정 실패:', error);
    }
  }
};

// 모달 취소
const handleModalCancel = () => {
  modalVisible.value = false;
  selectedFile.value = null;
  editingFile.value = {};
};

// 파일 타입 아이콘
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return FileImageOutlined;
  if (mimeType.includes('pdf')) return FilePdfOutlined;
  if (mimeType.includes('word')) return FileWordOutlined;
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet'))
    return FileExcelOutlined;
  if (mimeType.includes('text')) return FileTextOutlined;
  return FileOutlined;
};

// 파일 타입 색상
const getTypeColor = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return 'blue';
  if (mimeType.includes('pdf')) return 'red';
  if (mimeType.includes('word')) return 'purple';
  if (mimeType.includes('excel')) return 'green';
  if (mimeType.includes('text')) return 'orange';
  return 'default';
};

// 날짜 포맷팅
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};
</script>

<template>
  <div class="file-manager">
    <!-- 검색 및 필터 -->
    <div class="mb-4 space-y-4">
      <!-- 검색 바 -->
      <div class="flex flex-col gap-4 sm:flex-row">
        <a-input
          v-model:value="searchParams.search"
          placeholder="파일명으로 검색..."
          class="flex-1"
          @press-enter="handleSearch"
        >
          <template #prefix>
            <SearchOutlined />
          </template>
        </a-input>

        <div class="flex gap-2">
          <a-button type="primary" @click="handleSearch"> 검색 </a-button>
          <a-button @click="handleReset"> 초기화 </a-button>
          <a-button @click="handleRefresh" :loading="isLoading">
            새로고침
          </a-button>
        </div>
      </div>

      <!-- 필터 -->
      <div class="flex flex-wrap gap-4">
        <a-select
          v-model:value="searchParams.bucket"
          placeholder="버킷 선택"
          class="w-32"
          allow-clear
        >
          <a-select-option value="">전체</a-select-option>
          <a-select-option value="user-uploads">사용자 파일</a-select-option>
          <a-select-option value="avatars">아바타</a-select-option>
          <a-select-option value="product-images">상품 이미지</a-select-option>
          <a-select-option value="documents">문서</a-select-option>
        </a-select>

        <a-select
          v-model:value="searchParams.mimeType"
          placeholder="파일 타입"
          class="w-32"
          allow-clear
        >
          <a-select-option value="">전체</a-select-option>
          <a-select-option value="image">이미지</a-select-option>
          <a-select-option value="application">문서</a-select-option>
          <a-select-option value="text">텍스트</a-select-option>
        </a-select>

        <a-select
          v-model:value="searchParams.isPublic"
          placeholder="공개 여부"
          class="w-32"
          allow-clear
        >
          <a-select-option :value="undefined">전체</a-select-option>
          <a-select-option :value="true">공개</a-select-option>
          <a-select-option :value="false">비공개</a-select-option>
        </a-select>

        <a-select
          v-model:value="searchParams.sortBy"
          placeholder="정렬 기준"
          class="w-32"
        >
          <a-select-option value="uploadedAt">업로드 날짜</a-select-option>
          <a-select-option value="originalName">파일명</a-select-option>
          <a-select-option value="fileSize">파일 크기</a-select-option>
          <a-select-option value="mimeType">파일 타입</a-select-option>
        </a-select>

        <a-select
          v-model:value="searchParams.sortOrder"
          placeholder="정렬 방향"
          class="w-24"
        >
          <a-select-option value="desc">내림차순</a-select-option>
          <a-select-option value="asc">오름차순</a-select-option>
        </a-select>
      </div>
    </div>

    <!-- 일괄 작업 버튼 -->
    <div v-if="selectedRowKeys.length > 0" class="mb-4">
      <a-space>
        <a-button
          type="primary"
          danger
          @click="handleBulkDelete"
          :loading="deletingBulk"
        >
          선택된 {{ selectedRowKeys.length }}개 파일 삭제
        </a-button>
        <a-button @click="clearSelection"> 선택 해제 </a-button>
      </a-space>
    </div>

    <!-- 파일 테이블 -->
    <a-table
      :data-source="files"
      :columns="columns"
      :loading="isLoading"
      :pagination="{
        current: searchParams.page,
        pageSize: searchParams.pageSize,
        total,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}개`,
      }"
      :row-selection="{
        selectedRowKeys,
        onChange: onSelectionChange,
      }"
      row-key="id"
      @change="handleTableChange"
    >
      <!-- 파일 미리보기 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'preview'">
          <div class="flex items-center space-x-2">
            <!-- 이미지 미리보기 -->
            <div
              v-if="record.isImage"
              class="h-10 w-10 overflow-hidden rounded"
            >
              <img
                :src="record.url"
                :alt="record.originalName"
                class="h-full w-full object-cover"
              />
            </div>
            <!-- 파일 아이콘 -->
            <div
              v-else
              class="flex h-10 w-10 items-center justify-center rounded bg-gray-100"
            >
              <component
                :is="getFileIcon(record.mimeType)"
                class="text-gray-400"
              />
            </div>
          </div>
        </template>

        <!-- 파일명 -->
        <template v-else-if="column.key === 'name'">
          <div>
            <div class="font-medium">{{ record.originalName }}</div>
            <div class="text-xs text-gray-500">{{ record.fileName }}</div>
          </div>
        </template>

        <!-- 파일 크기 -->
        <template v-else-if="column.key === 'size'">
          {{ formatFileSize(record.fileSize) }}
        </template>

        <!-- 파일 타입 -->
        <template v-else-if="column.key === 'type'">
          <a-tag :color="getTypeColor(record.mimeType)">
            {{ record.mimeType.split('/')[0].toUpperCase() }}
          </a-tag>
        </template>

        <!-- 공개 여부 -->
        <template v-else-if="column.key === 'isPublic'">
          <a-tag :color="record.isPublic ? 'green' : 'orange'">
            {{ record.isPublic ? '공개' : '비공개' }}
          </a-tag>
        </template>

        <!-- 업로드 날짜 -->
        <template v-else-if="column.key === 'uploadedAt'">
          {{ formatDate(record.uploadedAt) }}
        </template>

        <!-- 액션 -->
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button size="small" @click="handleView(record)"> 보기 </a-button>
            <a-button size="small" @click="handleEdit(record)"> 수정 </a-button>
            <a-button size="small" danger @click="handleDelete(record)">
              삭제
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 파일 상세/수정 모달 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalMode === 'view' ? '파일 상세' : '파일 수정'"
      :footer="modalMode === 'view' ? null : undefined"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <div v-if="selectedFile">
        <!-- 파일 미리보기 -->
        <div v-if="selectedFile.isImage" class="mb-4">
          <img
            :src="selectedFile.url"
            :alt="selectedFile.originalName"
            class="max-h-64 w-full rounded object-contain"
          />
        </div>

        <!-- 파일 정보 -->
        <a-form layout="vertical">
          <a-form-item label="파일명">
            <a-input
              v-model:value="selectedFile.originalName"
              :disabled="modalMode === 'view'"
            />
          </a-form-item>

          <a-form-item label="설명">
            <a-textarea
              v-model:value="selectedFile.description"
              :disabled="modalMode === 'view'"
              rows="3"
            />
          </a-form-item>

          <a-form-item label="대체 텍스트">
            <a-input
              v-model:value="selectedFile.altText"
              :disabled="modalMode === 'view'"
            />
          </a-form-item>

          <a-form-item label="태그">
            <a-select
              v-model:value="selectedFile.tags"
              mode="tags"
              :disabled="modalMode === 'view'"
              placeholder="태그 입력 후 Enter"
            />
          </a-form-item>

          <a-form-item label="공개 여부">
            <a-switch
              v-model:checked="selectedFile.isPublic"
              :disabled="modalMode === 'view'"
              checked-children="공개"
              un-checked-children="비공개"
            />
          </a-form-item>

          <!-- 읽기 전용 정보 -->
          <a-form-item label="파일 크기">
            <a-input :value="formatFileSize(selectedFile.fileSize)" disabled />
          </a-form-item>

          <a-form-item label="파일 타입">
            <a-input :value="selectedFile.mimeType" disabled />
          </a-form-item>

          <a-form-item label="업로드 날짜">
            <a-input :value="formatDate(selectedFile.uploadedAt)" disabled />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.file-manager {
  @apply w-full;
}

.ant-table-tbody > tr > td {
  @apply py-2;
}
</style>
