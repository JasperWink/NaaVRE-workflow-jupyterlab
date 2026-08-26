import { useEffect, useState } from 'react';

import { requestAPI } from '../naavre-common/handler';

export interface IUserInfo {
  sub: string | null;
  preferred_username: string | null;
  username: string | null;
}

export const defaultUserInfo = {
  sub: null,
  preferred_username: null,
  username: null
};

export function useUserInfo() {
  const [userInfo, setUserInfo] = useState<IUserInfo>(defaultUserInfo);

  useEffect(() => {
    requestAPI<IUserInfo>('naavre-communicator/me').then(resp => {
      setUserInfo(resp);
    });
  }, []);

  return userInfo;
}
