import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 메뉴 상태 토글
async function toggleMenuStatusWithSupabase(event: any, userinfo: any, menuId: string) {
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

    // 현재 메뉴 상태 조회
    const { data: currentMenu, error: findError } = await supabase
      .from('menus')
      .select('id, name, status')
      .eq('id', menuId)
      .single();

    if (findError || !currentMenu) {
      setResponseStatus(event, 404);
      return useResponseError('메뉴를 찾을 수 없습니다.');
    }

    // 상태 토글 (0 ↔ 1)
    const newStatus = currentMenu.status === 1 ? 0 : 1;

    // 상태 업데이트
    const { data: updatedMenu, error: updateError } = await supabase
      .from('menus')
      .update({
        status: newStatus,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', menuId)
      .select('id, name, status, updated_at')
      .single();

    if (updateError) {
      console.error('메뉴 상태 변경 실패:', updateError);
      return useResponseError('메뉴 상태 변경에 실패했습니다: ' + updateError.message);
    }

    return useResponseSuccess({
      id: updatedMenu.id,
      name: updatedMenu.name,
      status: updatedMenu.status,
      statusText: updatedMenu.status === 1 ? '활성' : '비활성',
      updatedAt: updatedMenu.updated_at,
      message: `메뉴가 ${updatedMenu.status === 1 ? '활성화' : '비활성화'}되었습니다.`,
    });

  } catch (error) {
    console.error('Supabase 메뉴 상태 토글 오류:', error);
    return useResponseError('메뉴 상태 변경 중 오류가 발생했습니다.');
  }
}

// Mock 메뉴 상태 토글
function toggleMenuStatusWithMock(menuId: string) {
  // Mock 데이터에서 해당 메뉴 찾기
  const menu = MOCK_MENU_LIST.find(item => item.id === Number(menuId));

  if (!menu) {
    setResponseStatus(event, 404);
    return useResponseError('메뉴를 찾을 수 없습니다.');
  }

  // 상태 토글
  const newStatus = menu.status === 1 ? 0 : 1;

  console.log('Mock 메뉴 상태 토글:', { menuId, oldStatus: menu.status, newStatus });

  return useResponseSuccess({
    id: menu.id,
    name: menu.name,
    status: newStatus,
    statusText: newStatus === 1 ? '활성' : '비활성',
    updatedAt: new Date().toISOString(),
    message: `메뉴가 ${newStatus === 1 ? '활성화' : '비활성화'}되었습니다.`,
  });
}

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 관리자 권한 확인
  const userRole = userinfo.roles?.[0] || 'user';
  if (!['super', 'admin'].includes(userRole)) {
    setResponseStatus(event, 403);
    return useResponseError('메뉴 상태 변경 권한이 없습니다.');
  }

  // 경로에서 메뉴 ID 추출
  const menuId = getRouterParam(event, 'id');
  if (!menuId) {
    setResponseStatus(event, 400);
    return useResponseError('메뉴 ID가 필요합니다.');
  }

  // 시스템 기본 메뉴 상태 변경 방지
  const systemMenuIds = ['1', '2']; // Workspace, System
  if (systemMenuIds.includes(menuId)) {
    setResponseStatus(event, 403);
    return useResponseError('시스템 기본 메뉴의 상태는 변경할 수 없습니다.');
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase = process.env.VITE_USE_SUPABASE === 'true' ||
                     process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 메뉴 상태 토글');
    return await toggleMenuStatusWithSupabase(event, userinfo, menuId);
  } else {
    console.log('🔄 Mock 메뉴 상태 토글');
    return toggleMenuStatusWithMock(menuId);
  }
});
