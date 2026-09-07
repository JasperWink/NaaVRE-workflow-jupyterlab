// Puts cards on the NaaVRE task board (@naavre/taskboard-jupyterlab). Separate
// repos, so the board is reached by command name rather than import — a
// string contract that also makes it optional. Keep its CommandIDs.addTask
// in sync.

import { CommandRegistry } from '@lumino/commands';

/** Command the task board extension registers to accept new cards. */
export const ADD_TASK_COMMAND = 'naavre-taskboard:add-task';

let _commands: CommandRegistry | null = null;

/**
 * Register the application's command registry. Called once from src/index.ts.
 */
export function setCommandRegistry(commands: CommandRegistry | null): void {
  _commands = commands;
}

/**
 * Whether the board extension is installed, so components can offer its
 * actions. True only once its plugin has activated, long before any caller.
 */
export function taskBoardAvailable(): boolean {
  return _commands !== null && _commands.hasCommand(ADD_TASK_COMMAND);
}

/**
 * Add a card to the board's first column. The board persists it to its shared
 * document; the card is independent. Rejects if unavailable or refused.
 */
export async function addTaskToBoard(fields: {
  title: string;
  description: string;
}): Promise<void> {
  const commands = _commands;
  if (!commands?.hasCommand(ADD_TASK_COMMAND)) {
    throw new Error('The task board is not available.');
  }
  await commands.execute(ADD_TASK_COMMAND, { ...fields });
}
