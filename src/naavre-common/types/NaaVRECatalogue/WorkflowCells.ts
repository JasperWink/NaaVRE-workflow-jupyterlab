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

/**
 * The types a cell input/output can have.
 *
 * This is not a UI choice: it mirrors `BaseVariable.TYPE_CHOICES` in the
 * catalogue service (app/workflow_cells/models.py), which validates it on
 * write. Adding a type here without adding it there makes the catalogue reject
 * the cell with `400 {"type": ["\"bool\" is not a valid choice."]}` at the
 * point it is saved — long after the user picked it. Widen the service first.
 */
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
