# 🎨 프론트엔드 Supabase 연동 가이드

## 📋 개요

Vue Vben Admin 프론트엔드에서 Supabase를 직접 연동하여 사용하기 위한 가이드입니다.

## 🌐 환경 변수 설정

### 1. 개발 환경 설정

`apps/web-antd/.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Vben Admin Environment
VITE_APP_TITLE=Vben Admin

# API Base URL
VITE_API_URL=/api

# Supabase 설정
VITE_USE_SUPABASE=false                  # true로 변경하면 Supabase 모드 활성화
VITE_SUPABASE_URL=https://kkxchntkzopfrpnvzzth.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreGNobnRrem9wZnJwbnZ6enRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTEyNDgsImV4cCI6MjA2OTc4NzI0OH0.wcRVKBmlsBBXBfOJ8Vypit-b47gRFVvecp1TVxonvmU

# Development
VITE_NITRO_MOCK=true
VITE_PWA=false
```

### 2. 프로덕션 환경 설정

프로덕션 환경에서는 다음과 같이 설정하세요:

```bash
# Supabase 모드 활성화
VITE_USE_SUPABASE=true
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# Mock 비활성화
VITE_NITRO_MOCK=false
```

## 🔧 새로 추가된 Composables

### 1. `useSupabase` - Supabase 인증 관리

```typescript
import { useSupabase } from '#/composables';

const {
  user, // 현재 사용자
  session, // 현재 세션
  isAuthenticated, // 인증 상태
  isLoading, // 로딩 상태
  isSupabaseEnabled, // Supabase 활성화 여부

  initializeAuth, // 인증 초기화
  signInWithPassword, // 이메일/비밀번호 로그인
  signOut, // 로그아웃
  refreshUser, // 사용자 정보 새로고침
  refreshToken, // 토큰 새로고침
  getAccessToken, // 액세스 토큰 가져오기
  getRefreshToken, // 리프레시 토큰 가져오기
} = useSupabase();
```

#### 사용 예시

```typescript
// 컴포넌트 마운트 시 인증 초기화
onMounted(async () => {
  await initializeAuth();
});

// 로그인
const handleLogin = async () => {
  try {
    await signInWithPassword('user@example.com', 'password');
    console.log('로그인 성공:', user.value);
  } catch (error) {
    console.error('로그인 실패:', error);
  }
};

// 로그아웃
const handleLogout = async () => {
  await signOut();
  console.log('로그아웃 완료');
};
```

### 2. `useFileUpload` - 파일 업로드 관리

```typescript
import { useFileUpload } from '#/composables';

const {
  uploading, // 업로드 진행 중 여부
  uploadProgress, // 업로드 진행률 (0-100)
  uploadedFiles, // 업로드된 파일 목록
  isSupabaseEnabled, // Supabase 활성화 여부

  validateFile, // 파일 유효성 검사
  uploadSingleFile, // 단일 파일 업로드
  uploadMultipleFiles, // 다중 파일 업로드
  customUpload, // Ant Design Upload용 커스텀 업로드
  convertToAntdFileList, // Ant Design 파일 리스트 변환
  removeUploadedFile, // 업로드된 파일 제거
  clearUploadedFiles, // 모든 업로드된 파일 제거
  uploadToSupabaseStorage, // 직접 Supabase Storage 업로드
} = useFileUpload(options);
```

#### 사용 예시

```typescript
// 파일 업로드 옵션
const uploadOptions = {
  bucket: 'user-uploads',
  category: 'images',
  isPublic: true,
  altText: 'Sample image',
  description: 'User uploaded image',
  tags: ['user', 'upload'],
  maxSize: 5 * 1024 * 1024, // 5MB
};

const { uploadSingleFile, uploading, uploadProgress } =
  useFileUpload(uploadOptions);

// 파일 업로드
const handleUpload = async (file: File) => {
  try {
    const result = await uploadSingleFile(file);
    console.log('업로드 성공:', result);
  } catch (error) {
    console.error('업로드 실패:', error);
  }
};
```

### 3. `useFileManager` - 파일 관리

```typescript
import { useFileManager } from '#/composables';

const {
  files, // 파일 목록
  total, // 전체 파일 수
  stats, // 파일 통계
  searchParams, // 검색 매개변수
  hasFiles, // 파일 존재 여부
  totalPages, // 전체 페이지 수
  isLoading, // 로딩 상태

  fetchFiles, // 파일 목록 조회
  fetchFileDetail, // 파일 상세 조회
  updateFile, // 파일 정보 수정
  deleteFile, // 파일 삭제
  bulkDeleteFiles, // 파일 일괄 삭제
  fetchFileStats, // 파일 통계 조회
  updateSearchParams, // 검색 매개변수 업데이트
  resetSearchParams, // 검색 매개변수 초기화

  formatFileSize, // 파일 크기 포맷팅
  getFileTypeIcon, // 파일 타입 아이콘
} = useFileManager();
```

