import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 상품 상세 조회
async function getProductDetailWithSupabase(
  event: any,
  userinfo: any,
  productId: string,
) {
  try {
    // @ts-ignore - 동적 import
    const { supabase } = await import('@vben/utils');

    // 상품 상세 정보 조회
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      setResponseStatus(event, 404);
      return useResponseError('상품을 찾을 수 없습니다.');
    }

    // 응답 데이터 포맷팅 (기존 mock 형식과 호환)
    const formattedProduct = {
      id: product.id,
      imageUrl: product.image_url,
      imageUrl2: product.image_url2,
      open: product.open,
      status: product.status,
      productName: product.product_name,
      price: product.price.toString(),
      currency: product.currency,
      quantity: product.quantity,
      available: product.available,
      category: product.category,
      releaseDate: product.release_date,
      rating: product.rating,
      description: product.description,
      weight: product.weight,
      color: product.color,
      inProduction: product.in_production,
      tags: product.tags || [],
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    };

    return useResponseSuccess(formattedProduct);
  } catch (error) {
    console.error('Supabase 상품 상세 조회 오류:', error);
    return useResponseError('상품 상세 조회 중 오류가 발생했습니다.');
  }
}

// Mock 상품 상세 조회
function getProductDetailWithMock(productId: string) {
  // Mock에서는 faker로 임시 데이터 생성
  const { faker } = require('@faker-js/faker');

  const mockProduct = {
    id: productId,
    imageUrl: faker.image.avatar(),
    imageUrl2: faker.image.avatar(),
    open: faker.datatype.boolean(),
    status: faker.helpers.arrayElement(['success', 'error', 'warning']),
    productName: faker.commerce.productName(),
    price: faker.commerce.price(),
    currency: faker.finance.currencyCode(),
    quantity: faker.number.int({ min: 1, max: 100 }),
    available: faker.datatype.boolean(),
    category: faker.commerce.department(),
    releaseDate: faker.date.past(),
    rating: faker.number.float({ min: 1, max: 5 }),
    description: faker.commerce.productDescription(),
    weight: faker.number.float({ min: 0.1, max: 10 }),
    color: faker.color.human(),
    inProduction: faker.datatype.boolean(),
    tags: Array.from({ length: 3 }, () => faker.commerce.productAdjective()),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log('Mock 상품 상세 조회:', productId);

  return useResponseSuccess(mockProduct);
}

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
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
    console.log('🔄 Supabase 상품 상세 조회');
    return await getProductDetailWithSupabase(event, userinfo, productId);
  } else {
    console.log('🔄 Mock 상품 상세 조회');
    return getProductDetailWithMock(productId);
  }
});
