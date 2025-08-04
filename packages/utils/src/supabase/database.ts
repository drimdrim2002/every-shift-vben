import type { PostgrestError, PostgrestResponse } from '@supabase/supabase-js';
import { supabase } from './client';

export interface DatabaseResponse<T> {
  data: T | null;
  error: PostgrestError | null;
  count?: number;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface SortOptions {
  column: string;
  ascending?: boolean;
}

/**
 * 페이지네이션을 포함한 데이터 조회
 */
export async function fetchWithPagination<T>(
  tableName: string,
  options: {
    pagination?: PaginationOptions;
    sort?: SortOptions;
    filters?: Record<string, any>;
    select?: string;
  } = {}
): Promise<DatabaseResponse<T[]>> {
  try {
    let query = supabase.from(tableName).select(options.select || '*', { count: 'exact' });

    // 필터 적용
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    // 정렬 적용
    if (options.sort) {
      query = query.order(options.sort.column, { ascending: options.sort.ascending ?? true });
    }

    // 페이지네이션 적용
    if (options.pagination) {
      const { page, pageSize } = options.pagination;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    return {
      data: data as T[],
      error,
      count: count || 0,
    };
  } catch (error) {
    return {
      data: null,
      error: error as PostgrestError,
    };
  }
}

/**
 * 단일 레코드 조회
 */
export async function fetchById<T>(
  tableName: string,
  id: string | number,
  select?: string
): Promise<DatabaseResponse<T>> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select(select || '*')
      .eq('id', id)
      .single();

    return {
      data: data as T,
      error,
    };
  } catch (error) {
    return {
      data: null,
      error: error as PostgrestError,
    };
  }
}

/**
 * 레코드 생성
 */
export async function insertRecord<T>(
  tableName: string,
  data: Partial<T>
): Promise<DatabaseResponse<T>> {
  try {
    const { data: insertedData, error } = await supabase
      .from(tableName)
      .insert(data)
      .select()
      .single();

    return {
      data: insertedData as T,
      error,
    };
  } catch (error) {
    return {
      data: null,
      error: error as PostgrestError,
    };
  }
}

/**
 * 레코드 업데이트
 */
export async function updateRecord<T>(
  tableName: string,
  id: string | number,
  data: Partial<T>
): Promise<DatabaseResponse<T>> {
  try {
    const { data: updatedData, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    return {
      data: updatedData as T,
      error,
    };
  } catch (error) {
    return {
      data: null,
      error: error as PostgrestError,
    };
  }
}

/**
 * 레코드 삭제
 */
export async function deleteRecord(
  tableName: string,
  id: string | number
): Promise<{ error: PostgrestError | null }> {
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    return { error };
  } catch (error) {
    return { error: error as PostgrestError };
  }
}

/**
 * 실시간 구독 설정
 */
export function subscribeToTable(
  tableName: string,
  callback: (payload: any) => void,
  filter?: string
) {
  const channel = supabase
    .channel(`${tableName}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
        filter: filter,
      },
      callback
    )
    .subscribe();

  return channel;
}
