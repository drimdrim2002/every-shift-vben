import type { RouteRecordStringComponent } from '@vben/types';

import { supabaseGetAllMenusApi } from './supabase-menu';

/**
 * 获取用户所有菜单 - 현재 Supabase 구현으로 전환
 * Get all user menus - switched to Supabase implementation
 */
export async function getAllMenusApi(): Promise<RouteRecordStringComponent[]> {
  return supabaseGetAllMenusApi();
}
