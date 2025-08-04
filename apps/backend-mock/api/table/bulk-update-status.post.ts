import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 상품 상태 일괄 업데이트
async function bulkUpdateStatusWithSupabase(event: any, userinfo: any, productIds: string[], status: string) {
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

    // 업데이트할 상품들 확인
    const { data: existingProducts, error: findError } = await supabase
      .from('products')
      .select('id, product_name, status')
      .in('id', productIds);

    if (findError) {
      console.error('상품 조회 실패:', findError);
      return useResponseError('상품 조회 중 오류가 발생했습니다.');
    }

    if (!existingProducts || existingProducts.length === 0) {
      setResponseStatus(event, 404);
      return useResponseError('업데이트할 상품을 찾을 수 없습니다.');
    }

    // 상태 일괄 업데이트 실행
    const { data: updatedProducts, error: updateError } = await supabase
      .from('products')
      .update({
        status: status,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .in('id', productIds)
      .select('id, product_name, status');

    if (updateError) {
      console.error('상품 상태 일괄 업데이트 실패:', updateError);
      return useResponseError('상품 상태 일괄 업데이트에 실패했습니다: ' + updateError.message);
    }

    return useResponseSuccess({
      updatedCount: updatedProducts?.length || 0,
      updatedProducts: updatedProducts?.map(p => ({
        id: p.id,
        productName: p.product_name,
        status: p.status
      })) || [],
      newStatus: status,
      message: `${updatedProducts?.length || 0}개 상품의 상태가 "${status}"로 변경되었습니다.`,
    });

  } catch (error) {
    console.error('Supabase 상품 상태 일괄 업데이트 오류:', error);
    return useResponseError('상품 상태 일괄 업데이트 중 오류가 발생했습니다.');
  }
}

// Mock 상품 상태 일괄 업데이트
function bulkUpdateStatusWithMock(productIds: string[], status: string) {
  // Mock에서는 단순히 성공 응답만 반환
  console.log('Mock 상품 상태 일괄 업데이트:', { productIds, status });

  return useResponseSuccess({
    updatedCount: productIds.length,
    updatedProducts: productIds.map(id => ({
      id,
      productName: `Mock Product ${id}`,
      status
    })),
    newStatus: status,
    message: `${productIds.length}개 상품의 상태가 "${status}"로 변경되었습니다.`,
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
    return useResponseError('상품 상태 변경 권한이 없습니다.');
  }

  // 요청 데이터 검증
  const body = await readBody(event);

  if (!Array.isArray(body.productIds) || body.productIds.length === 0) {
    setResponseStatus(event, 400);
    return useResponseError('업데이트할 상품 ID 목록이 필요합니다.');
  }

  if (!body.status || !['success', 'error', 'warning'].includes(body.status)) {
    setResponseStatus(event, 400);
    return useResponseError('올바른 상태 값을 지정해주세요. (success, error, warning)');
  }

  const productIds = body.productIds;
  const status = body.status;

  // ID 유효성 검증
  for (const id of productIds) {
    if (!id || typeof id !== 'string') {
      setResponseStatus(event, 400);
      return useResponseError('올바른 상품 ID 형식이 아닙니다.');
    }
  }

  // 최대 업데이트 개수 제한
  if (productIds.length > 100) {
    setResponseStatus(event, 400);
    return useResponseError('한 번에 최대 100개 상품까지만 업데이트할 수 있습니다.');
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase = process.env.VITE_USE_SUPABASE === 'true' ||
                     process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 상품 상태 일괄 업데이트');
    return await bulkUpdateStatusWithSupabase(event, userinfo, productIds, status);
  } else {
    console.log('🔄 Mock 상품 상태 일괄 업데이트');
    return bulkUpdateStatusWithMock(productIds, status);
  }
});
