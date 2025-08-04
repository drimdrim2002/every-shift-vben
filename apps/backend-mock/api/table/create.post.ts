import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 상품 생성
async function createProductWithSupabase(
  event: any,
  userinfo: any,
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

    // 상품 데이터 삽입
    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert({
        product_name: productData.productName,
        description: productData.description,
        category: productData.category,
        price: productData.price,
        currency: productData.currency || 'USD',
        quantity: productData.quantity || 0,
        status: productData.status || 'success',
        available: productData.available ?? true,
        in_production: productData.inProduction ?? true,
        open: productData.open ?? true,
        image_url: productData.imageUrl,
        image_url2: productData.imageUrl2,
        weight: productData.weight,
        color: productData.color,
        rating: productData.rating,
        tags: productData.tags || [],
        release_date: productData.releaseDate,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('상품 생성 실패:', insertError);
      return useResponseError(
        `상품 생성에 실패했습니다: ${insertError.message}`,
      );
    }

    // 응답 데이터 포맷팅 (기존 mock 형식과 호환)
    return useResponseSuccess({
      id: newProduct.id,
      imageUrl: newProduct.image_url,
      imageUrl2: newProduct.image_url2,
      open: newProduct.open,
      status: newProduct.status,
      productName: newProduct.product_name,
      price: newProduct.price.toString(),
      currency: newProduct.currency,
      quantity: newProduct.quantity,
      available: newProduct.available,
      category: newProduct.category,
      releaseDate: newProduct.release_date,
      rating: newProduct.rating,
      description: newProduct.description,
      weight: newProduct.weight,
      color: newProduct.color,
      inProduction: newProduct.in_production,
      tags: newProduct.tags || [],
      createdAt: newProduct.created_at,
      updatedAt: newProduct.updated_at,
    });
  } catch (error) {
    console.error('Supabase 상품 생성 오류:', error);
    return useResponseError('상품 생성 중 오류가 발생했습니다.');
  }
}

// Mock 상품 생성
function createProductWithMock(productData: any) {
  // Mock에서는 단순히 성공 응답만 반환
  const newProduct = {
    id: Date.now().toString(),
    imageUrl:
      productData.imageUrl ||
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300',
    imageUrl2:
      productData.imageUrl2 ||
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
    open: productData.open ?? true,
    status: productData.status || 'success',
    productName: productData.productName,
    price: productData.price?.toString() || '0.00',
    currency: productData.currency || 'USD',
    quantity: productData.quantity || 0,
    available: productData.available ?? true,
    category: productData.category,
    releaseDate:
      productData.releaseDate || new Date().toISOString().split('T')[0],
    rating: productData.rating || 0,
    description: productData.description,
    weight: productData.weight || 0,
    color: productData.color,
    inProduction: productData.inProduction ?? true,
    tags: productData.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log('Mock 상품 생성:', newProduct);

  return useResponseSuccess(newProduct);
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
    return useResponseError('상품 생성 권한이 없습니다.');
  }

  // 요청 데이터 검증
  const body = await readBody(event);

  if (!body.productName) {
    setResponseStatus(event, 400);
    return useResponseError('상품명은 필수입니다.');
  }

  if (!body.category) {
    setResponseStatus(event, 400);
    return useResponseError('카테고리는 필수입니다.');
  }

  if (
    body.price !== undefined &&
    (isNaN(Number(body.price)) || Number(body.price) < 0)
  ) {
    setResponseStatus(event, 400);
    return useResponseError('올바른 가격을 입력해주세요.');
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase =
    process.env.VITE_USE_SUPABASE === 'true' ||
    process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 상품 생성');
    return await createProductWithSupabase(event, userinfo, body);
  } else {
    console.log('🔄 Mock 상품 생성');
    return createProductWithMock(body);
  }
});
