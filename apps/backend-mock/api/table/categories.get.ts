import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';

// Supabase 카테고리 목록 조회
async function getCategoriesWithSupabase(_event: any, _userinfo: any) {
  try {
    // @ts-ignore - 동적 import
    const { supabase } = await import('@vben/utils');

    // 고유 카테고리 목록과 각 카테고리별 상품 수 조회
    const { data: categories, error: categoriesError } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null);

    if (categoriesError) {
      console.error('카테고리 조회 실패:', categoriesError);
      return useResponseError('카테고리 조회에 실패했습니다.');
    }

    // 카테고리별 집계
    const categoryMap = new Map();

    categories?.forEach((item) => {
      const category = item.category;
      if (category) {
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      }
    });

    // 카테고리 목록 정렬 및 형식화
    const formattedCategories = [...categoryMap.entries()]
      .map(([name, count]) => ({
        name,
        count,
        label: `${name} (${count})`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return useResponseSuccess({
      categories: formattedCategories,
      total: categoryMap.size,
      message: '카테고리 목록 조회 성공',
    });
  } catch (error) {
    console.error('Supabase 카테고리 조회 오류:', error);
    return useResponseError('카테고리 조회 중 오류가 발생했습니다.');
  }
}

// Mock 카테고리 목록 조회
function getCategoriesWithMock() {
  // Mock 카테고리 데이터
  const mockCategories = [
    { name: 'Electronics', count: 8, label: 'Electronics (8)' },
    { name: 'Clothing', count: 3, label: 'Clothing (3)' },
    { name: 'Home & Garden', count: 4, label: 'Home & Garden (4)' },
    { name: 'Books', count: 2, label: 'Books (2)' },
    { name: 'Sports', count: 3, label: 'Sports (3)' },
    { name: 'Accessories', count: 1, label: 'Accessories (1)' },
  ].sort((a, b) => a.name.localeCompare(b.name));

  console.log('Mock 카테고리 조회');

  return useResponseSuccess({
    categories: mockCategories,
    total: mockCategories.length,
    message: '카테고리 목록 조회 성공',
  });
}

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 환경 변수에 따라 Supabase 또는 Mock 사용
  const useSupabase =
    process.env.VITE_USE_SUPABASE === 'true' ||
    process.env.USE_SUPABASE === 'true';

  if (useSupabase) {
    console.log('🔄 Supabase 카테고리 조회');
    return await getCategoriesWithSupabase(event, userinfo);
  } else {
    console.log('🔄 Mock 카테고리 조회');
    return getCategoriesWithMock();
  }
});
