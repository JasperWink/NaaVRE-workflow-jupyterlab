import { LabIcon } from '@jupyterlab/ui-components';

import launcherIconSvgStr from '../style/icons/launcher-icon.svg';
import panelIconSvgStr from '../style/icons/panel-icon.svg';

export const launcherIcon = new LabIcon({
  name: 'launcher-icon',
  svgstr: launcherIconSvgStr
});

export const panelIcon = new LabIcon({
  name: 'panel-icon',
  svgstr: panelIconSvgStr
});
