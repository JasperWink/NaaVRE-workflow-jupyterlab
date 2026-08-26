import { createContext } from 'react';
import { defaultUserInfo, IUserInfo } from '../../hooks/use-user-info';

export const UserInfoContext = createContext<IUserInfo>(defaultUserInfo);
