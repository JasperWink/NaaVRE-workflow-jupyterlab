import { Notification } from '@jupyterlab/apputils';

import { NaaVREExternalService } from '../../naavre-common/handler';
import { ISettings } from '../../settings';

// Partial https://argo-workflows.readthedocs.io/en/latest/fields/#nodestatus
declare type ArgoNodeStatus = {
  id: string;
  name: string;
  displayName: string;
  phase:
    | 'Pending'
    | 'Running'
    | 'Succeeded'
    | 'Skipped'
    | 'Failed'
    | 'Error'
    | 'Omitted';
};

// Partial https://argo-workflows.readthedocs.io/en/latest/fields/#workflowstatus
declare type ArgoWorkflowStatus = {
  phase: '' | 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Error';
  progress: string;
  nodes: { [id: string]: ArgoNodeStatus };
};

declare type WorkflowStatusResponse = {
  status: ArgoWorkflowStatus;
} | null;

async function callStatusAPI(workflowUrl: string, settings: ISettings) {
  const resp = await NaaVREExternalService(
    'GET',
    `${settings.workflowServiceUrl}/status/${settings.virtualLab}?workflow_url=${workflowUrl}`,
    {},
    {}
  );
  if (resp.status_code === 200) {
    return JSON.parse(resp.content) as WorkflowStatusResponse;
  } else if (resp.status_code === 404) {
    return null;
  } else {
    throw `${resp.status_code} ${resp.reason}`;
  }
}

export async function runWorkflowNotification(
  workflowUrl: string,
  settings: ISettings
) {
  const workflowName = workflowUrl.split('/').at(-1);
  const notificationId = Notification.emit(
    `Starting workflow\n${workflowName}`,
    'in-progress',
    {
      autoClose: false,
      actions: [
        {
          label: 'Show in workflow engine',
          callback: event => {
            event.preventDefault();
            window.open(workflowUrl);
          }
        }
      ]
    }
  );

  let statusResponse: WorkflowStatusResponse;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await new Promise(r => setTimeout(r, 10000));
    try {
      statusResponse = await callStatusAPI(workflowUrl, settings);
    } catch {
      Notification.update({
        id: notificationId,
        type: 'error',
        message: `Could not get workflow status\n${workflowName}`,
        autoClose: 5000
      });
      return;
    }
    switch (statusResponse?.status.phase) {
      case 'Pending':
        Notification.update({
          id: notificationId,
          message: `Starting workflow\n${workflowName}`
        });
        break;
      case 'Running':
        Notification.update({
          id: notificationId,
          message: `Running workflow (${statusResponse.status.progress})\n${workflowName}`
        });
        break;
      case '':
        Notification.update({
          id: notificationId,
          type: 'warning',
          message: `Unknown workflow status\n${workflowName}`,
          autoClose: 5000
        });
        return;
      case 'Succeeded':
        Notification.update({
          id: notificationId,
          type: 'success',
          message: `Workflow successful\n${workflowName}`,
          autoClose: 5000
        });
        return;
      case 'Failed':
        Notification.update({
          id: notificationId,
          type: 'error',
          message: `Workflow failed\n${workflowName}`,
          autoClose: 5000
        });
        return;
      case 'Error':
        Notification.update({
          id: notificationId,
          type: 'error',
          message: `Workflow error\n${workflowName}`,
          autoClose: 5000
        });
        return;
    }
  }
}
