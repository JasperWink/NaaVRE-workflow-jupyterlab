import { IBaseAsset, IAssetVersionsRef } from './BaseAssets';

export interface IBaseImage {
  build: string;
  runtime: string;
}

export interface IDependency {
  name: string;
  module?: string | null;
  asname?: string | null;
}

export type VariableType = 'int' | 'float' | 'str' | 'list';

export interface IBaseVariable {
  name: string;
  type: VariableType | null;
}

export interface IInput extends IBaseVariable {}

export interface IOutput extends IBaseVariable {}

export interface IConf {
  name: string;
  assignation: string;
}

export interface IParam extends IBaseVariable {
  default_value?: string;
}

export interface ISecret extends IBaseVariable {}

export interface ICell extends IBaseAsset {
  version?: number;
  versions?: IAssetVersionsRef[];
  container_image: string | null;
  base_container_image?: IBaseImage | null;
  dependencies: Array<IDependency>;
  inputs: Array<IInput>;
  outputs: Array<IOutput>;
  confs: Array<IConf>;
  params: Array<IParam>;
  secrets: Array<ISecret>;
  kernel?: string;
  source_url?: string;
  is_draft?: boolean;
}
