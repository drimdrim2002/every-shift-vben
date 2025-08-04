<script setup lang="ts">
import type { UploadedFileInfo } from '#/composables';

import { ref } from 'vue';

import { FileManager, FileUploadBasic } from '#/components';

const uploadedFiles = ref<UploadedFileInfo[]>([]);
const activeTab = ref('upload');

// 파일 업로드 성공 핸들러
const handleUploadSuccess = (file: UploadedFileInfo) => {
  console.warn('파일 업로드 성공:', file);
};

// 파일 업로드 에러 핸들러
const handleUploadError = (error: Error) => {
  console.error('파일 업로드 에러:', error);
};

// 파일 목록 변경 핸들러
const handleFilesChange = (files: UploadedFileInfo[]) => {
  uploadedFiles.value = files;
};

// 파일 제거 핸들러
const handleFileRemove = (fileId: string) => {
  console.warn('파일 제거:', fileId);
};
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="mb-2 text-2xl font-bold">파일 업로드 데모</h1>
      <p class="text-gray-600">
        Supabase Storage를 활용한 파일 업로드 및 관리 시스템을 테스트해보세요.
      </p>
    </div>

    <n-tabs v-model:value="activeTab" type="line">
      <!-- 파일 업로드 탭 -->
      <n-tab-pane name="upload" tab="파일 업로드">
        <div class="space-y-6">
          <!-- 기본 파일 업로드 -->
          <n-card title="기본 파일 업로드" class="mb-6">
            <template #header-extra>
              <n-tag type="info">기본</n-tag>
            </template>

            <FileUploadBasic
              :multiple="false"
              :max-size="5 * 1024 * 1024"
              :allowed-types="[
                'image/jpeg',
                'image/png',
                'image/gif',
                'application/pdf',
              ]"
              @success="handleUploadSuccess"
              @error="handleUploadError"
              @change="handleFilesChange"
              @remove="handleFileRemove"
            />
          </n-card>

          <!-- 다중 파일 업로드 -->
          <n-card title="다중 파일 업로드" class="mb-6">
            <template #header-extra>
              <n-tag type="success">다중</n-tag>
            </template>

            <FileUploadBasic
              :multiple="true"
              :max-size="10 * 1024 * 1024"
              :allowed-types="[
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'application/pdf',
                'text/plain',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              ]"
              bucket="user-uploads"
              category="demo"
              @success="handleUploadSuccess"
              @error="handleUploadError"
              @change="handleFilesChange"
              @remove="handleFileRemove"
            />
          </n-card>

          <!-- 이미지 전용 업로드 -->
          <n-card title="이미지 전용 업로드" class="mb-6">
            <template #header-extra>
              <n-tag type="warning">이미지</n-tag>
            </template>

            <FileUploadBasic
              :multiple="true"
              :max-size="2 * 1024 * 1024"
              :allowed-types="[
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
              ]"
              accept="image/*"
              bucket="images"
              category="gallery"
              :is-public="true"
              @success="handleUploadSuccess"
              @error="handleUploadError"
              @change="handleFilesChange"
              @remove="handleFileRemove"
            />
          </n-card>

          <!-- 업로드 설정 정보 -->
          <n-card title="업로드 설정 정보">
            <n-alert type="info" class="mb-4">
              <template #header>업로드 제한 사항</template>
              <ul class="list-inside list-disc space-y-1">
                <li>최대 파일 크기: 10MB</li>
                <li>지원 형식: 이미지, PDF, 텍스트, Excel 파일</li>
                <li>한 번에 최대 10개 파일 업로드 가능</li>
                <li>파일명은 자동으로 고유한 이름으로 변경됩니다</li>
              </ul>
            </n-alert>

            <n-space>
              <n-tag type="info">JPEG</n-tag>
              <n-tag type="info">PNG</n-tag>
              <n-tag type="info">GIF</n-tag>
              <n-tag type="info">WebP</n-tag>
              <n-tag type="success">PDF</n-tag>
              <n-tag type="warning">TXT</n-tag>
              <n-tag type="success">Excel</n-tag>
            </n-space>
          </n-card>
        </div>
      </n-tab-pane>

      <!-- 파일 관리 탭 -->
      <n-tab-pane name="manager" tab="파일 관리">
        <n-card>
          <template #header>
            <div class="flex items-center justify-between">
              <span>파일 관리자</span>
              <n-tag type="info">관리</n-tag>
            </div>
          </template>

          <FileManager />
        </n-card>
      </n-tab-pane>

      <!-- API 문서 탭 -->
      <n-tab-pane name="docs" tab="API 문서">
        <div class="space-y-6">
          <n-card title="Composables API">
            <n-collapse>
              <n-collapse-item title="useFileUpload" name="useFileUpload">
                <div class="space-y-4">
                  <n-alert type="info">
                    파일 업로드 기능을 제공하는 composable입니다.
                  </n-alert>

                  <div>
                    <h4 class="mb-2 font-semibold">주요 메서드:</h4>
                    <n-code
                      language="typescript"
                      code="
