import { delay, http, HttpResponse, matchRequestUrl } from 'msw';
import { INaaVREExternalServiceResponse } from '../naavre-common/handler';
import { getCellsList, patchCell } from './catalogue-service/workflow-cells';
import { getSharingScopesList } from './catalogue-service/sharing-scopes';
import { getUsersList } from './catalogue-service/users';

function getExternalServiceHandler(
  method: string,
  origin: string,
  pathname: string,
  getExternalServiceResponse: (
    request: Request
  ) => Promise<INaaVREExternalServiceResponse>
) {
  return async ({ request }: { request: Request }) => {
    const actualBody = await request.clone().json();
    const queryUrl = new URL(actualBody.query.url);
    if (actualBody.query.method !== method) {
      return;
    }
    if (!matchRequestUrl(queryUrl, pathname, origin).matches) {
      return;
    }

    await delay(300);
    return HttpResponse.json(await getExternalServiceResponse(request));
  };
}

export const externalServiceHandlers = [
  http.get('/naavre-communicator/me', async () =>
    HttpResponse.json({
      sub: '00000000-0000-0000-0000-000000000000',
      preferred_username: 'test-user-2',
      name: null
    })
  ),
  http.post(
    '/naavre-communicator/external-service',
    getExternalServiceHandler(
      'GET',
      'http://localhost:8000',
      '/sharing-scopes/',
      getSharingScopesList
    )
  ),
  http.post(
    '/naavre-communicator/external-service',
    getExternalServiceHandler(
      'GET',
      'http://localhost:8000',
      '/users/',
      getUsersList
    )
  ),
  http.post(
    '/naavre-communicator/external-service',
    getExternalServiceHandler(
      'GET',
      'http://localhost:8000',
      '/workflow-cells/',
      getCellsList
    )
  ),
  http.post(
    '/naavre-communicator/external-service',
    getExternalServiceHandler(
      'PATCH',
      'http://localhost:8000',
      '/workflow-cells/*/',
      patchCell
    )
  )
];
