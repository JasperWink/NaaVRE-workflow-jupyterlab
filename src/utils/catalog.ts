import { NaaVREExternalService } from '../naavre-common/handler';
import { ceil } from 'lodash';

export interface ICatalogueListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<T>;
}

export function urlToPageNumber(url: string) {
  const u = new URL(url);
  if (u.searchParams.has('page')) {
    const p = Number(u.searchParams.get('page'));
    if (isNaN(p)) {
      throw Error(`Unexpected url: ${url}`);
    }
    return p;
  } else {
    return 1;
  }
}

export function getPageNumberAndCount(resp: ICatalogueListResponse<any>) {
  // The catalogue does not send back the page size and page count, so we get
  // to have fun with arithmetics
  let currentPage: number;
  let pageCount: number;
  if (resp.previous === null && resp.next === null) {
    // only one page
    currentPage = 1;
    pageCount = 1;
  } else if (resp.previous === null && resp.next !== null) {
    // first of several pages
    currentPage = 1;
    pageCount = ceil(resp.count / resp.results.length);
  } else if (resp.previous !== null && resp.next !== null) {
    // neither first nor last of several pages
    const previousPage = urlToPageNumber(resp.previous);
    currentPage = previousPage + 1;
    const pageSize = resp.results.length;
    pageCount = ceil(resp.count / pageSize);
  } else if (resp.previous !== null && resp.next === null) {
    // last of several pages
    const previousPage = urlToPageNumber(resp.previous);
    currentPage = previousPage + 1;
    pageCount = currentPage;
  } else {
    throw Error(`Unexpected pagination: ${resp}`);
  }
  return [currentPage, pageCount];
}

export async function fetchListPageFromCatalogue<T>(
  url: string
): Promise<ICatalogueListResponse<T>> {
  const resp = await NaaVREExternalService('GET', url, {
    accept: 'application/json'
  });
  if (resp.status_code !== 200) {
    throw `${resp.status_code} ${resp.reason}`;
  }
  return JSON.parse(resp.content);
}

export async function fetchListFromCatalogue<T>(
  url: string,
  getAllPages?: boolean
): Promise<ICatalogueListResponse<T>> {
  let pageContent = await fetchListPageFromCatalogue<T>(url);
  if (!getAllPages) {
    return pageContent;
  } else {
    const content: ICatalogueListResponse<T> = {
      count: pageContent.count,
      next: null,
      previous: null,
      results: pageContent.results
    };
    while (pageContent.next !== null) {
      pageContent = await fetchListPageFromCatalogue<T>(pageContent.next);
      content.results = content.results.concat(pageContent.results);
    }
    return content;
  }
}
