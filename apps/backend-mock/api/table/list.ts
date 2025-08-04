import { faker } from '@faker-js/faker';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, usePageResponseSuccess } from '~/utils/response';

function generateMockDataList(count: number) {
  const dataList = [];

  for (let i = 0; i < count; i++) {
    const dataItem = {
      id: faker.string.uuid(),
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
    };

    dataList.push(dataItem);
  }

  return dataList;
}

const mockData = generateMockDataList(100);

// Supabase 테이블 데이터 조회
async function getTableDataWithSupabase(event: any, userinfo: any) {
  try {
    // @ts-ignore - 동적 import
    const { supabase } = await import('@vben/utils');

    // 쿼리 파라미터 추출
    const query = getQuery(event);
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const sortBy = (query.sortBy as string) || 'created_at';
    const sortOrder = (query.sortOrder as string) || 'desc';
    const search = (query.search as string) || '';
    const category = (query.category as string) || '';
    const status = (query.status as string) || '';
    const available =
      query.available === undefined ? null : query.available === 'true';
    const minPrice = query.minPrice ? Number(query.minPrice) : null;
    const maxPrice = query.maxPrice ? Number(query.maxPrice) : null;
    const minRating = query.minRating ? Number(query.minRating) : null;

    // Supabase 검색 함수 호출
    const { data: products, error: productsError } = await supabase.rpc(
      'search_products',
      {
        search_term: search,
        category_filter: category,
        status_filter: status,
        available_filter: available,
        min_price: minPrice,
        max_price: maxPrice,
        min_rating: minRating,
        sort_column: convertSortColumn(sortBy),
        sort_direction: sortOrder,
        page_size: pageSize,
        page_number: page,
      },
    );

    if (productsError) {
      console.error('상품 목록 조회 실패:', productsError);
      return useResponseError('상품 목록 조회에 실패했습니다.');
    }

    // 응답 데이터 포맷팅 (기존 mock 형식과 호환)
    const formattedProducts = (products || []).map((product) => ({
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
    }));

    // 총 개수 (첫 번째 레코드에서 추출)
    const totalCount =
      products && products.length > 0 ? products[0].total_count : 0;

    return usePageResponseSuccess(
      page.toString(),
      pageSize.toString(),
      formattedProducts,
      {
        message: 'ok',
        total: Number(totalCount),
        filters: {
          search,
          category,
          status,
          available,
          minPrice,
          maxPrice,
          minRating,
        },
      },
    );
  } catch (error) {
    console.error('Supabase 테이블 데이터 조회 오류:', error);
    return useResponseError('테이블 데이터 조회 중 오류가 발생했습니다.');
  }
}

// Mock 테이블 데이터 조회 (기존)
async function getTableDataWithMock(event: any) {
  await sleep(600);

  const { page, pageSize, sortBy, sortOrder } = getQuery(event);
  const listData = structuredClone(mockData);

  if (sortBy && Reflect.has(listData[0], sortBy as string)) {
    listData.sort((a, b) => {
      if (sortOrder === 'asc') {
        if (sortBy === 'price') {
          return (
            Number.parseFloat(a[sortBy as string]) -
            Number.parseFloat(b[sortBy as string])
          );
        } else {
          return a[sortBy as string] > b[sortBy as string] ? 1 : -1;
        }
      } else {
        if (sortBy === 'price') {
          return (
            Number.parseFloat(b[sortBy as string]) -
            Number.parseFloat(a[sortBy as string])
          );
        } else {
          return a[sortBy as string] < b[sortBy as string] ? 1 : -1;
        }
      }
    });
  }

  return usePageResponseSuccess(page as string, pageSize as string, listData);
}

// 정렬 컬럼명 변환 (camelCase → snake_case)
function convertSortColumn(sortBy: string): string {
  const columnMap: Record<string, string> = {
    productName: 'product_name',
    imageUrl: 'image_url',
    imageUrl2: 'image_url2',
    releaseDate: 'release_date',
    inProduction: 'in_production',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };

  return columnMap[sortBy] || sortBy;
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
    console.log('🔄 Supabase 테이블 데이터 조회');
    return await getTableDataWithSupabase(event, userinfo);
  } else {
    console.log('🔄 Mock 테이블 데이터 조회');
    return await getTableDataWithMock(event);
  }
});
