// Supabase Client
export { supabase, isSupabaseEnabled, useSupabaseInDev } from './client';

// Authentication
export {
  signInWithEmail,
  signUp,
  signOut,
  getCurrentUser,
  getCurrentSession,
  refreshSession,
  onAuthStateChange,
} from './auth';
export type { LoginCredentials, AuthResponse } from './auth';

// Database
export {
  fetchWithPagination,
  fetchById,
  insertRecord,
  updateRecord,
  deleteRecord,
  subscribeToTable,
} from './database';
export type {
  DatabaseResponse,
  PaginationOptions,
  SortOptions,
} from './database';

// Storage
export {
  uploadFile,
  getPublicUrl,
  createSignedUrl,
  listFiles,
  deleteFile,
  moveFile,
  copyFile,
  getTransformedImageUrl,
} from './storage';
export type { UploadResponse, UploadOptions } from './storage';
