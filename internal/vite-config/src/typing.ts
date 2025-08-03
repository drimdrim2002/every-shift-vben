import type { PluginVisualizerOptions } from 'rollup-plugin-visualizer';
import type { ConfigEnv, PluginOption, UserConfig } from 'vite';
import type { PluginOptions } from 'vite-plugin-dts';
import type { Options as PwaPluginOptions } from 'vite-plugin-pwa';

/**
 * ImportMap configuration interface
 * @description Used to configure module import mapping, supports custom import paths and scopes
 * @example
 * ```typescript
 * {
 *   imports: {
 *     'vue': 'https://unpkg.com/vue@3.2.47/dist/vue.esm-browser.js'
 *   },
 *   scopes: {
 *     'https://site.com/': {
 *       'vue': 'https://unpkg.com/vue@3.2.47/dist/vue.esm-browser.js'
 *     }
 *   }
 * }
 * ```
 */
interface IImportMap {
  /** Module import mapping */
  imports?: Record<string, string>;
  /** Scope-specific import mapping */
  scopes?: {
    [scope: string]: Record<string, string>;
  };
}

/**
 * Print plugin configuration options
 * @description Used to configure console print information
 */
interface PrintPluginOptions {
  /**
   * Data mapping to print
   * @description Key-value pair data that will be printed in the console
   * @example
   * ```typescript
   * {
   *   'App Version': '1.0.0',
   *   'Build Time': '2024-01-01'
   * }
   * ```
   */
  infoMap?: Record<string, string | undefined>;
}

/**
 * Nitro Mock plugin configuration options
 * @description Used to configure Nitro Mock server behavior
 */
interface NitroMockPluginOptions {
  /**
   * Mock server package name
   * @default '@vbenjs/nitro-mock'
   */
  mockServerPackage?: string;

  /**
   * Mock server port
   * @default 3000
   */
  port?: number;

  /**
   * Whether to print Mock logs
   * @default false
   */
  verbose?: boolean;
}

/**
 * Archiver plugin configuration options
 * @description Used to configure compression archiving of build artifacts
 */
interface ArchiverPluginOptions {
  /**
   * Output filename
   * @default 'dist'
   */
  name?: string;
  /**
   * Output directory
   * @default '.'
   */
  outputDir?: string;
}

/**
 * ImportMap plugin configuration
 * @description Used to configure module CDN imports
 */
interface ImportmapPluginOptions {
  /**
   * CDN provider
   * @default 'jspm.io'
   * @description Supports esm.sh and jspm.io CDN providers
   */
  defaultProvider?: 'esm.sh' | 'jspm.io';
  /**
   * ImportMap configuration array
   * @description Configure packages that need to be imported from CDN
   * @example
   * ```typescript
   * [
   *   { name: 'vue' },
   *   { name: 'pinia', range: '^2.0.0' }
   * ]
   * ```
   */
  importmap?: Array<{ name: string; range?: string }>;
  /**
   * Manual ImportMap configuration
   * @description Custom ImportMap configuration
   */
  inputMap?: IImportMap;
}

/**
 * Conditional plugin configuration
 * @description Used to dynamically load plugins based on conditions
 */
interface ConditionPlugin {
  /**
   * Condition to evaluate
   * @description Load plugins when condition is true
   */
  condition?: boolean;
  /**
   * Plugin object
   * @description Returns plugin array or Promise
   */
  plugins: () => PluginOption[] | PromiseLike<PluginOption[]>;
}

/**
 * Common plugin configuration options
 * @description Base configuration shared by all plugins
 */
interface CommonPluginOptions {
  /**
   * Whether to enable development tools
   * @default false
   */
  devtools?: boolean;
  /**
   * Environment variables
   * @description Custom environment variables
   */
  env?: Record<string, any>;
  /**
   * Whether to inject metadata
   * @default true
   */
  injectMetadata?: boolean;
  /**
   * Whether in build mode
   * @default false
   */
  isBuild?: boolean;
  /**
   * Build mode
   * @default 'development'
   */
  mode?: string;
  /**
   * Whether to enable dependency analysis
   * @default false
   * @description Use rollup-plugin-visualizer to analyze dependencies
   */
  visualizer?: boolean | PluginVisualizerOptions;
}

