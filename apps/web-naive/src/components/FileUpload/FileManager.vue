<script setup lang="ts">
import type { FileRecord } from '#/composables';

import { onMounted, ref } from 'vue';

import dayjs from 'dayjs';

import { useFileManager } from '#/composables';

// 파일 관리 composable
const {
  files,
  total,
  searchParams,
  isLoading,
  fetchFiles,
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
    type: 'selection',
    disabled: () => false,
  },
  {
    title: '파일명',
    key: 'originalName',
    sorter: true,
  },
  {
    title: '크기',
    key: 'fileSize',
    width: 100,
    sorter: true,
    render: (row: FileRecord) => formatFileSize(row.fileSize),
  },
  {
    title: '타입',
    key: 'mimeType',
    width: 100,
  },
  {
    title: '공개여부',
    key: 'isPublic',
    width: 100,
    render: (row: FileRecord) => (row.isPublic ? '공개' : '비공개'),
  },
  {
    title: '업로드 날짜',
    key: 'uploadedAt',
    width: 150,
    sorter: true,
    render: (row: FileRecord) => formatDate(row.uploadedAt),
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

// 페이지 변경 핸들러
const handlePageChange = (page: number) => {
  searchParams.page = page;
  fetchFiles();
};

// 페이지 크기 변경 핸들러
const handlePageSizeChange = (pageSize: number) => {
  searchParams.pageSize = pageSize;
  searchParams.page = 1;
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
  window.$dialog?.warning({
    title: '파일 삭제 확인',
    content: `선택된 ${selectedRowKeys.value.length}개의 파일을 삭제하시겠습니까?`,
    positiveText: '삭제',
    negativeText: '취소',
    onPositiveClick: async () => {
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

// 날짜 포맷팅
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

// 테이블 행 데이터 생성
const tableData = computed(() => {
  return files.value.map((file) => ({
    ...file,
    key: file.id,
  }));
});
</script>

<template>
  <div class="file-manager">
    <!-- 검색 및 필터 -->
    <div class="mb-4 space-y-4">
      <!-- 검색 바 -->
      <div class="flex flex-col gap-4 sm:flex-row">
        <n-input
          v-model:value="searchParams.search"
          placeholder="파일명으로 검색..."
          class="flex-1"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <n-icon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </n-icon>
          </template>
        </n-input>

        <div class="flex gap-2">
          <n-button type="primary" @click="handleSearch"> 검색 </n-button>
          <n-button @click="handleReset"> 초기화 </n-button>
          <n-button @click="handleRefresh" :loading="isLoading">
            새로고침
          </n-button>
        </div>
      </div>

      <!-- 필터 -->
      <div class="flex flex-wrap gap-4">
        <n-select
          v-model:value="searchParams.bucket"
          placeholder="버킷 선택"
          class="w-32"
          clearable
        >
          <n-option value="">전체</n-option>
          <n-option value="user-uploads">사용자 파일</n-option>
          <n-option value="avatars">아바타</n-option>
          <n-option value="product-images">상품 이미지</n-option>
          <n-option value="documents">문서</n-option>
        </n-select>

        <n-select
          v-model:value="searchParams.mimeType"
          placeholder="파일 타입"
          class="w-32"
          clearable
        >
          <n-option value="">전체</n-option>
          <n-option value="image">이미지</n-option>
          <n-option value="application">문서</n-option>
          <n-option value="text">텍스트</n-option>
        </n-select>

        <n-select
          v-model:value="searchParams.isPublic"
          placeholder="공개 여부"
          class="w-32"
          clearable
        >
          <n-option :value="undefined">전체</n-option>
          <n-option :value="true">공개</n-option>
          <n-option :value="false">비공개</n-option>
        </n-select>

        <n-select
          v-model:value="searchParams.sortBy"
          placeholder="정렬 기준"
          class="w-32"
        >
          <n-option value="uploadedAt">업로드 날짜</n-option>
          <n-option value="originalName">파일명</n-option>
          <n-option value="fileSize">파일 크기</n-option>
          <n-option value="mimeType">파일 타입</n-option>
        </n-select>

        <n-select
          v-model:value="searchParams.sortOrder"
          placeholder="정렬 방향"
          class="w-24"
        >
          <n-option value="desc">내림차순</n-option>
          <n-option value="asc">오름차순</n-option>
        </n-select>
      </div>
    </div>

    <!-- 일괄 작업 버튼 -->
    <div v-if="selectedRowKeys.length > 0" class="mb-4">
      <n-space>
        <n-button
          type="error"
          @click="handleBulkDelete"
          :loading="deletingBulk"
        >
          선택된 {{ selectedRowKeys.length }}개 파일 삭제
        </n-button>
        <n-button @click="clearSelection"> 선택 해제 </n-button>
      </n-space>
    </div>

    <!-- 파일 테이블 -->
    <n-data-table
      :data="tableData"
      :columns="columns"
      :loading="isLoading"
      :row-key="(row) => row.id"
      :checked-row-keys="selectedRowKeys"
      @update:checked-row-keys="onSelectionChange"
    >
      <template #empty>
        <div class="py-8 text-center text-gray-500">파일이 없습니다.</div>
      </template>
    </n-data-table>

    <!-- 페이지네이션 -->
    <div class="mt-4 flex justify-center">
      <n-pagination
        v-model:page="searchParams.page"
        v-model:page-size="searchParams.pageSize"
        :item-count="total"
        :page-sizes="[10, 20, 50, 100]"
        show-size-picker
        show-quick-jumper
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      >
        <template #prefix="{ itemCount }"> 총 {{ itemCount }}개 </template>
      </n-pagination>
    </div>

    <!-- 파일 상세/수정 모달 -->
    <n-modal
      v-model:show="modalVisible"
      :title="modalMode === 'view' ? '파일 상세' : '파일 수정'"
      preset="card"
      style="width: 600px"
      @positive-click="handleModalOk"
      @negative-click="handleModalCancel"
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
        <n-form label-placement="top">
          <n-form-item label="파일명">
            <n-input
              v-model:value="selectedFile.originalName"
              :disabled="modalMode === 'view'"
            />
          </n-form-item>

          <n-form-item label="설명">
            <n-input
              v-model:value="selectedFile.description"
              type="textarea"
              :disabled="modalMode === 'view'"
              :rows="3"
            />
          </n-form-item>

          <n-form-item label="대체 텍스트">
            <n-input
              v-model:value="selectedFile.altText"
              :disabled="modalMode === 'view'"
            />
          </n-form-item>

          <n-form-item label="태그">
            <n-dynamic-tags
              v-model:value="selectedFile.tags"
              :disabled="modalMode === 'view'"
            />
          </n-form-item>

          <n-form-item label="공개 여부">
            <n-switch
              v-model:value="selectedFile.isPublic"
              :disabled="modalMode === 'view'"
            >
              <template #checked>공개</template>
              <template #unchecked>비공개</template>
            </n-switch>
          </n-form-item>

          <!-- 읽기 전용 정보 -->
          <n-form-item label="파일 크기">
            <n-input :value="formatFileSize(selectedFile.fileSize)" disabled />
          </n-form-item>

          <n-form-item label="파일 타입">
            <n-input :value="selectedFile.mimeType" disabled />
          </n-form-item>

          <n-form-item label="업로드 날짜">
            <n-input :value="formatDate(selectedFile.uploadedAt)" disabled />
          </n-form-item>
        </n-form>
      </div>

      <template #action>
        <n-space>
          <n-button @click="handleModalCancel">취소</n-button>
          <n-button
            v-if="modalMode === 'edit'"
            type="primary"
            @click="handleModalOk"
          >
            저장
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.file-manager {
  @apply w-full;
}
</style>