#### 사용 예시

```typescript
// 파일 목록 조회
onMounted(async () => {
  await fetchFiles({
    page: 1,
    pageSize: 20,
    bucket: 'user-uploads',
    isImage: true,
  });
});

// 파일 검색
const handleSearch = (searchTerm: string) => {
  updateSearchParams({ search: searchTerm, page: 1 });
  fetchFiles();
};

// 파일 삭제
const handleDelete = async (fileId: string) => {
  try {
    await deleteFile(fileId);
    console.log('파일 삭제 완료');
  } catch (error) {
    console.error('파일 삭제 실패:', error);
  }
};
```

## 🎨 새로 추가된 컴포넌트

### 1. `FileUploadBasic` - 기본 파일 업로드

```vue
<template>
  <FileUploadBasic
    bucket="user-uploads"
    category="images"
    :is-public="true"
    :multiple="false"
    :show-preview="true"
    :show-progress="true"
    :max-size="10 * 1024 * 1024"
    @success="handleUploadSuccess"
    @error="handleUploadError"
    @change="handleFilesChange"
  >
    <a-button type="primary">
      <UploadOutlined />
      파일 업로드
    </a-button>
  </FileUploadBasic>
</template>

<script setup lang="ts">
import { FileUploadBasic } from '#/components';
import type { UploadedFileInfo } from '#/composables';

const handleUploadSuccess = (file: UploadedFileInfo) => {
  console.log('업로드 성공:', file);
};

const handleUploadError = (error: Error) => {
  console.error('업로드 실패:', error);
};

const handleFilesChange = (files: UploadedFileInfo[]) => {
  console.log('파일 목록 변경:', files);
};
</script>
```

### 2. `FileManager` - 파일 관리 인터페이스

```vue
<template>
  <div>
    <h2>파일 관리</h2>
    <FileManager />
  </div>
</template>

<script setup lang="ts">
import { FileManager } from '#/components';
</script>
```

## 📡 새로 추가된 API 함수

### 1. 직접 Supabase API

```typescript
import {
  supabaseLoginApi,
  supabaseLogoutApi,
  supabaseGetUserInfoApi,
  supabaseRefreshTokenApi,
  supabaseUploadFileApi,
  supabaseDeleteFileApi,
  supabaseListFilesApi,
  isSupabaseEnabled,
  checkSupabaseConnection,
} from '#/api/core';

// 직접 Supabase 로그인
const loginResult = await supabaseLoginApi({
  email: 'user@example.com',
  password: 'password',
});

// 사용자 정보 조회
const userInfo = await supabaseGetUserInfoApi();

// 파일 업로드
const uploadResult = await supabaseUploadFileApi(
  file,
  'user-uploads',
  'custom/path.jpg',
);
```

### 2. 기존 API (Backend Mock을 통한 방식)

```typescript
import {
  uploadFileApi,
  getFileListApi,
  getFileDetailApi,
  updateFileApi,
  deleteFileApi,
  bulkDeleteFilesApi,
  getFileStatsApi,
} from '#/api/core';

// 파일 업로드
const uploadResult = await uploadFileApi(file, {
  bucket: 'user-uploads',
  category: 'images',
  public: true,
  alt_text: 'Image description',
  tags: ['image', 'user'],
});

// 파일 목록 조회
const fileList = await getFileListApi({
  page: 1,
  pageSize: 20,
  bucket: 'user-uploads',
  isImage: true,
});

// 파일 통계
const stats = await getFileStatsApi();
```

## 🔄 Dual Mode 동작 방식

### Mock 모드 (VITE_USE_SUPABASE=false)

- Backend Mock API를 통한 요청
- 메모리 기반 임시 데이터
- 개발 및 테스트에 적합
- 서버 재시작 시 데이터 초기화

### Supabase 모드 (VITE_USE_SUPABASE=true)

- Supabase를 직접 호출하거나 Backend API를 통해 호출
- 실제 데이터베이스 저장
- 프로덕션 환경에 적합
- 영구적인 데이터 저장

## 🎯 사용 시나리오

### 시나리오 1: 완전 프론트엔드 Supabase 연동

```typescript
// .env.local
VITE_USE_SUPABASE = true;

// 컴포넌트에서
import { useSupabase, useFileUpload } from '#/composables';
import { supabaseUploadFileApi } from '#/api/core';

const { user, signInWithPassword } = useSupabase();
const { uploadSingleFile } = useFileUpload();

// 로그인 후 파일 업로드
await signInWithPassword('user@example.com', 'password');
const uploadResult = await uploadSingleFile(file);
```

### 시나리오 2: Backend API를 통한 Supabase 연동

