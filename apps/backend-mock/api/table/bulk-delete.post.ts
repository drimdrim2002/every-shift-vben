import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 상품 일괄 삭제
async function bulkDeleteProductsWithSupabase(
  event: any,
  userinfo: any,
  productIds: string[],
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

    // 삭제할 상품들 확인
    const { data: existingProducts, error: findError } = await supabase
      .from('products')
      .select('id, product_name')
      .in('id', productIds);

    if (findError) {
      console.error('상품 조회 실패:', findError);
      return useResponseError('상품 조회 중 오류가 발생했습니다.');
    }

    if (!existingProducts || existingProducts.length === 0) {
      setResponseStatus(event, 404);
      return useResponseError('삭제할 상품을 찾을 수 없습니다.');
    }

    // 일괄 삭제 실행
    const { data: deletedProducts, error: deleteError } = await supabase
      .from('products')
      .delete()
      .in('id', productIds)
      .select('id, product_name');

    if (deleteError) {
      console.error('상품 일괄 삭제 실패:', deleteError);
      return useResponseError(
        `상품 일괄 삭제에 실패했습니다: ${deleteError.message}`,
      );
    }

    return useResponseSuccess({
      deletedCount: deletedProducts?.length || 0,
      deletedProducts:
        deletedProducts?.map((p) => ({
          id: p.id,
          productName: p.product_name,
        })) || [],
      message: `${deletedProducts?.length || 0}개 상품이 성공적으로 삭제되었습니다.`,
    });
  } catch (error) {
    console.error('Supabase 상품 일괄 삭제 오류:', error);
    return useResponseError('상품 일괄 삭제 중 오류가 발생했습니다.');
  }
}

// Mock 상품 일괄 삭제
function bulkDeleteProductsWithMock(productIds: string[]) {
  // Mock에서는 단순히 성공 응답만 반환
  console.log('Mock 상품 일괄 삭제:', productIds);

  return useResponseSuccess({
    deletedCount: productIds.length,
    deletedProducts: productIds.map((id) => ({
      id,
      productName: `Mock Product ${id}`,
    })),
    message: `${productIds.length}개 상품이 성공적으로 삭제되었습니다.`,
  });
}

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // super 권한만 상품 일괄 삭제 가능
  const userRole = userinfo.roles?.[0] || 'user';
  if (userRole !== 'super') {
    setResponseStatus(event, 403);
    return useResponseError('상품 일괄 삭제 권한이 없습니다.');
  }

  // 요청 데이터 검증
  const body = await readBody(event);

  if (!Array.isArray(body.productIds) || body.productIds.length === 0) {
    setResponseStatus(event, 400);
    return useResponseError('삭제할 상품 ID 목록이 필요합니다.');
  }

  const productIds = body.productIds;

  // ID 유효성 검증
  for (const id of productIds) {
    if (!id || typeof id !== 'string') {
      setResponseStatus(event, 400);
      return useResponseError('올바른 상품 ID 형식이 아닙니다.');
    }
  }

  // 최대 삭제 개수 제한
  if (productIds.length > 100) {
    setResponseStatus(event, 400);
    return useResponseError(
      '한 번에 최대 100개 상품까지만 삭제할 수 있습니다.',
    );
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase =
    process.env.VITE_USE_SUPABASE === 'true' ||
    process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 상품 일괄 삭제');
    return await bulkDeleteProductsWithSupabase(event, userinfo, productIds);
  } else {
    console.log('🔄 Mock 상품 일괄 삭제');
    return bulkDeleteProductsWithMock(productIds);
  }
});
