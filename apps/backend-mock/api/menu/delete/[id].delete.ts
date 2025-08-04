import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 메뉴 삭제
async function deleteMenuWithSupabase(
  event: any,
  userinfo: any,
  menuId: string,
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
      .select('id, name, type')
      .eq('id', menuId)
      .single();

    if (findError || !existingMenu) {
      setResponseStatus(event, 404);
      return useResponseError('메뉴를 찾을 수 없습니다.');
    }

    // 하위 메뉴 확인
    const { data: childMenus, error: childError } = await supabase
      .from('menus')
      .select('id')
      .eq('pid', menuId);

    if (childError) {
      console.error('하위 메뉴 확인 실패:', childError);
      return useResponseError('하위 메뉴 확인 중 오류가 발생했습니다.');
    }

    if (childMenus && childMenus.length > 0) {
      setResponseStatus(event, 409);
      return useResponseError(
        '하위 메뉴가 있는 메뉴는 삭제할 수 없습니다. 먼저 하위 메뉴를 삭제해주세요.',
      );
    }

    // 메뉴와 관련된 권한 데이터도 함께 삭제됨 (CASCADE)
    const { error: deleteError } = await supabase
      .from('menus')
      .delete()
      .eq('id', menuId);

    if (deleteError) {
      console.error('메뉴 삭제 실패:', deleteError);
      return useResponseError(
        `메뉴 삭제에 실패했습니다: ${deleteError.message}`,
      );
    }

    return useResponseSuccess({
      id: menuId,
      name: existingMenu.name,
      message: '메뉴가 성공적으로 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Supabase 메뉴 삭제 오류:', error);
    return useResponseError('메뉴 삭제 중 오류가 발생했습니다.');
  }
}

// Mock 메뉴 삭제
function deleteMenuWithMock(menuId: string) {
  // Mock에서는 단순히 성공 응답만 반환
  console.log('Mock 메뉴 삭제:', menuId);

  return useResponseSuccess({
    id: menuId,
    message: '메뉴가 성공적으로 삭제되었습니다.',
  });
}

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // super 권한만 메뉴 삭제 가능
  const userRole = userinfo.roles?.[0] || 'user';
  if (userRole !== 'super') {
    setResponseStatus(event, 403);
    return useResponseError('메뉴 삭제 권한이 없습니다.');
  }

  // 경로에서 메뉴 ID 추출
  const menuId = getRouterParam(event, 'id');
  if (!menuId) {
    setResponseStatus(event, 400);
    return useResponseError('메뉴 ID가 필요합니다.');
  }

  // 시스템 기본 메뉴 삭제 방지
  const systemMenuIds = ['1', '2', '9', '10']; // Workspace, System, Project, About
  if (systemMenuIds.includes(menuId)) {
    setResponseStatus(event, 403);
    return useResponseError('시스템 기본 메뉴는 삭제할 수 없습니다.');
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase =
    process.env.VITE_USE_SUPABASE === 'true' ||
    process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 메뉴 삭제');
    return await deleteMenuWithSupabase(event, userinfo, menuId);
  } else {
    console.log('🔄 Mock 메뉴 삭제');
    return deleteMenuWithMock(menuId);
  }
});
