import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 메뉴 상세 조회
async function getMenuDetailWithSupabase(
  event: any,
  userinfo: any,
  menuId: string,
) {
  try {
    // @ts-ignore - 동적 import
    const { supabase } = await import('@vben/utils');

    // 메뉴 상세 정보 조회
    const { data: menu, error: menuError } = await supabase
      .from('menus')
      .select(
        `
        *,
        parent:menus!menus_pid_fkey(id, name),
        children:menus!menus_pid_fkey(id, name, type, status, sort_order)
      `,
      )
      .eq('id', menuId)
      .single();

    if (menuError || !menu) {
      setResponseStatus(event, 404);
      return useResponseError('메뉴를 찾을 수 없습니다.');
    }

    // 응답 데이터 포맷팅
    const formattedMenu = {
      id: menu.id,
      pid: menu.pid,
      name: menu.name,
      path: menu.path,
      component: menu.component,
      type: menu.type,
      status: menu.status,
      authCode: menu.auth_code,
      sortOrder: menu.sort_order,
      meta: menu.meta,
      createdAt: menu.created_at,
      updatedAt: menu.updated_at,
      parent: menu.parent,
      children: (menu.children || [])
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
        .map((child: any) => ({
          id: child.id,
          name: child.name,
          type: child.type,
          status: child.status,
          sortOrder: child.sort_order,
        })),
    };

    return useResponseSuccess(formattedMenu);
  } catch (error) {
    console.error('Supabase 메뉴 상세 조회 오류:', error);
    return useResponseError('메뉴 상세 조회 중 오류가 발생했습니다.');
  }
}

// Mock 메뉴 상세 조회
function getMenuDetailWithMock(menuId: string) {
  // Mock 데이터에서 해당 메뉴 찾기
  const menu = MOCK_MENU_LIST.find((item) => item.id === Number(menuId));

  if (!menu) {
    setResponseStatus(event, 404);
    return useResponseError('메뉴를 찾을 수 없습니다.');
  }

  // 부모 메뉴 찾기
  const parent = menu.pid
    ? MOCK_MENU_LIST.find((item) => item.id === menu.pid)
    : null;

  // 자식 메뉴들 찾기
  const children = MOCK_MENU_LIST.filter((item) => item.pid === menu.id)
    .sort((a, b) => (a.meta?.order || 0) - (b.meta?.order || 0))
    .map((child) => ({
      id: child.id,
      name: child.name,
      type: child.type,
      status: child.status,
      sortOrder: child.meta?.order || 0,
    }));

  const formattedMenu = {
    id: menu.id,
    pid: menu.pid,
    name: menu.name,
    path: menu.path,
    component: menu.component,
    type: menu.type,
    status: menu.status,
    authCode: menu.authCode,
    sortOrder: menu.meta?.order || 0,
    meta: menu.meta,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parent: parent ? { id: parent.id, name: parent.name } : null,
    children,
  };

  return useResponseSuccess(formattedMenu);
}

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 관리자 권한 확인
  const userRole = userinfo.roles?.[0] || 'user';
  if (!['admin', 'super'].includes(userRole)) {
    setResponseStatus(event, 403);
    return useResponseError('메뉴 조회 권한이 없습니다.');
  }

  // 경로에서 메뉴 ID 추출
  const menuId = getRouterParam(event, 'id');
  if (!menuId) {
    setResponseStatus(event, 400);
    return useResponseError('메뉴 ID가 필요합니다.');
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase =
    process.env.VITE_USE_SUPABASE === 'true' ||
    process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 메뉴 상세 조회');
    return await getMenuDetailWithSupabase(event, userinfo, menuId);
  } else {
    console.log('🔄 Mock 메뉴 상세 조회');
    return getMenuDetailWithMock(menuId);
  }
});