const {
  uploading,           // 업로드 상태
  uploadProgress,      // 업로드 진행률
  uploadedFiles,       // 업로드된 파일 목록
  validateFile,        // 파일 유효성 검사
  uploadSingleFile,    // 단일 파일 업로드
  uploadMultipleFiles, // 다중 파일 업로드
  removeUploadedFile,  // 업로드된 파일 제거
  clearUploadedFiles,  // 모든 파일 제거
} = useFileUpload(options)
                    "
                    />
                  </div>
                </div>
              </n-collapse-item>

              <n-collapse-item title="useFileManager" name="useFileManager">
                <div class="space-y-4">
                  <n-alert type="info">
                    파일 목록 조회 및 관리 기능을 제공하는 composable입니다.
                  </n-alert>

                  <div>
                    <h4 class="mb-2 font-semibold">주요 메서드:</h4>
                    <n-code
                      language="typescript"
                      code="
const {
  files,              // 파일 목록
  total,              // 전체 파일 수
  isLoading,          // 로딩 상태
  fetchFiles,         // 파일 목록 조회
  deleteFile,         // 파일 삭제
  bulkDeleteFiles,    // 일괄 삭제
  updateFile,         // 파일 정보 수정
  formatFileSize,     // 파일 크기 포맷팅
} = useFileManager()
                    "
                    />
                  </div>
                </div>
              </n-collapse-item>

              <n-collapse-item title="useSupabase" name="useSupabase">
                <div class="space-y-4">
                  <n-alert type="info">
                    Supabase 인증 및 스토리지 기능을 제공하는 composable입니다.
                  </n-alert>

                  <div>
                    <h4 class="mb-2 font-semibold">주요 메서드:</h4>
                    <n-code
                      language="typescript"
                      code="
const {
  user,               // 현재 사용자
  isAuthenticated,    // 인증 상태
  isLoading,          // 로딩 상태
  initializeAuth,     // 인증 초기화
  signInWithPassword, // 로그인
  signOut,            // 로그아웃
  refreshUser,        // 사용자 정보 새로고침
} = useSupabase()
                    "
                    />
                  </div>
                </div>
              </n-collapse-item>
            </n-collapse>
          </n-card>

          <n-card title="컴포넌트 API">
            <n-collapse>
              <n-collapse-item title="FileUploadBasic" name="FileUploadBasic">
                <div class="space-y-4">
                  <n-alert type="info">
                    기본적인 파일 업로드 UI를 제공하는 컴포넌트입니다.
                  </n-alert>

                  <div>
                    <h4 class="mb-2 font-semibold">Props:</h4>
                    <n-code
                      language="typescript"
                      code="
interface FileUploadBasicProps {
  bucket?: string;          // 스토리지 버킷
  category?: string;        // 파일 카테고리
  multiple?: boolean;       // 다중 선택 허용
  maxSize?: number;         // 최대 파일 크기
  allowedTypes?: string[];  // 허용된 파일 타입
  showPreview?: boolean;    // 미리보기 표시
}
                    "
                    />
                  </div>

                  <div>
                    <h4 class="mb-2 font-semibold">Events:</h4>
                    <n-code
                      language="typescript"
                      code="
@success   // 업로드 성공
@error     // 업로드 실패
@change    // 파일 목록 변경
@remove    // 파일 제거
                    "
                    />
                  </div>
                </div>
              </n-collapse-item>

              <n-collapse-item title="FileManager" name="FileManager">
                <div class="space-y-4">
                  <n-alert type="info">
                    업로드된 파일들을 관리할 수 있는 테이블 UI를 제공하는
                    컴포넌트입니다.
                  </n-alert>

                  <div>
                    <h4 class="mb-2 font-semibold">기능:</h4>
                    <ul class="list-inside list-disc space-y-1">
                      <li>파일 목록 조회 및 페이징</li>
                      <li>파일 검색 및 필터링</li>
                      <li>파일 정보 수정</li>
                      <li>개별/일괄 파일 삭제</li>
                      <li>파일 미리보기</li>
                    </ul>
                  </div>
                </div>
              </n-collapse-item>
            </n-collapse>
          </n-card>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped>
/* 추가 스타일링이 필요한 경우 여기에 작성 */
</style>
