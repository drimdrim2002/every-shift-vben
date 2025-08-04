import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 메뉴 조회 로직
async function getMenusWithSupabase(event: any, userinfo: any) {
  try {
    // @ts-ignore - 동적 import
    const { supabase } = await import('@vben/utils');

    // Supabase Auth 토큰으로 사용자 정보 확인
    const authHeader = getHeader(event, 'Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (!userError && user) {
        // Supabase 사용자의 메뉴 조회
        const { data: menuTree, error: menuError } = await supabase
          .rpc('get_menu_tree', { target_user_id: user.id });

        if (menuError) {
          console.warn('메뉴 조회 실패, 기본 메뉴 제공:', menuError);
          return getDefaultMenus(userinfo);
        }

        // 메뉴 트리를 Vue Router 형식으로 변환
        const formattedMenus = formatMenusForVueRouter(menuTree || []);
        return useResponseSuccess(formattedMenus);
      }
    }

    // Supabase 사용자가 아닌 경우 기본 메뉴 제공
    return getDefaultMenus(userinfo);

  } catch (error) {
    console.error('Supabase 메뉴 조회 오류:', error);
    return getDefaultMenus(userinfo);
  }
}

// Mock 메뉴 조회 로직 (기존)
function getMenusWithMock(userinfo: any) {
  const menus =
    MOCK_MENUS.find((item) => item.username === userinfo.username)?.menus ?? [];
  return useResponseSuccess(menus);
}

// 기본 메뉴 제공 함수
function getDefaultMenus(userinfo: any) {
  // 사용자 역할에 따른 기본 메뉴
  const userRole = userinfo.roles?.[0] || 'user';

  const dashboardMenu = {
    meta: {
      order: -1,
      title: 'page.dashboard.title',
    },
    name: 'Dashboard',
    path: '/dashboard',
    redirect: '/analytics',
    children: [
      {
        name: 'Analytics',
        path: '/analytics',
        component: '/dashboard/analytics/index',
        meta: {
          affixTab: true,
          title: 'page.dashboard.analytics',
        },
      },
      {
        name: 'Workspace',
        path: '/workspace',
        component: '/dashboard/workspace/index',
        meta: {
          title: 'page.dashboard.workspace',
        },
      },
    ],
  };

  let menus = [dashboardMenu];

  // 역할별 추가 메뉴
  if (userRole === 'super' || userRole === 'admin') {
    menus.push({
      meta: {
        order: 9997,
        title: 'system.title',
        icon: 'carbon:settings',
      },
      name: 'System',
      path: '/system',
      children: [
        {
          name: 'SystemMenu',
          path: '/system/menu',
          component: '/system/menu/list',
          meta: {
            icon: 'carbon:menu',
            title: 'system.menu.title',
          },
        },
      ],
    });
  }

  return useResponseSuccess(menus);
}

// Supabase 메뉴 데이터를 Vue Router 형식으로 변환
function formatMenusForVueRouter(menuData: any[]): any[] {
  const menuMap = new Map();
  const rootMenus: any[] = [];

  // 1단계: 모든 메뉴를 맵에 저장
  menuData.forEach(item => {
    const formattedItem = {
      id: item.id,
      name: item.name,
      path: item.path,
      component: item.component,
      meta: {
        ...item.meta,
        order: item.sortOrder || 0,
      },
      children: [],
    };

    // redirect 처리
    if (item.type === 'catalog' && !item.component) {
      // 첫 번째 자식의 path를 redirect로 설정 (나중에 처리)
      formattedItem.redirect = '';
    }

    menuMap.set(item.id, formattedItem);
  });

  // 2단계: 부모-자식 관계 설정
  menuData.forEach(item => {
    const currentMenu = menuMap.get(item.id);

    if (item.pid && menuMap.has(item.pid)) {
      // 부모가 있는 경우
      const parentMenu = menuMap.get(item.pid);
      parentMenu.children.push(currentMenu);

      // catalog의 redirect 설정
      if (parentMenu.redirect === '' && item.type === 'menu') {
        parentMenu.redirect = item.path;
      }
    } else {
      // 루트 메뉴
      rootMenus.push(currentMenu);
    }
  });

  // 3단계: 정렬
  const sortMenus = (menus: any[]) => {
    menus.sort((a, b) => (a.meta.order || 0) - (b.meta.order || 0));
    menus.forEach(menu => {
      if (menu.children && menu.children.length > 0) {
        sortMenus(menu.children);
      }
    });
  };

  sortMenus(rootMenus);
  return rootMenus;
}

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase = process.env.VITE_USE_SUPABASE === 'true' ||
                     process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 메뉴 조회');
    return await getMenusWithSupabase(event, userinfo);
  } else {
    console.log('🔄 Mock 메뉴 조회');
    return getMenusWithMock(userinfo);
  }
});
