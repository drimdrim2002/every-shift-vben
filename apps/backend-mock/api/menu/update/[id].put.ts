import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 메뉴 수정
async function updateMenuWithSupabase(
  event: any,
  userinfo: any,
  menuId: string,
  menuData: any,
) {
  try {
    // @ts-ignore - 동적 import
    const { supabase } = await import('@vben/utils');

    // 현재 사용자 ID 가져오기
    const authHeader = getHeader(event, 'Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return unAuthorizedResponse(event);
    }

    const token = authHeader.split(' ')[1];
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return unAuthorizedResponse(event);
    }

    // 기존 메뉴 존재 확인
    const { data: existingMenu, error: findError } = await supabase
      .from('menus')
      .select('*')
      .eq('id', menuId)
      .single();

    if (findError || !existingMenu) {
      setResponseStatus(event, 404);
      return useResponseError('메뉴를 찾을 수 없습니다.');
    }

    // 메뉴 수정
    const updateData: any = {
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    // 수정할 필드만 추가
    if (menuData.name !== undefined) updateData.name = menuData.name;
    if (menuData.path !== undefined) updateData.path = menuData.path;
    if (menuData.component !== undefined)
      updateData.component = menuData.component;
    if (menuData.type !== undefined) updateData.type = menuData.type;
    if (menuData.status !== undefined) updateData.status = menuData.status;
    if (menuData.authCode !== undefined)
      updateData.auth_code = menuData.authCode;
    if (menuData.sortOrder !== undefined)
      updateData.sort_order = menuData.sortOrder;
    if (menuData.meta !== undefined) updateData.meta = menuData.meta;
    if (menuData.pid !== undefined) updateData.pid = menuData.pid;

    const { data: updatedMenu, error: updateError } = await supabase
      .from('menus')
      .update(updateData)
      .eq('id', menuId)
      .select()
      .single();

    if (updateError) {
      console.error('메뉴 수정 실패:', updateError);
      return useResponseError(
        `메뉴 수정에 실패했습니다: ${updateError.message}`,
      );
    }

    return useResponseSuccess({
      id: updatedMenu.id,
      pid: updatedMenu.pid,
      name: updatedMenu.name,
      path: updatedMenu.path,
      component: updatedMenu.component,
      type: updatedMenu.type,
      status: updatedMenu.status,
      authCode: updatedMenu.auth_code,
      sortOrder: updatedMenu.sort_order,
      meta: updatedMenu.meta,
      createdAt: updatedMenu.created_at,
      updatedAt: updatedMenu.updated_at,
    });
  } catch (error) {
    console.error('Supabase 메뉴 수정 오류:', error);
    return useResponseError('메뉴 수정 중 오류가 발생했습니다.');
  }
}

// Mock 메뉴 수정
function updateMenuWithMock(menuId: string, menuData: any) {
  // Mock에서는 단순히 성공 응답만 반환
  const updatedMenu = {
    id: Number(menuId),
    ...menuData,
    updatedAt: new Date().toISOString(),
  };

  console.log('Mock 메뉴 수정:', updatedMenu);

  return useResponseSuccess(updatedMenu);
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
    return useResponseError('메뉴 수정 권한이 없습니다.');
  }

  // 경로에서 메뉴 ID 추출
  const menuId = getRouterParam(event, 'id');
  if (!menuId) {
    setResponseStatus(event, 400);
    return useResponseError('메뉴 ID가 필요합니다.');
  }

  // 요청 데이터 검증
  const body = await readBody(event);

  if (body.name === '') {
    setResponseStatus(event, 400);
    return useResponseError('메뉴 이름은 비어있을 수 없습니다.');
  }

  if (
    body.type &&
    !['button', 'catalog', 'embedded', 'link', 'menu'].includes(body.type)
  ) {
    setResponseStatus(event, 400);
    return useResponseError('올바른 메뉴 타입을 지정해주세요.');
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase =
    process.env.VITE_USE_SUPABASE === 'true' ||
    process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 메뉴 수정');
    return await updateMenuWithSupabase(event, userinfo, menuId, body);
  } else {
    console.log('🔄 Mock 메뉴 수정');
    return updateMenuWithMock(menuId, body);
  }
});
