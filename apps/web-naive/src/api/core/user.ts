import type { UserInfo } from '@vben/types';

import { supabaseGetUserInfoApi } from './supabase-auth';

/**
 * 获取用户信息 - 현재 Supabase 구현으로 전환
 * Get user info - switched to Supabase implementation
 */
export async function getUserInfoApi(): Promise<UserInfo> {
  return supabaseGetUserInfoApi();
}
