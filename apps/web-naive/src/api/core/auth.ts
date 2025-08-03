import {
  supabaseGetAccessCodesApi,
  supabaseLoginApi,
  supabaseLogoutApi,
  supabaseRefreshTokenApi,
} from './supabase-auth';

export namespace AuthApi {
  /** 登录接口参数 - 현재 Supabase 구현으로 전환 */
  export interface LoginParams {
    email: string;
    password: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

/**
 * 登录 - 현재 Supabase 구현으로 전환
 * Login - switched to Supabase implementation
 */
export async function loginApi(data: AuthApi.LoginParams) {
  const result = await supabaseLoginApi(data);
  return {
    accessToken: result.accessToken,
  };
}

/**
 * 刷新accessToken - 현재 Supabase 구현으로 전환
 * Refresh access token - switched to Supabase implementation
 */
export async function refreshTokenApi() {
  return supabaseRefreshTokenApi();
}

/**
 * 退出登录 - 현재 Supabase 구현으로 전환
 * Logout - switched to Supabase implementation
 */
export async function logoutApi() {
  return supabaseLogoutApi();
}

/**
 * 获取用户权限码 - 현재 Supabase 구현으로 전환
 * Get user access codes - switched to Supabase implementation
 */
export async function getAccessCodesApi() {
  return supabaseGetAccessCodesApi();
}
