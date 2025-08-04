// Authentication
export {
  getCurrentSession,
  getCurrentUser,
  onAuthStateChange,
  refreshSession,
  signInWithEmail,
  signOut,
  signUp,
} from './auth';

export type { AuthResponse, LoginCredentials } from './auth';
// Supabase Client
export { isSupabaseEnabled, supabase, useSupabaseInDev } from './client';

// Database
export {
  deleteRecord,
  fetchById,
  fetchWithPagination,
  insertRecord,
  subscribeToTable,
  updateRecord,
} from './database';
export type {
  DatabaseResponse,
  PaginationOptions,
  SortOptions,
} from './database';

// Storage
export {
  copyFile,
  createSignedUrl,
  deleteFile,
  getPublicUrl,
  getTransformedImageUrl,
  listFiles,
  moveFile,
  uploadFile,
} from './storage';
export type { UploadOptions, UploadResponse } from './storage';
