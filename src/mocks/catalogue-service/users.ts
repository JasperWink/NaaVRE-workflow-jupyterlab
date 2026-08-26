import { INaaVREExternalServiceResponse } from '../../naavre-common/handler';
import { IUser } from '../../naavre-common/types/NaaVRECatalogue/BaseAssets';

export const users: IUser[] = [
  {
    username: 'fixture-user-1',
    name: ''
  },
  {
    username: 'test-user-2',
    name: ''
  }
];

export async function getUsersList(
  request: Request
): Promise<INaaVREExternalServiceResponse> {
  const body = await request.json();
  const url = new URL(body.query.url);
  const search = url.searchParams.get('search');
  const results = search !== null && search.length > 2 ? users : [];
  return {
    status_code: 200,
    reason: 'OK',
    headers: {
      'content-type': 'application/json'
    },
    content: JSON.stringify({
      count: results.length,
      next: null,
      previous: null,
      results: results
    })
  };
}
