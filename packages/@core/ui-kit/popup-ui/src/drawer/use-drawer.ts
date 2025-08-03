import type {
  DrawerApiOptions,
  DrawerProps,
  ExtendedDrawerApi,
} from './drawer';

import {
  defineComponent,
  h,
  inject,
  nextTick,
  provide,
  reactive,
  ref,
} from 'vue';

import { useStore } from '@vben-core/shared/store';

import { DrawerApi } from './drawer-api';
import VbenDrawer from './drawer.vue';

const USER_DRAWER_INJECT_KEY = Symbol('VBEN_DRAWER_INJECT');

const DEFAULT_DRAWER_PROPS: Partial<DrawerProps> = {};

export function setDefaultDrawerProps(props: Partial<DrawerProps>) {
  Object.assign(DEFAULT_DRAWER_PROPS, props);
}

export function useVbenDrawer<
  TParentDrawerProps extends DrawerProps = DrawerProps,
>(options: DrawerApiOptions = {}) {
  // Drawer is generally extracted, so if connectedComponent is passed in, it represents external call, connecting with internal components
  // External Drawer passes api through provide/inject

  const { connectedComponent } = options;
  if (connectedComponent) {
    const extendedApi = reactive({});
    const isDrawerReady = ref(true);
    const Drawer = defineComponent(
      (props: TParentDrawerProps, { attrs, slots }) => {
        provide(USER_DRAWER_INJECT_KEY, {
          extendApi(api: ExtendedDrawerApi) {
            // Cannot directly assign value to reactive, will lose reactivity
            // Cannot use Object.assign, will lose api prototype functions
            Object.setPrototypeOf(extendedApi, api);
          },
          options,
          async reCreateDrawer() {
            isDrawerReady.value = false;
            await nextTick();
            isDrawerReady.value = true;
          },
        });
        checkProps(extendedApi as ExtendedDrawerApi, {
          ...props,
          ...attrs,
          ...slots,
        });
        return () =>
          h(
            isDrawerReady.value ? connectedComponent : 'div',
            { ...props, ...attrs },
            slots,
          );
      },
      // eslint-disable-next-line vue/one-component-per-file
      {
        name: 'VbenParentDrawer',
        inheritAttrs: false,
      },
    );

    return [Drawer, extendedApi as ExtendedDrawerApi] as const;
  }

  const injectData = inject<any>(USER_DRAWER_INJECT_KEY, {});

  const mergedOptions = {
    ...DEFAULT_DRAWER_PROPS,
    ...injectData.options,
    ...options,
  } as DrawerApiOptions;

  mergedOptions.onOpenChange = (isOpen: boolean) => {
    options.onOpenChange?.(isOpen);
    injectData.options?.onOpenChange?.(isOpen);
  };

  const onClosed = mergedOptions.onClosed;
  mergedOptions.onClosed = () => {
    onClosed?.();
    if (mergedOptions.destroyOnClose) {
      injectData.reCreateDrawer?.();
    }
  };
  const api = new DrawerApi(mergedOptions);

  const extendedApi: ExtendedDrawerApi = api as never;

  extendedApi.useStore = (selector) => {
    return useStore(api.store, selector);
  };

  const Drawer = defineComponent(
    (props: DrawerProps, { attrs, slots }) => {
      return () =>
        h(VbenDrawer, { ...props, ...attrs, drawerApi: extendedApi }, slots);
    },
    // eslint-disable-next-line vue/one-component-per-file
    {
      name: 'VbenDrawer',
      inheritAttrs: false,
    },
  );
  injectData.extendApi?.(extendedApi);
  return [Drawer, extendedApi] as const;
}

async function checkProps(api: ExtendedDrawerApi, attrs: Record<string, any>) {
  if (!attrs || Object.keys(attrs).length === 0) {
    return;
  }
  await nextTick();

  const state = api?.store?.state;

  if (!state) {
    return;
  }

  const stateKeys = new Set(Object.keys(state));

  for (const attr of Object.keys(attrs)) {
    if (stateKeys.has(attr) && !['class'].includes(attr)) {
      // When connectedComponent exists, do not pass in Drawer props, which will increase complexity. If you need to modify Drawer props, please use useVbenDrawer or api
      console.warn(
        `[Vben Drawer]: When 'connectedComponent' exists, do not set props or slots '${attr}', which will increase complexity. If you need to modify the props of Drawer, please use useVbenDrawer or api.`,
      );
    }
  }
}
