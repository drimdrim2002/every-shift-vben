import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 메뉴 순서 변경
async function reorderMenusWithSupabase(event: any, userinfo: any, menuOrders: any[]) {
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

    // 트랜잭션으로 순서 업데이트
    const updatePromises = menuOrders.map(async (item) => {
      const { error } = await supabase
        .from('menus')
        .update({
          sort_order: item.sortOrder,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) {
        throw new Error(`메뉴 ${item.id} 순서 변경 실패: ${error.message}`);
      }

      return item;
    });

    await Promise.all(updatePromises);

    return useResponseSuccess({
      message: '메뉴 순서가 성공적으로 변경되었습니다.',
      updatedMenus: menuOrders,
    });

  } catch (error) {
    console.error('Supabase 메뉴 순서 변경 오류:', error);
    return useResponseError('메뉴 순서 변경 중 오류가 발생했습니다: ' + error.message);
  }
}

// Mock 메뉴 순서 변경
function reorderMenusWithMock(menuOrders: any[]) {
  // Mock에서는 단순히 성공 응답만 반환
  console.log('Mock 메뉴 순서 변경:', menuOrders);

  return useResponseSuccess({
    message: '메뉴 순서가 성공적으로 변경되었습니다.',
    updatedMenus: menuOrders,
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
    return useResponseError('메뉴 순서 변경 권한이 없습니다.');
  }

  // 요청 데이터 검증
  const body = await readBody(event);

  if (!Array.isArray(body.menuOrders) || body.menuOrders.length === 0) {
    setResponseStatus(event, 400);
    return useResponseError('메뉴 순서 데이터가 필요합니다.');
  }

  // 메뉴 순서 데이터 검증
  const menuOrders = body.menuOrders;
  for (const item of menuOrders) {
    if (!item.id || typeof item.sortOrder !== 'number') {
      setResponseStatus(event, 400);
      return useResponseError('올바른 메뉴 순서 데이터 형식이 아닙니다. (id, sortOrder 필요)');
    }
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase = process.env.VITE_USE_SUPABASE === 'true' ||
                     process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 메뉴 순서 변경');
    return await reorderMenusWithSupabase(event, userinfo, menuOrders);
  } else {
    console.log('🔄 Mock 메뉴 순서 변경');
    return reorderMenusWithMock(menuOrders);
  }
});