/**
 * Application plugin configuration options
 * @description Used to configure plugin options for application builds
 */
interface ApplicationPluginOptions extends CommonPluginOptions {
  /**
   * Whether to enable compression archiving
   * @default false
   * @description When enabled, will generate zip files in the build directory
   */
  archiver?: boolean;
  /**
   * Compression archiving plugin configuration
   * @description Configure compression archiving behavior
   */
  archiverPluginOptions?: ArchiverPluginOptions;
  /**
   * Whether to enable compression
   * @default false
   * @description Supports gzip and brotli compression
   */
  compress?: boolean;
  /**
   * Compression types
   * @default ['gzip']
   * @description Available compression types
   */
  compressTypes?: ('brotli' | 'gzip')[];
  /**
   * Whether to extract configuration files
   * @default false
   * @description Extract configuration files during build
   */
  extraAppConfig?: boolean;
  /**
   * Whether to enable HTML plugin
   * @default true
   */
  html?: boolean;
  /**
   * Whether to enable internationalization
   * @default false
   */
  i18n?: boolean;
  /**
   * Whether to enable ImportMap CDN
   * @default false
   */
  importmap?: boolean;
  /**
   * ImportMap plugin configuration
   */
  importmapOptions?: ImportmapPluginOptions;
  /**
   * Whether to inject application loading animation
   * @default true
   */
  injectAppLoading?: boolean;
  /**
   * Whether to inject global SCSS
   * @default true
   */
  injectGlobalScss?: boolean;
  /**
   * Whether to inject copyright information
   * @default true
   */
  license?: boolean;
  /**
   * Whether to enable Nitro Mock
   * @default false
   */
  nitroMock?: boolean;
  /**
   * Nitro Mock plugin configuration
   */
  nitroMockOptions?: NitroMockPluginOptions;
  /**
   * Whether to enable console printing
   * @default false
   */
  print?: boolean;
  /**
   * Print plugin configuration
   */
  printInfoMap?: PrintPluginOptions['infoMap'];
  /**
   * Whether to enable PWA
   * @default false
   */
  pwa?: boolean;
  /**
   * PWA plugin configuration
   */
  pwaOptions?: Partial<PwaPluginOptions>;
  /**
   * Whether to enable VXE Table lazy loading
   * @default false
   */
  vxeTableLazyImport?: boolean;
}

/**
 * Library plugin configuration options
 * @description Used to configure plugin options for library builds
 */
interface LibraryPluginOptions extends CommonPluginOptions {
  /**
   * Whether to enable DTS output
   * @default true
   * @description Generate TypeScript type declaration files
   */
  dts?: boolean | PluginOptions;
}

/**
 * Application configuration options type
 */
type ApplicationOptions = ApplicationPluginOptions;

/**
 * Library configuration options type
 */
type LibraryOptions = LibraryPluginOptions;

/**
 * Application configuration definition function type
 * @description Used to define application build configuration
 */
type DefineApplicationOptions = (config?: ConfigEnv) => Promise<{
  /** Application plugin configuration */
  application?: ApplicationOptions;
  /** Vite configuration */
  vite?: UserConfig;
}>;

/**
 * Library configuration definition function type
 * @description Used to define library build configuration
 */
type DefineLibraryOptions = (config?: ConfigEnv) => Promise<{
  /** Library plugin configuration */
  library?: LibraryOptions;
  /** Vite configuration */
  vite?: UserConfig;
}>;

/**
 * Configuration definition type
 * @description Application or library configuration definition
 */
type DefineConfig = DefineApplicationOptions | DefineLibraryOptions;

export type {
  ApplicationPluginOptions,
  ArchiverPluginOptions,
  CommonPluginOptions,
  ConditionPlugin,
  DefineApplicationOptions,
  DefineConfig,
  DefineLibraryOptions,
  IImportMap,
  ImportmapPluginOptions,
  LibraryPluginOptions,
  NitroMockPluginOptions,
  PrintPluginOptions,
};
