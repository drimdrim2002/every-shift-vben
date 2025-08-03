import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        // Supabase를 사용하므로 API 프록시 제거
        // Remove API proxy since we're using Supabase
        proxy: {
          // 필요한 경우 다른 프록시 설정을 여기에 추가
        },
      },
      // 빌드 최적화 설정
      build: {
        // 청크 크기 제한 증가
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            // 청크 분할 최적화 - 실제 패키지명으로 수정
            manualChunks: {
              vendor: ['vue', 'vue-router', 'pinia'],
              naive: ['naive-ui'],
              supabase: ['@supabase/supabase-js'],
            },
          },
        },
      },
    },
  };
});
