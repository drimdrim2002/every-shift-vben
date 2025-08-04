import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 상품 삭제
async function deleteProductWithSupabase(
  event: any,
  userinfo: any,
  productId: string,
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

    // 기존 상품 존재 확인
    const { data: existingProduct, error: findError } = await supabase
      .from('products')
      .select('id, product_name, status')
      .eq('id', productId)
      .single();

    if (findError || !existingProduct) {
      setResponseStatus(event, 404);
      return useResponseError('상품을 찾을 수 없습니다.');
    }

    // 상품 삭제
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      console.error('상품 삭제 실패:', deleteError);
      return useResponseError(
        `상품 삭제에 실패했습니다: ${deleteError.message}`,
      );
    }

    return useResponseSuccess({
      id: productId,
      productName: existingProduct.product_name,
      message: '상품이 성공적으로 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Supabase 상품 삭제 오류:', error);
    return useResponseError('상품 삭제 중 오류가 발생했습니다.');
  }
}

// Mock 상품 삭제
function deleteProductWithMock(productId: string) {
  // Mock에서는 단순히 성공 응답만 반환
  console.log('Mock 상품 삭제:', productId);

  return useResponseSuccess({
    id: productId,
    message: '상품이 성공적으로 삭제되었습니다.',
  });
}

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // super 권한만 상품 삭제 가능
  const userRole = userinfo.roles?.[0] || 'user';
  if (userRole !== 'super') {
    setResponseStatus(event, 403);
    return useResponseError('상품 삭제 권한이 없습니다.');
  }

  // 경로에서 상품 ID 추출
  const productId = getRouterParam(event, 'id');
  if (!productId) {
    setResponseStatus(event, 400);
    return useResponseError('상품 ID가 필요합니다.');
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase =
    process.env.VITE_USE_SUPABASE === 'true' ||
    process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 상품 삭제');
    return await deleteProductWithSupabase(event, userinfo, productId);
  } else {
    console.log('🔄 Mock 상품 삭제');
    return deleteProductWithMock(productId);
  }
});
