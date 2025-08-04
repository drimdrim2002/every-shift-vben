<script setup lang="ts">
import type { FileStats, UploadedFileInfo } from '#/composables';

import { onMounted, ref } from 'vue';

import {
  FileOutlined,
  PictureOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

// API
import {
  checkSupabaseConnection,
  getFileListApi,
  supabaseGetUserInfoApi,
  uploadFileApi,
} from '#/api/core';
// Components
import { FileManager, FileUploadBasic } from '#/components';
// Composables
import { useFileManager, useSupabase } from '#/composables';

// Supabase 인증
const {
  user,
  isAuthenticated,
  isSupabaseEnabled,
  initializeAuth,
  signInWithPassword,
  signOut,
} = useSupabase();

// 파일 관리
const { formatFileSize, fetchFileStats } = useFileManager();

// 로컬 상태
const uploadTab = ref('basic');
const authLoading = ref(false);
const statsLoading = ref(false);
const recentUploads = ref<UploadedFileInfo[]>([]);
const stats = ref<FileStats | null>(null);
const testResults = ref<string[]>([]);

// 로그인 폼
const loginForm = ref({
  email: 'test@example.com',
  password: 'password123',
});

// 컴포넌트 마운트
onMounted(async () => {
  if (isSupabaseEnabled.value) {
    await initializeAuth();
  }
  await loadStats();
});

// 로그인 처리
const handleLogin = async () => {
  try {
    authLoading.value = true;
    await signInWithPassword(loginForm.value.email, loginForm.value.password);
    message.success('로그인 성공!');
  } catch (error) {
    console.error('로그인 실패:', error);
    message.error('로그인에 실패했습니다.');
  } finally {
    authLoading.value = false;
  }
};

// 로그아웃 처리
const handleLogout = async () => {
  try {
    authLoading.value = true;
    await signOut();
    message.success('로그아웃 완료');
  } catch (error) {
    console.error('로그아웃 실패:', error);
    message.error('로그아웃에 실패했습니다.');
  } finally {
    authLoading.value = false;
  }
};

// 업로드 성공 처리
const handleUploadSuccess = (file: UploadedFileInfo) => {
  recentUploads.value.unshift(file);
  if (recentUploads.value.length > 6) {
    recentUploads.value = recentUploads.value.slice(0, 6);
  }
  message.success(`${file.originalName} 업로드 성공!`);
  loadStats(); // 통계 새로고침
};

// 업로드 실패 처리
const handleUploadError = (error: Error) => {
  console.error('업로드 실패:', error);
  message.error('파일 업로드에 실패했습니다.');
};

// 파일 목록 변경 처리
const handleFilesChange = (files: UploadedFileInfo[]) => {
  console.warn('파일 목록 변경:', files);
};

// 통계 로드
const loadStats = async () => {
  try {
    statsLoading.value = true;
    stats.value = await fetchFileStats();
  } catch (error) {
    console.error('통계 로드 실패:', error);
  } finally {
    statsLoading.value = false;
  }
};

// URL 복사
const copyUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url);
    message.success('URL이 클립보드에 복사되었습니다.');
  } catch (error) {
    console.error('복사 실패:', error);
    message.error('URL 복사에 실패했습니다.');
  }
};

// 파일 다운로드
const downloadFile = (file: UploadedFileInfo) => {
  const link = document.createElement('a');
  link.href = file.url;
  link.download = file.originalName;
  link.target = '_blank';
  document.body.append(link);
  link.click();
  link.remove();
};

// API 테스트 함수들
const addTestResult = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  testResults.value.push(`[${timestamp}] ${message}`);
};

const testConnection = async () => {
  try {
    addTestResult('연결 테스트 시작...');
    const isConnected = await checkSupabaseConnection();
    addTestResult(`연결 상태: ${isConnected ? '성공' : '실패'}`);
  } catch (error) {
    addTestResult(`연결 테스트 실패: ${error}`);
  }
};

const testAuth = async () => {
  try {
    addTestResult('인증 테스트 시작...');
    if (isSupabaseEnabled.value && isAuthenticated.value) {
      const userInfo = await supabaseGetUserInfoApi();
      addTestResult(
        `인증 성공: ${userInfo.email} (역할: ${userInfo.roles.join(', ')})`,
      );
    } else {
      addTestResult('인증되지 않음 또는 Mock 모드');
    }
  } catch (error) {
    addTestResult(`인증 테스트 실패: ${error}`);
  }
};

