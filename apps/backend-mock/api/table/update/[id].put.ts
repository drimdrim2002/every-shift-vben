import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 상품 수정
async function updateProductWithSupabase(
  event: any,
  userinfo: any,
  productId: string,
  productData: any,
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
      .select('*')
      .eq('id', productId)
      .single();

    if (findError || !existingProduct) {
      setResponseStatus(event, 404);
      return useResponseError('상품을 찾을 수 없습니다.');
    }

    // 상품 수정
    const updateData: any = {
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    // 수정할 필드만 추가
    if (productData.productName !== undefined)
      updateData.product_name = productData.productName;
    if (productData.description !== undefined)
      updateData.description = productData.description;
    if (productData.category !== undefined)
      updateData.category = productData.category;
    if (productData.price !== undefined) updateData.price = productData.price;
    if (productData.currency !== undefined)
      updateData.currency = productData.currency;
    if (productData.quantity !== undefined)
      updateData.quantity = productData.quantity;
    if (productData.status !== undefined)
      updateData.status = productData.status;
    if (productData.available !== undefined)
      updateData.available = productData.available;
    if (productData.inProduction !== undefined)
      updateData.in_production = productData.inProduction;
    if (productData.open !== undefined) updateData.open = productData.open;
    if (productData.imageUrl !== undefined)
      updateData.image_url = productData.imageUrl;
    if (productData.imageUrl2 !== undefined)
      updateData.image_url2 = productData.imageUrl2;
    if (productData.weight !== undefined)
      updateData.weight = productData.weight;
    if (productData.color !== undefined) updateData.color = productData.color;
    if (productData.rating !== undefined)
      updateData.rating = productData.rating;
    if (productData.tags !== undefined) updateData.tags = productData.tags;
    if (productData.releaseDate !== undefined)
      updateData.release_date = productData.releaseDate;

    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (updateError) {
      console.error('상품 수정 실패:', updateError);
      return useResponseError(
        `상품 수정에 실패했습니다: ${updateError.message}`,
      );
    }

    // 응답 데이터 포맷팅 (기존 mock 형식과 호환)
    return useResponseSuccess({
      id: updatedProduct.id,
      imageUrl: updatedProduct.image_url,
      imageUrl2: updatedProduct.image_url2,
      open: updatedProduct.open,
      status: updatedProduct.status,
      productName: updatedProduct.product_name,
      price: updatedProduct.price.toString(),
      currency: updatedProduct.currency,
      quantity: updatedProduct.quantity,
      available: updatedProduct.available,
      category: updatedProduct.category,
      releaseDate: updatedProduct.release_date,
      rating: updatedProduct.rating,
      description: updatedProduct.description,
      weight: updatedProduct.weight,
      color: updatedProduct.color,
      inProduction: updatedProduct.in_production,
      tags: updatedProduct.tags || [],
      createdAt: updatedProduct.created_at,
      updatedAt: updatedProduct.updated_at,
    });
  } catch (error) {
    console.error('Supabase 상품 수정 오류:', error);
    return useResponseError('상품 수정 중 오류가 발생했습니다.');
  }
}

// Mock 상품 수정
function updateProductWithMock(productId: string, productData: any) {
  // Mock에서는 단순히 성공 응답만 반환
  const updatedProduct = {
    id: productId,
    ...productData,
    updatedAt: new Date().toISOString(),
  };

  console.log('Mock 상품 수정:', updatedProduct);

  return useResponseSuccess(updatedProduct);
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
    return useResponseError('상품 수정 권한이 없습니다.');
  }

  // 경로에서 상품 ID 추출
  const productId = getRouterParam(event, 'id');
  if (!productId) {
    setResponseStatus(event, 400);
    return useResponseError('상품 ID가 필요합니다.');
  }

  // 요청 데이터 검증
  const body = await readBody(event);

  if (body.productName === '') {
    setResponseStatus(event, 400);
    return useResponseError('상품명은 비어있을 수 없습니다.');
  }

  if (
    body.price !== undefined &&
    (Number.isNaN(Number(body.price)) || Number(body.price) < 0)
  ) {
    setResponseStatus(event, 400);
    return useResponseError('올바른 가격을 입력해주세요.');
  }

  if (body.status && !['error', 'success', 'warning'].includes(body.status)) {
    setResponseStatus(event, 400);
    return useResponseError('올바른 상태를 지정해주세요.');
  }

  if (
    body.rating !== undefined &&
    (Number.isNaN(Number(body.rating)) ||
      Number(body.rating) < 0 ||
      Number(body.rating) > 5)
  ) {
    setResponseStatus(event, 400);
    return useResponseError('평점은 0~5 사이의 값이어야 합니다.');
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase =
    process.env.VITE_USE_SUPABASE === 'true' ||
    process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 상품 수정');
    return await updateProductWithSupabase(event, userinfo, productId, body);
  } else {
    console.log('🔄 Mock 상품 수정');
    return updateProductWithMock(productId, body);
  }
});
