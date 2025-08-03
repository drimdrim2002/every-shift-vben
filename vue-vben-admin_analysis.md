# Vue Vben Admin 프로젝트 분석

## 개요

Vue Vben Admin은 Vue 3, Vite, TypeScript, Monorepo를 사용하여 구축된 현대적인 관리자 패널 템플릿입니다. 이 프로젝트는 엔터프라이즈급 애플리케이션 개발을 위한 완전한 솔루션을 제공합니다.

### 주요 정보

- **버전**: 5.5.8
- **라이선스**: MIT
- **GitHub**: https://github.com/vbenjs/vue-vben-admin
- **공식 사이트**: https://vben.pro
- **GitHub Stars**: 29.4k+

## 기술 스택

### 핵심 기술

- **프레임워크**: Vue 3 (^3.5.17)
- **빌드 도구**: Vite (^6.3.5)
- **언어**: TypeScript (^5.8.3)
- **모노레포 관리**: pnpm (>=9.12.0) + Turbo (^2.5.4)
- **스타일링**: TailwindCSS (^3.4.17)
- **상태 관리**: Pinia (^3.0.3)
- **라우팅**: Vue Router (^4.5.1)

### UI 프레임워크

- **Ant Design Vue**: ^4.2.6
- **Element Plus**: ^2.10.2
- **Naive UI**: ^2.42.0

### 개발 도구 및 라이브러리

- **VueUse**: ^13.4.0
- **Vue I18n**: ^11.1.7
- **Iconify Vue**: ^5.0.0
- **Vue DevTools**: ^7.7.7
- **ESLint**: ^9.30.1
- **Prettier**: ^3.6.2
- **Vitest**: ^3.2.4
- **Playwright**: ^1.53.2

### 개발 환경 요구사항

- **Node.js**: >=20.10.0
- **pnpm**: >=9.12.0
- **패키지 매니저**: pnpm@10.12.4

## 프로젝트 구조

### 모노레포 아키텍처

```
every-shift-vben/
├── apps/                    # 애플리케이션 디렉토리
│   ├── backend-mock/       # Mock 백엔드 서버
│   ├── web-antd/          # Ant Design Vue 버전
│   ├── web-ele/           # Element Plus 버전
│   └── web-naive/         # Naive UI 버전
│
├── packages/               # 공유 패키지
│   ├── @core/             # 핵심 기능 패키지
│   │   ├── base/
│   │   ├── composables/
│   │   ├── preferences/
│   │   └── ui-kit/
│   ├── constants/         # 상수 정의
│   ├── effects/           # 부수효과 관리
│   ├── icons/             # 아이콘 패키지
│   ├── locales/           # 국제화(i18n)
│   ├── preferences/       # 환경설정
│   ├── stores/            # 전역 상태 관리
│   ├── styles/            # 공통 스타일
│   ├── types/             # TypeScript 타입 정의
│   └── utils/             # 유틸리티 함수
│
├── internal/               # 내부 빌드/설정 도구
│   ├── lint-configs/      # Lint 설정
│   ├── node-utils/        # Node.js 유틸리티
│   ├── tailwind-config/   # Tailwind 설정
│   ├── tsconfig/          # TypeScript 설정
│   └── vite-config/       # Vite 설정
│
├── playground/            # 개발 플레이그라운드
├── docs/                  # 문서
└── scripts/              # 빌드 및 배포 스크립트
```

## 주요 특징

### 1. 멀티 UI 프레임워크 지원

- **Ant Design Vue**: 엔터프라이즈급 디자인 시스템
- **Element Plus**: 개발자 친화적인 컴포넌트 라이브러리
- **Naive UI**: 모던하고 커스터마이징 가능한 UI

### 2. UI Kit 구성

```
packages/@core/ui-kit/
├── shadcn-ui/        # Shadcn UI 컴포넌트
├── tabs-ui/          # 탭 컴포넌트
├── form-ui/          # 폼 컴포넌트
├── layout-ui/        # 레이아웃 컴포넌트
├── menu-ui/          # 메뉴 컴포넌트
└── popup-ui/         # 팝업 컴포넌트
```

