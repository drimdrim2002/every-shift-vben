import type { Options as PwaPluginOptions } from 'vite-plugin-pwa';

import type { ImportmapPluginOptions } from './typing';

const isDevelopment = process.env.NODE_ENV === 'development';

const getDefaultPwaOptions = (name: string): Partial<PwaPluginOptions> => ({
  manifest: {
    description:
      'Vben Admin is a modern admin dashboard template based on Vue 3. ',
    icons: [
      {
        sizes: '192x192',
        src: 'https://unpkg.com/@vbenjs/static-source@0.1.7/source/pwa-icon-192.png',
        type: 'image/png',
      },
      {
        sizes: '512x512',
        src: 'https://unpkg.com/@vbenjs/static-source@0.1.7/source/pwa-icon-512.png',
        type: 'image/png',
      },
    ],
    name: `${name}${isDevelopment ? ' dev' : ''}`,
    short_name: `${name}${isDevelopment ? ' dev' : ''}`,
  },
});

/**
 * ImportMap CDN is temporarily disabled due to some packages not being supported and network instability
 */
const defaultImportmapOptions: ImportmapPluginOptions = {
  // Import via ImportMap CDN method
  // Currently only esm.sh source has better compatibility, jspm.io has high requirements for esm entry
  defaultProvider: 'esm.sh',
  importmap: [
    { name: 'vue' },
    { name: 'pinia' },
    { name: 'vue-router' },
    // { name: 'vue-i18n' },
    { name: 'dayjs' },
    { name: 'vue-demi' },
  ],
};

export { defaultImportmapOptions, getDefaultPwaOptions };
