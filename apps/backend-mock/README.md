# @vben/backend-mock

## Description

Vben Admin 백엔드 Mock 서비스입니다. 개발 단계에서는 Mock 데이터를 사용하고, 필요시 Supabase와 연동하여 실제 데이터베이스를 사용할 수 있습니다.

## Features

- **Dual Mode**: Mock 데이터와 Supabase 중 선택 가능
- **JWT 인증**: Mock 모드에서 JWT 토큰 기반 인증
- **Supabase Auth**: Supabase 모드에서 실제 인증 시스템
- **권한 관리**: 역할 기반 접근 제어 (RBAC)
- **CORS 지원**: 모든 프론트엔드 앱에서 접근 가능

## Environment Variables

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```bash
# Supabase 사용 여부 (기본값: false)
USE_SUPABASE=false
VITE_USE_SUPABASE=false

# Supabase 설정 (USE_SUPABASE=true일 때 필요)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Running the app

### Mock 모드 (기본)
```bash
# development
$ pnpm run start

# production mode
$ pnpm run build
```

### Supabase 모드
```bash
# 환경 변수 설정 후
$ USE_SUPABASE=true pnpm run start

# 또는 .env.local에서 USE_SUPABASE=true 설정 후
$ pnpm run start
```

## API Endpoints

### 인증 (Authentication)
- `POST /api/auth/login` - 로그인 (username/email + password)
- `POST /api/auth/logout` - 로그아웃
- `POST /api/auth/refresh` - 토큰 갱신

### 사용자 (User)
- `GET /api/user/info` - 현재 사용자 정보

### 메뉴 관리 (Menu Management)
- `GET /api/menu/all` - 사용자별 메뉴 트리 조회
- `GET /api/menu/list` - 메뉴 관리 목록 조회 (페이징, 검색, 필터)
- `GET /api/menu/:id` - 메뉴 상세 정보 조회
- `POST /api/menu/create` - 새 메뉴 생성 (super 권한 필요)
- `PUT /api/menu/update/:id` - 메뉴 수정 (admin+ 권한 필요)
- `DELETE /api/menu/delete/:id` - 메뉴 삭제 (super 권한 필요)
- `POST /api/menu/reorder` - 메뉴 순서 변경 (admin+ 권한 필요)
- `PATCH /api/menu/toggle-status/:id` - 메뉴 활성화/비활성화 (admin+ 권한 필요)

### 테이블 데이터 관리 (Table Data Management)
- `GET /api/table/list` - 상품 목록 조회 (페이징, 검색, 필터, 정렬)
- `GET /api/table/:id` - 상품 상세 정보 조회
- `POST /api/table/create` - 새 상품 생성 (admin+ 권한 필요)
- `PUT /api/table/update/:id` - 상품 수정 (admin+ 권한 필요)
- `DELETE /api/table/delete/:id` - 상품 삭제 (super 권한 필요)
- `POST /api/table/bulk-delete` - 상품 일괄 삭제 (super 권한 필요)
- `POST /api/table/bulk-update-status` - 상품 상태 일괄 변경 (admin+ 권한 필요)
- `GET /api/table/categories` - 카테고리 목록 조회

### 파일 관리 (File Management)
- `POST /api/upload` - 파일 업로드 (multipart/form-data, 10MB 제한)
- `GET /api/files/list` - 파일 목록 조회 (페이징, 검색, 필터)
- `GET /api/files/:id` - 파일 상세 정보 조회
- `PUT /api/files/update/:id` - 파일 정보 수정 (소유자/관리자만)
- `DELETE /api/files/delete/:id` - 파일 삭제 (소유자/관리자만)
- `POST /api/files/bulk-delete` - 파일 일괄 삭제 (최대 50개)
- `GET /api/files/stats` - 파일 통계 조회

### 기타
- `GET /api/status?status=400` - 상태 코드 테스트

## Usage Notes

- Mock 모드: 메모리 기반, 서버 재시작 시 데이터 초기화
- Supabase 모드: 실제 데이터베이스, 영구 데이터 저장
- 기존 API 구조 유지로 프론트엔드 코드 변경 불필요
