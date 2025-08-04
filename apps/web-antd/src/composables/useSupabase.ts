import type { AuthError, User } from '@supabase/supabase-js';
import { ref, computed } from 'vue';
import { supabase } from '@vben/utils';

// Supabase 인증 상태 관리
const user = ref<User | null>(null);
const session = ref<any>(null);
const loading = ref(false);

export function useSupabase() {
  // 환경 변수에서 Supabase 사용 여부 확인
  const isSupabaseEnabled = computed(() => {
    return import.meta.env.VITE_USE_SUPABASE === 'true';
  });

  // 현재 사용자 정보
  const currentUser = computed(() => user.value);
  const isAuthenticated = computed(() => !!user.value);
  const isLoading = computed(() => loading.value);

  // 사용자 세션 초기화
  const initializeAuth = async () => {
    if (!isSupabaseEnabled.value) return;

    try {
      loading.value = true;

      // 현재 세션 가져오기
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (currentSession) {
        session.value = currentSession;
        user.value = currentSession.user;
      }

      // 인증 상태 변경 리스너 설정
      supabase.auth.onAuthStateChange((event, currentSession) => {
        console.log('Supabase Auth State Changed:', event);

        session.value = currentSession;
        user.value = currentSession?.user ?? null;

        if (event === 'SIGNED_OUT') {
          user.value = null;
          session.value = null;
        }
      });
    } catch (error) {
      console.error('Supabase 인증 초기화 실패:', error);
    } finally {
      loading.value = false;
    }
  };

  // 이메일/비밀번호 로그인
  const signInWithPassword = async (email: string, password: string) => {
    if (!isSupabaseEnabled.value) {
      throw new Error('Supabase가 활성화되지 않았습니다.');
    }

    try {
      loading.value = true;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      user.value = data.user;
      session.value = data.session;

      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Supabase 로그인 실패:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 로그아웃
  const signOut = async () => {
    if (!isSupabaseEnabled.value) return;

    try {
      loading.value = true;

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      user.value = null;
      session.value = null;
    } catch (error) {
      console.error('Supabase 로그아웃 실패:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 사용자 정보 새로고침
  const refreshUser = async () => {
    if (!isSupabaseEnabled.value) return null;

    try {
      const { data: { user: refreshedUser }, error } = await supabase.auth.getUser();

      if (error) throw error;

      user.value = refreshedUser;
      return refreshedUser;
    } catch (error) {
      console.error('사용자 정보 새로고침 실패:', error);
      throw error;
    }
  };

  // 토큰 새로고침
  const refreshToken = async () => {
    if (!isSupabaseEnabled.value) return null;

    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) throw error;

      session.value = data.session;
      user.value = data.user;

      return data.session;
    } catch (error) {
      console.error('토큰 새로고침 실패:', error);
      throw error;
    }
  };

  // 액세스 토큰 가져오기
  const getAccessToken = () => {
    return session.value?.access_token || null;
  };

  // 리프레시 토큰 가져오기
  const getRefreshToken = () => {
    return session.value?.refresh_token || null;
  };

  return {
    // 상태
    user: currentUser,
    session: computed(() => session.value),
    isAuthenticated,
    isLoading,
    isSupabaseEnabled,

    // 메서드
    initializeAuth,
    signInWithPassword,
    signOut,
    refreshUser,
    refreshToken,
    getAccessToken,
    getRefreshToken,
  };
}