```typescript
// .env.local
VITE_USE_SUPABASE = false; // Backend Mock에서 Supabase 모드 사용

// 컴포넌트에서
import { loginApi } from '#/api/core';
import { useFileUpload } from '#/composables';

const { uploadSingleFile } = useFileUpload();

// 기존 방식으로 로그인
await loginApi({ username: 'user', password: 'password' });

// Backend API를 통해 Supabase Storage 사용
const uploadResult = await uploadSingleFile(file);
```

### 시나리오 3: 하이브리드 방식

```typescript
// 인증은 Backend API, 파일은 직접 Supabase
import { loginApi } from '#/api/core';
import { supabaseUploadFileApi } from '#/api/core';

// Backend API로 로그인
await loginApi({ username: 'user', password: 'password' });

// 직접 Supabase Storage 사용
const uploadResult = await supabaseUploadFileApi(file, 'user-uploads');
```

## 🛠️ 개발 가이드

### 1. 새로운 페이지에서 파일 업로드 사용

```vue
<template>
  <div class="upload-page">
    <h1>파일 업로드</h1>

    <!-- 기본 업로드 -->
    <FileUploadBasic
      bucket="user-uploads"
      category="documents"
      :multiple="true"
      @success="handleSuccess"
    />

    <!-- 업로드된 파일 관리 -->
    <div v-if="uploadedFiles.length > 0" class="mt-8">
      <h2>업로드된 파일</h2>
      <FileManager />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FileUploadBasic, FileManager } from '#/components';
import type { UploadedFileInfo } from '#/composables';

const uploadedFiles = ref<UploadedFileInfo[]>([]);

const handleSuccess = (file: UploadedFileInfo) => {
  uploadedFiles.value.push(file);
};
</script>
```

### 2. 인증 상태에 따른 조건부 렌더링

```vue
<template>
  <div>
    <div v-if="!isAuthenticated">
      <a-button @click="handleLogin">로그인</a-button>
    </div>

    <div v-else>
      <p>환영합니다, {{ user?.email }}</p>
      <FileUploadBasic bucket="user-uploads" />
      <a-button @click="handleLogout">로그아웃</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSupabase } from '#/composables';

const { user, isAuthenticated, signInWithPassword, signOut } = useSupabase();

const handleLogin = async () => {
  await signInWithPassword('user@example.com', 'password');
};

const handleLogout = async () => {
  await signOut();
};
</script>
```

### 3. 커스텀 파일 업로드 로직

```vue
<template>
  <div>
    <a-upload :custom-request="customUpload" :before-upload="beforeUpload">
      <a-button>커스텀 업로드</a-button>
    </a-upload>
  </div>
</template>

<script setup lang="ts">
import { useFileUpload } from '#/composables';

const { customUpload, validateFile } = useFileUpload({
  bucket: 'product-images',
  category: 'catalog',
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png'],
});

const beforeUpload = (file: File) => {
  const validation = validateFile(file);
  return validation.valid;
};
</script>
```

## 🔍 디버깅 및 문제 해결

### 1. 환경 변수 확인

```typescript
// 브라우저 콘솔에서 확인
console.log('Supabase 사용:', import.meta.env.VITE_USE_SUPABASE);
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY);
```

### 2. Supabase 연결 확인

```typescript
import { checkSupabaseConnection } from '#/api/core';

// 연결 상태 확인
const isConnected = await checkSupabaseConnection();
console.log('Supabase 연결:', isConnected);
```

### 3. 인증 상태 디버깅

```typescript
import { useSupabase } from '#/composables';

const { user, session, isAuthenticated } = useSupabase();

// 실시간 상태 확인
watch([user, session, isAuthenticated], ([newUser, newSession, newAuth]) => {
  console.log('User:', newUser);
  console.log('Session:', newSession);
  console.log('Authenticated:', newAuth);
});
```

## 🎉 마이그레이션 체크리스트

- [ ] `.env.local` 파일 생성 및 환경 변수 설정
- [ ] `useSupabase` composable을 통한 인증 상태 관리
- [ ] `useFileUpload` composable을 통한 파일 업로드
- [ ] `useFileManager` composable을 통한 파일 관리
- [ ] `FileUploadBasic` 컴포넌트 사용
- [ ] `FileManager` 컴포넌트 사용
- [ ] API 함수들 테스트
- [ ] Dual Mode 전환 테스트
- [ ] 프로덕션 환경 설정

## 🚀 다음 단계

1. **테스트**: 모든 기능이 정상 작동하는지 확인
2. **최적화**: 성능 및 UX 개선
3. **문서화**: 팀원들을 위한 상세 가이드 작성
4. **배포**: 프로덕션 환경에 적용

이제 프론트엔드에서 Supabase를 완전히 활용할 수 있습니다! 🎉
