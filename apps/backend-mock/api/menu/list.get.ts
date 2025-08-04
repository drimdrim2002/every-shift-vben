import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 메뉴 관리 목록 조회
async function getMenuListWithSupabase(event: any, _userinfo: any) {
  try {
    // @ts-ignore - 동적 import
    const { supabase } = await import('@vben/utils');

    // 쿼리 파라미터 추출
    const query = getQuery(event);
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const search = (query.search as string) || '';
    const type = (query.type as string) || '';
    const status =
      query.status === undefined ? undefined : Number(query.status);

    // 검색 조건 구성
    let menuQuery = supabase.from('menus').select('*', { count: 'exact' });

    // 검색 필터
    if (search) {
      menuQuery = menuQuery.or(
        `name.ilike.%${search}%,path.ilike.%${search}%,meta->>title.ilike.%${search}%`,
      );
    }

    // 타입 필터
    if (type) {
      menuQuery = menuQuery.eq('type', type);
    }

    // 상태 필터
    if (status !== undefined) {
      menuQuery = menuQuery.eq('status', status);
    }

    // 정렬 및 페이징
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    menuQuery = menuQuery
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to);

    const { data: menus, error: menuError, count } = await menuQuery;

    if (menuError) {
      console.error('메뉴 목록 조회 실패:', menuError);
      return useResponseError('메뉴 목록 조회에 실패했습니다.');
    }

    // 응답 데이터 포맷팅
    const formattedMenus = (menus || []).map((menu) => ({
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
    }));

    return usePageResponseSuccess(page, pageSize, formattedMenus, {
      message: 'ok',
      total: count || 0,
    });
  } catch (error) {
    console.error('Supabase 메뉴 목록 조회 오류:', error);
    return useResponseError('메뉴 목록 조회 중 오류가 발생했습니다.');
  }
}

// Mock 메뉴 관리 목록 조회
function getMenuListWithMock(event: any) {
  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;

  // Mock 데이터 사용
  let menuList = [...MOCK_MENU_LIST];

  // 검색 필터링
  if (query.search) {
    const search = (query.search as string).toLowerCase();
    menuList = menuList.filter(
      (menu) =>
        menu.name.toLowerCase().includes(search) ||
        (menu.path && menu.path.toLowerCase().includes(search)) ||
        (menu.meta?.title && menu.meta.title.toLowerCase().includes(search)),
    );
  }

  // 타입 필터링
  if (query.type) {
    menuList = menuList.filter((menu) => menu.type === query.type);
  }

  // 상태 필터링
  if (query.status !== undefined) {
    menuList = menuList.filter((menu) => menu.status === Number(query.status));
  }

  return usePageResponseSuccess(page, pageSize, menuList);
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
    return useResponseError('메뉴 관리 권한이 없습니다.');
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase =
    process.env.VITE_USE_SUPABASE === 'true' ||
    process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 메뉴 관리 목록 조회');
    return await getMenuListWithSupabase(event, userinfo);
  } else {
    console.log('🔄 Mock 메뉴 관리 목록 조회');
    return getMenuListWithMock(event);
  }
});