const testFileList = async () => {
  try {
    addTestResult('파일 목록 테스트 시작...');
    const result = await getFileListApi({ page: 1, pageSize: 5 });
    addTestResult(
      `파일 목록 조회 성공: ${result.total}개 파일 중 ${result.data.length}개 조회`,
    );
  } catch (error) {
    addTestResult(`파일 목록 테스트 실패: ${error}`);
  }
};

const testUpload = async () => {
  try {
    addTestResult('업로드 테스트 시작...');

    // 테스트용 더미 파일 생성
    const testContent = 'This is a test file content.';
    const testFile = new File([testContent], 'test.txt', {
      type: 'text/plain',
    });

    const result = await uploadFileApi(testFile, {
      bucket: 'user-uploads',
      category: 'test',
      public: true,
    });

    addTestResult(
      `업로드 테스트 성공: ${result.originalName} (${formatFileSize(result.fileSize)})`,
    );
  } catch (error) {
    addTestResult(`업로드 테스트 실패: ${error}`);
  }
};
</script>

<template>
  <div class="file-upload-demo">
    <!-- 페이지 헤더 -->
    <div class="mb-6">
      <h1 class="mb-2 text-2xl font-bold">파일 업로드 데모</h1>
      <p class="text-gray-600">
        Supabase Storage를 활용한 파일 업로드 및 관리 시스템
      </p>

      <!-- 상태 표시 -->
      <a-space class="mt-4">
        <a-tag :color="isSupabaseEnabled ? 'green' : 'blue'">
          {{ isSupabaseEnabled ? 'Supabase 모드' : 'Mock 모드' }}
        </a-tag>
        <a-tag :color="isAuthenticated ? 'green' : 'red'">
          {{ isAuthenticated ? '인증됨' : '미인증' }}
        </a-tag>
        <a-tag v-if="user" color="blue">
          {{ user.email }}
        </a-tag>
      </a-space>
    </div>

    <!-- 인증 섹션 -->
    <a-card title="1. 인증" class="mb-6" v-if="isSupabaseEnabled">
      <div v-if="!isAuthenticated">
        <a-form layout="inline" @finish="handleLogin">
          <a-form-item>
            <a-input
              v-model:value="loginForm.email"
              placeholder="이메일"
              type="email"
            />
          </a-form-item>
          <a-form-item>
            <a-input-password
              v-model:value="loginForm.password"
              placeholder="비밀번호"
            />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="authLoading">
              로그인
            </a-button>
          </a-form-item>
        </a-form>

        <div class="mt-4 rounded bg-gray-50 p-4">
          <p class="text-sm text-gray-600">
            <strong>테스트 계정:</strong><br />
            이메일: test@example.com<br />
            비밀번호: password123
          </p>
        </div>
      </div>

      <div v-else>
        <a-space>
          <span>환영합니다, {{ user?.email }}!</span>
          <a-button @click="handleLogout" :loading="authLoading">
            로그아웃
          </a-button>
        </a-space>
      </div>
    </a-card>

    <!-- 파일 업로드 섹션 -->
    <a-card title="2. 파일 업로드" class="mb-6">
      <a-tabs v-model:active-key="uploadTab">
        <!-- 기본 업로드 -->
        <a-tab-pane key="basic" tab="기본 업로드">
          <FileUploadBasic
            bucket="user-uploads"
            category="demo"
            :is-public="true"
            :multiple="true"
            :show-preview="true"
            :show-progress="true"
            :max-size="10 * 1024 * 1024"
            @success="handleUploadSuccess"
            @error="handleUploadError"
            @change="handleFilesChange"
          >
            <a-button type="primary" size="large">
              <UploadOutlined />
              파일 선택
            </a-button>
          </FileUploadBasic>
        </a-tab-pane>

        <!-- 이미지 전용 업로드 -->
        <a-tab-pane key="image" tab="이미지 업로드">
          <FileUploadBasic
            bucket="user-uploads"
            category="images"
            :is-public="true"
            :multiple="false"
            :show-preview="true"
            :show-progress="true"
            :max-size="5 * 1024 * 1024"
            :allowed-types="[
              'image/jpeg',
              'image/png',
              'image/gif',
              'image/webp',
            ]"
            accept="image/*"
            @success="handleUploadSuccess"
            @error="handleUploadError"
          >
            <div class="upload-area">
              <p class="text-center">
                <PictureOutlined class="mb-2 text-4xl text-gray-400" />
                <br />
                이미지를 드래그하거나 클릭하여 업로드
              </p>
            </div>
          </FileUploadBasic>
        </a-tab-pane>

        <!-- 문서 업로드 -->
        <a-tab-pane key="document" tab="문서 업로드">
          <FileUploadBasic
            bucket="documents"
            category="demo"
            :is-public="false"
            :multiple="true"
            :show-preview="true"
            :show-progress="true"
            :max-size="20 * 1024 * 1024"
            :allowed-types="[
              'application/pdf',
              'text/plain',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ]"
            accept=".pdf,.txt,.docx"
            @success="handleUploadSuccess"
            @error="handleUploadError"
          >
            <a-button>
              <FileOutlined />
              문서 업로드
            </a-button>
          </FileUploadBasic>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <!-- 업로드 결과 -->
    <a-card
      v-if="recentUploads.length > 0"
      title="3. 최근 업로드된 파일"
      class="mb-6"
    >
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="file in recentUploads"
          :key="file.id"
          class="rounded-lg border p-4 transition-shadow hover:shadow-md"
        >
          <!-- 이미지 미리보기 -->
          <div v-if="file.isImage" class="mb-3">
            <img
              :src="file.url"
              :alt="file.originalName"
              class="h-32 w-full rounded object-cover"
            />
          </div>

          <!-- 파일 아이콘 -->
          <div v-else class="mb-3 flex justify-center">
            <FileOutlined class="text-4xl text-gray-400" />
          </div>

          <!-- 파일 정보 -->
          <div class="text-sm">
            <p class="truncate font-medium" :title="file.originalName">
              {{ file.originalName }}
            </p>
            <p class="text-gray-500">
              {{ formatFileSize(file.fileSize) }}
            </p>
            <p class="text-gray-500">
              {{ file.mimeType }}
            </p>
          </div>

          <!-- 액션 버튼 -->
          <div class="mt-3 flex gap-2">
            <a-button size="small" @click="copyUrl(file.url)"> 복사 </a-button>
            <a-button size="small" @click="downloadFile(file)">
              다운로드
            </a-button>
          </div>
        </div>
      </div>
    </a-card>

    <!-- 파일 관리 -->
    <a-card title="4. 파일 관리" class="mb-6">
      <FileManager />
    </a-card>

    <!-- 통계 -->
    <a-card title="5. 파일 통계" class="mb-6">
      <div
        v-if="stats"
        class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <div class="rounded border p-4 text-center">
          <div class="text-2xl font-bold text-blue-600">
            {{ stats.overview.totalFiles }}
          </div>
          <div class="text-sm text-gray-600">전체 파일</div>
        </div>
        <div class="rounded border p-4 text-center">
          <div class="text-2xl font-bold text-green-600">
            {{ formatFileSize(stats.overview.totalSize) }}
          </div>
          <div class="text-sm text-gray-600">전체 크기</div>
        </div>
        <div class="rounded border p-4 text-center">
          <div class="text-2xl font-bold text-purple-600">
            {{ stats.overview.imageFiles }}
          </div>
          <div class="text-sm text-gray-600">이미지 파일</div>
        </div>
        <div class="rounded border p-4 text-center">
          <div class="text-2xl font-bold text-orange-600">
            {{ stats.overview.documentFiles }}
          </div>
          <div class="text-sm text-gray-600">문서 파일</div>
        </div>
      </div>

      <a-button @click="loadStats" :loading="statsLoading" class="mt-4">
        통계 새로고침
      </a-button>
    </a-card>

    <!-- API 테스트 -->
    <a-card title="6. API 테스트" class="mb-6">
      <a-space wrap>
        <a-button @click="testConnection">연결 테스트</a-button>
        <a-button @click="testAuth">인증 테스트</a-button>
        <a-button @click="testFileList">파일 목록 테스트</a-button>
        <a-button @click="testUpload">업로드 테스트</a-button>
      </a-space>

      <div v-if="testResults.length > 0" class="mt-4">
        <h4>테스트 결과:</h4>
        <div class="mt-2 max-h-60 overflow-y-auto rounded bg-gray-100 p-4">
          <pre class="text-sm">{{ testResults.join('\n') }}</pre>
        </div>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
.file-upload-demo {
  @apply mx-auto max-w-7xl p-6;
}

.upload-area {
  @apply rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-blue-400;
}

.upload-area:hover {
  @apply bg-blue-50;
}
</style>
