import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description Project configuration file
 * Only need to override part of the configuration in the project, configurations that are not needed do not need to be overridden, default configuration will be used automatically
 * !!! Please clear cache after changing configuration, otherwise it may not take effect
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    name: import.meta.env.VITE_APP_TITLE,
  },
});
