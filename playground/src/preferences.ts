import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description Project configuration file
 * Only need to override part of the project configuration, unnecessary configurations don't need to be overridden, default configurations will be used automatically
 * !!! Please clear cache after changing configuration, otherwise it may not take effect
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    name: import.meta.env.VITE_APP_TITLE,
  },
});
