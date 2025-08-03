# 권한 시스템 테스트 가이드

구현된 권한 및 접근 제어 시스템을 체계적으로 테스트하는 방법을 안내합니다.

## 🚀 시작하기

### 1. 애플리케이션 실행

```bash
pnpm --filter web-naive dev
```

### 2. 브라우저에서 접속

- URL: http://localhost:5888
- 개발자 도구 콘솔을 열어두세요 (F12)

## 👥 테스트 사용자

### 자동 생성 테스트 사용자들:

| 역할 | 이메일 | 비밀번호 | 권한 |
| --- | --- | --- | --- |
| **Admin** | admin@test.com | admin123456 | 모든 권한 |
| **Manager** | manager@test.com | manager123456 | 사용자 관리, 팀 관리, 리포트 |
| **Employee** | employee@test.com | employee123456 | 기본 대시보드, 프로필 |

## 🧪 테스트 시나리오

### Phase 1: 테스트 사용자 생성

1. **Permission Test 페이지 접속**
   - 메뉴: Examples → Permission System Test
   - 또는 직접 URL: http://localhost:5888/examples/permission-test

2. **테스트 사용자 생성**
   - "Create Test Users" 버튼 클릭
   - 콘솔에서 생성 결과 확인
   - 생성 성공 시 3명의 테스트 사용자가 만들어짐

### Phase 2: Admin 사용자 테스트

1. **로그아웃 후 Admin으로 로그인**
   - Email: admin@test.com
   - Password: admin123456

2. **메뉴 확인**
   - ✅ Dashboard 표시
   - ✅ System Management 표시
     - ✅ User Management 표시
     - ✅ Role Management 표시
     - ✅ Permission Management 표시
   - ✅ Analytics 표시
   - ✅ Reports 표시
   - ✅ Team Management 표시
   - ✅ Examples 표시

3. **기능 접근 테스트**
   - System Management → User Management 접속 성공
   - System Management → Permission Management 접속 성공
   - User Management에서 Edit/Delete 버튼 표시 확인

4. **Permission Test 페이지에서 확인**
   - Current User Information 섹션에서 Admin 권한 확인
   - Permission Function Tests에서 모든 테스트 ✅ 표시
   - Permission-Based Rendering Tests에서 모든 요소 표시

### Phase 3: Manager 사용자 테스트

1. **로그아웃 후 Manager로 로그인**
   - Email: manager@test.com
   - Password: manager123456

2. **메뉴 확인**
   - ✅ Dashboard 표시
   - ✅ System Management 표시
     - ✅ User Management 표시
     - ❌ Role Management 표시 안됨
     - ❌ Permission Management 표시 안됨
   - ❌ Analytics 표시 안됨
   - ✅ Reports 표시
   - ✅ Team Management 표시

3. **기능 접근 테스트**
   - User Management 접속 성공
   - Permission Management 직접 URL 접속 → 403 Forbidden 페이지
   - User Management에서 Edit 버튼 표시, Delete 버튼 숨김

4. **403 페이지 테스트**
   - URL 직접 입력: http://localhost:5888/system/permission
   - 403 Forbidden 페이지 표시 확인
   - 현재 권한 정보 표시 확인

### Phase 4: Employee 사용자 테스트

1. **로그아웃 후 Employee로 로그인**
   - Email: employee@test.com
   - Password: employee123456

2. **메뉴 확인**
   - ✅ Dashboard 표시
   - ❌ System Management 표시 안됨
   - ❌ Analytics 표시 안됨
   - ❌ Reports 표시 안됨
   - ❌ Team Management 표시 안됨
   - ✅ Examples 표시 (테스트용)

3. **기능 접근 테스트**
   - User Management 직접 URL 접속 → 403 Forbidden
   - Role Management 직접 URL 접속 → 403 Forbidden
   - Permission Management 직접 URL 접속 → 403 Forbidden

## 🔧 고급 테스트

### 개발자 콘솔 테스트

브라우저 개발자 콘솔에서 다음 명령어들을 실행해보세요:

```javascript
// 현재 사용자 권한 정보 확인
getCurrentUserInfo();

// 테스트 사용자 재생성
resetTestUsers();

// 테스트 지침 출력
logTestInstructions();
```

### Permission Directive 테스트

Permission Test 페이지에서 다양한 directive들의 동작을 확인:

- `v-permission`: 특정 권한 기반 렌더링
- `v-role`: 역할 기반 렌더링
- `v-admin`: 관리자 전용 렌더링
- `PermissionGuard` 컴포넌트: 조건부 렌더링 with fallback

### 실시간 권한 변경 테스트

1. **Admin으로 로그인**
2. **User Management에서 사용자 역할 변경**
3. **실시간으로 메뉴/권한 업데이트 확인**

## 📋 체크리스트

### ✅ 기본 기능

- [ ] 테스트 사용자 생성 성공
- [ ] 역할별 로그인 성공
- [ ] 역할별 메뉴 표시/숨김 정상 동작

### ✅ 접근 제어

- [ ] Admin: 모든 메뉴/기능 접근 가능
- [ ] Manager: 제한된 메뉴/기능 접근
- [ ] Employee: 최소한의 메뉴/기능만 접근
- [ ] 미인가 URL 접근 시 403 페이지 표시

### ✅ UI 요소 제어

- [ ] 권한별 버튼 표시/숨김
- [ ] Permission Guard 컴포넌트 정상 동작
- [ ] Permission Directive 정상 동작

### ✅ 실시간 업데이트

- [ ] 권한 변경 시 실시간 메뉴 업데이트
- [ ] 사용자 역할 변경 시 실시간 권한 업데이트

## 🐛 문제 해결

### 테스트 사용자 생성 실패

- Supabase 프로젝트 설정 확인
- 환경 변수 (.env.local) 확인
- 데이터베이스 마이그레이션 완료 여부 확인

### 403 페이지가 표시되지 않음

- 라우터 가드 설정 확인
- 권한 체크 로직 확인
- 브라우저 캐시 삭제 후 재시도

### 메뉴가 예상과 다르게 표시됨

- 사용자 역할/권한 확인
- 메뉴 생성 로직 확인
- 브라우저 새로고침 후 재시도

## 📞 추가 지원

문제가 발생하면 다음을 확인하세요:

1. 브라우저 개발자 도구 콘솔의 에러 메시지
2. Network 탭에서 API 요청/응답 확인
3. Supabase 대시보드에서 데이터베이스 상태 확인
