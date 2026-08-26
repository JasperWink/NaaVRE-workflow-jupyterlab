export interface ISharingScope {
  url: string;
  title: string;
  label: 'virtual_lab' | 'community';
  show_in_virtual_labs: string[];
  check_in_virtual_labs: string[];
}

export interface IUser {
  username: string;
  name: string;
}

export interface IAssetVersionsRef {
  version: number;
  url: string;
}

export interface IBaseAsset {
  url: string;
  title: string;
  description?: string;
  created?: string;
  modified?: string;
  owner?: string;
  virtual_lab?: string | null;
  shared_with_scopes?: string[]; // ISharingScope slug
  shared_with_users?: string[]; // User slug
}