### 3. 공유 패키지

각 애플리케이션은 다음과 같은 공유 패키지를 사용합니다:

- `@vben/access`: 접근 권한 관리
- `@vben/common-ui`: 공통 UI 컴포넌트
- `@vben/hooks`: Vue Composable 함수
- `@vben/layouts`: 레이아웃 시스템
- `@vben/request`: HTTP 요청 처리
- `@vben/plugins`: Vite 플러그인

## 개발 스크립트

### 기본 명령어

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev             # 모든 앱 실행
pnpm dev:antd        # Ant Design 버전만 실행
pnpm dev:ele        # Element Plus 버전만 실행
pnpm dev:naive      # Naive UI 버전만 실행

# 빌드
pnpm build          # 모든 앱 빌드
pnpm build:antd     # Ant Design 버전만 빌드
pnpm build:analyze  # 번들 분석과 함께 빌드

# 테스트
pnpm test:unit      # 단위 테스트
pnpm test:e2e       # E2E 테스트

# 코드 품질
pnpm lint           # Lint 검사
pnpm format         # 코드 포맷팅
pnpm typecheck      # TypeScript 타입 체크
```

### 유틸리티 명령어

```bash
# 프로젝트 정리
pnpm clean          # 빌드 결과물 삭제
pnpm reinstall      # 의존성 재설치

# 의존성 관리
pnpm update:deps    # 의존성 업데이트
pnpm check:dep      # 의존성 검사
pnpm check:circular # 순환 의존성 검사
```

## 앱 구조 (web-antd 예시)

```
apps/web-antd/src/
├── adapter/          # 어댑터 패턴 구현
├── api/             # API 서비스 레이어
├── layouts/         # 페이지 레이아웃
├── locales/         # 다국어 파일
├── router/          # 라우팅 설정
├── store/           # 상태 관리
├── views/           # 페이지 컴포넌트
├── app.vue          # 루트 컴포넌트
├── bootstrap.ts     # 앱 초기화
├── main.ts          # 진입점
└── preferences.ts   # 기본 설정
```

## Turbo 빌드 파이프라인

프로젝트는 Turbo를 사용하여 효율적인 빌드 파이프라인을 구성합니다:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "outputs": []
    }
  }
}
```

## 사이드 프로젝트 시작을 위한 권장사항

### 1. UI 프레임워크 선택

- **Ant Design Vue**: 엔터프라이즈 애플리케이션에 적합
- **Element Plus**: 빠른 개발과 프로토타이핑에 적합
- **Naive UI**: 커스텀 디자인이 필요한 경우 적합

### 2. 커스터마이징 포인트

- `apps/[선택한-ui]/src/preferences.ts`: 기본 설정 변경
- `apps/[선택한-ui]/src/router/`: 라우팅 구조 수정
- `apps/[선택한-ui]/src/views/`: 페이지 추가/수정
- `packages/locales/`: 다국어 지원 추가

### 3. 개발 워크플로우

1. 원하는 UI 버전 선택 (antd/ele/naive)
2. `pnpm dev:[ui-name]`으로 개발 서버 실행
3. 필요한 페이지와 기능 추가
4. 공통 기능은 packages 디렉토리에 추가
5. `pnpm build:[ui-name]`으로 프로덕션 빌드

### 4. 주의사항

- 버전 5.0은 이전 버전과 호환되지 않음
- pnpm을 패키지 매니저로 사용 필수
- Node.js 20.10.0 이상 필요
- 모노레포 구조로 인해 초기 설치 시간이 소요될 수 있음

## Cursor Rule 설정을 위한 핵심 정보

1. **파일 경로 별칭**: `#/*` → `./src/*`
2. **공유 패키지 접두사**: `@vben/*`
3. **TypeScript 설정**: strict mode 활성화
4. **코드 스타일**: ESLint + Prettier 적용
5. **컴포넌트 네이밍**: PascalCase 사용
6. **Composable 네이밍**: `use` 접두사 사용
7. **상태 관리**: Pinia stores 사용
8. **라우팅**: Vue Router 4 사용
