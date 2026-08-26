import { ceil } from 'lodash';
import { getPageNumberAndCount, urlToPageNumber } from './catalog';

test.each([
  { url: 'https://example.com/path/to/', pageNumber: 1 },
  { url: 'https://example.com/path/to/?page=7', pageNumber: 7 },
  { url: 'https://example.com/path/to/?page=43', pageNumber: 43 },
  { url: 'https://example.com/path/to/?page=355', pageNumber: 355 }
])('get page number from URL', ({ url, pageNumber }) => {
  expect(urlToPageNumber(url)).toBe(pageNumber);
});

describe('get current page number and page count', () => {
  [
    { itemCount: 0, pageSize: 10 },
    { itemCount: 1, pageSize: 10 },
    { itemCount: 5, pageSize: 10 },
    { itemCount: 9, pageSize: 10 },
    { itemCount: 10, pageSize: 10 },
    { itemCount: 11, pageSize: 10 },
    { itemCount: 19, pageSize: 10 },
    { itemCount: 20, pageSize: 10 },
    { itemCount: 21, pageSize: 10 },
    { itemCount: 24, pageSize: 10 },
    { itemCount: 34, pageSize: 10 }
  ].forEach(({ itemCount, pageSize }) => {
    const pageCount = itemCount === 0 ? 1 : ceil(itemCount / pageSize);
    for (let currentPage = 1; currentPage <= pageCount; currentPage++) {
      test(`${itemCount} items - page ${currentPage} of ${pageCount}`, () => {
        const currentPageSize =
          currentPage === pageCount
            ? itemCount - pageSize * (pageCount - 1)
            : pageSize;
        const resp = {
          count: itemCount,
          previous:
            currentPage === 1
              ? null
              : currentPage === 2
                ? 'https://example.com/path/to/'
                : `https://example.com/path/to/?page=${currentPage - 1}`,
          next: currentPage === pageCount ? null : `?page=${currentPage + 1}`,
          results: Array(currentPageSize)
        };
        console.debug(resp);
        expect(getPageNumberAndCount(resp)).toStrictEqual([
          currentPage,
          pageCount
        ]);
      });
    }
  });
});
