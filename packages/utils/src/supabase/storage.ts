import type { FileObject, StorageError } from '@supabase/supabase-js';
import { supabase } from './client';

export interface UploadResponse {
  data: { path: string } | null;
  error: StorageError | null;
}

export interface UploadOptions {
  cacheControl?: string;
  contentType?: string;
  upsert?: boolean;
}

/**
 * 파일 업로드
 */
export async function uploadFile(
  bucketName: string,
  path: string,
  file: File | Blob,
  options?: UploadOptions
): Promise<UploadResponse> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, file, {
        cacheControl: options?.cacheControl || '3600',
        upsert: options?.upsert || false,
        contentType: options?.contentType,
      });

    return { data, error };
  } catch (error) {
    return {
      data: null,
      error: error as StorageError,
    };
  }
}

/**
 * 파일 다운로드 URL 생성
 */
export function getPublicUrl(bucketName: string, path: string): string {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * 서명된 URL 생성 (임시 접근용)
 */
export async function createSignedUrl(
  bucketName: string,
  path: string,
  expiresIn: number = 60
): Promise<{ data: { signedUrl: string } | null; error: StorageError | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, expiresIn);

    return { data, error };
  } catch (error) {
    return {
      data: null,
      error: error as StorageError,
    };
  }
}

/**
 * 파일 목록 조회
 */
export async function listFiles(
  bucketName: string,
  path?: string,
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: { column: string; order: string };
  }
): Promise<{ data: FileObject[] | null; error: StorageError | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(path, {
        limit: options?.limit,
        offset: options?.offset,
        sortBy: options?.sortBy,
      });

    return { data, error };
  } catch (error) {
    return {
      data: null,
      error: error as StorageError,
    };
  }
}

/**
 * 파일 삭제
 */
export async function deleteFile(
  bucketName: string,
  paths: string[]
): Promise<{ data: FileObject[] | null; error: StorageError | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove(paths);

    return { data, error };
  } catch (error) {
    return {
      data: null,
      error: error as StorageError,
    };
  }
}

/**
 * 파일 이동
 */
export async function moveFile(
  bucketName: string,
  fromPath: string,
  toPath: string
): Promise<{ data: { message: string } | null; error: StorageError | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .move(fromPath, toPath);

    return { data, error };
  } catch (error) {
    return {
      data: null,
      error: error as StorageError,
    };
  }
}

/**
 * 파일 복사
 */
export async function copyFile(
  bucketName: string,
  fromPath: string,
  toPath: string
): Promise<{ data: { path: string } | null; error: StorageError | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .copy(fromPath, toPath);

    return { data, error };
  } catch (error) {
    return {
      data: null,
      error: error as StorageError,
    };
  }
}

/**
 * 이미지 변환 URL 생성
 */
export function getTransformedImageUrl(
  bucketName: string,
  path: string,
  options: {
    width?: number;
    height?: number;
    resize?: 'cover' | 'contain' | 'fill';
    format?: 'origin' | 'auto' | 'webp';
    quality?: number;
  }
): string {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(path, {
      transform: {
        width: options.width,
        height: options.height,
        resize: options.resize,
        format: options.format,
        quality: options.quality,
      },
    });

  return data.publicUrl;
}
