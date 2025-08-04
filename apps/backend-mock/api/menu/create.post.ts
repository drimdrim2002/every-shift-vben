import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 메뉴 생성
async function createMenuWithSupabase(event: any, userinfo: any, menuData: any) {
  try {
    // @ts-ignore - 동적 import
    const { supabase } = await import('@vben/utils');

    // 현재 사용자 ID 가져오기
    const authHeader = getHeader(event, 'Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return unAuthorizedResponse(event);
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return unAuthorizedResponse(event);
    }

    // 메뉴 데이터 삽입
    const { data: newMenu, error: insertError } = await supabase
      .from('menus')
      .insert({
        id: menuData.id,
        pid: menuData.pid || null,
        name: menuData.name,
        path: menuData.path || null,
        component: menuData.component || null,
        type: menuData.type || 'menu',
        status: menuData.status ?? 1,
        auth_code: menuData.authCode || null,
        sort_order: menuData.sortOrder ?? 0,
        meta: menuData.meta || {},
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('메뉴 생성 실패:', insertError);
      return useResponseError('메뉴 생성에 실패했습니다: ' + insertError.message);
    }

    return useResponseSuccess({
      id: newMenu.id,
      pid: newMenu.pid,
      name: newMenu.name,
      path: newMenu.path,
      component: newMenu.component,
      type: newMenu.type,
      status: newMenu.status,
      authCode: newMenu.auth_code,
      sortOrder: newMenu.sort_order,
      meta: newMenu.meta,
      createdAt: newMenu.created_at,
      updatedAt: newMenu.updated_at,
    });

  } catch (error) {
    console.error('Supabase 메뉴 생성 오류:', error);
    return useResponseError('메뉴 생성 중 오류가 발생했습니다.');
  }
}

// Mock 메뉴 생성
function createMenuWithMock(menuData: any) {
  // Mock에서는 단순히 성공 응답만 반환
  const newMenu = {
    id: menuData.id || Date.now(),
    pid: menuData.pid || null,
    name: menuData.name,
    path: menuData.path || null,
    component: menuData.component || null,
    type: menuData.type || 'menu',
    status: menuData.status ?? 1,
    authCode: menuData.authCode || null,
    sortOrder: menuData.sortOrder ?? 0,
    meta: menuData.meta || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 실제로는 MOCK_MENU_LIST에 추가해야 하지만, 메모리 기반이므로 재시작 시 사라짐
  console.log('Mock 메뉴 생성:', newMenu);

  return useResponseSuccess(newMenu);
}

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // super 권한만 메뉴 생성 가능
  const userRole = userinfo.roles?.[0] || 'user';
  if (userRole !== 'super') {
    setResponseStatus(event, 403);
    return useResponseError('메뉴 생성 권한이 없습니다.');
  }

  // 요청 데이터 검증
  const body = await readBody(event);

  if (!body.name) {
    setResponseStatus(event, 400);
    return useResponseError('메뉴 이름은 필수입니다.');
  }

  if (!body.type || !['menu', 'catalog', 'button', 'embedded', 'link'].includes(body.type)) {
    setResponseStatus(event, 400);
    return useResponseError('올바른 메뉴 타입을 지정해주세요.');
  }

  // ID 중복 확인 (Supabase에서만)
  const useSupabase = process.env.VITE_USE_SUPABASE === 'true' ||
                     process.env.USE_SUPABASE === 'true';

  if (useSupabase && body.id) {
    try {
      // @ts-ignore - 동적 import
      const { supabase } = await import('@vben/utils');

      const { data: existingMenu } = await supabase
        .from('menus')
        .select('id')
        .eq('id', body.id)
        .single();

      if (existingMenu) {
        setResponseStatus(event, 409);
        return useResponseError('동일한 ID의 메뉴가 이미 존재합니다.');
      }
    } catch (error) {
      // 조회 오류는 무시 (메뉴가 없다는 의미)
    }
  }

  if (useSupabase) {
    console.log('🔄 Supabase 메뉴 생성');
    return await createMenuWithSupabase(event, userinfo, body);
  } else {
    console.log('🔄 Mock 메뉴 생성');
    return createMenuWithMock(body);
  }
});
