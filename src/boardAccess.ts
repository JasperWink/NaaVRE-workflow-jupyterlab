// Lets code in the composer — the draft-node inspector in the chart — put a
// card on the NaaVRE task board, which lives in a separate extension
// (@naavre/taskboard-jupyterlab).
//
// The two are deliberately independent repos, so nothing here can import from
// the board. Instead the board registers a JupyterLab command and we execute it
// by name: a string contract, with no build-time dependency in either
// direction. That also makes the board genuinely optional — when it is not
// installed the command is simply absent and the composer hides its
// board-specific affordances.
//
// The command id and its argument names are part of the board's public API;
// keep them in sync with `CommandIDs.addTask` in the task board extension
// (src/commands.ts there).

import { CommandRegistry } from '@lumino/commands';

/** Command the task board extension registers to accept new cards. */
export const ADD_TASK_COMMAND = 'naavre-taskboard:add-task';

let _commands: CommandRegistry | null = null;

/**
 * Register the application's command registry. Called once from this
 * extension's activate function (see src/index.ts), mirroring how
 * naavre-common/notebook.ts exposes the document manager to the composer.
 */
export function setCommandRegistry(commands: CommandRegistry | null): void {
  _commands = commands;
}

/**
 * Whether the task board extension is installed and has registered its
 * commands. Components use this to decide whether to offer board actions.
 *
 * This only becomes true once the board plugin has activated. Both plugins are
 * `autoStart`, and every caller here renders in response to a user selecting a
 * node — long after startup — so the ordering between the two is not a concern
 * in practice.
 */
export function taskBoardAvailable(): boolean {
  return _commands !== null && _commands.hasCommand(ADD_TASK_COMMAND);
}

/**
 * Add a card to the first column of the task board.
 *
 * The board owns what this means: it opens its shared document in the
 * background, appends the card and persists it, so the card shows up right away
 * on every client that has the board open — and on the next open for those that
 * do not. It is an independent card: nothing links it back to whatever the
 * fields were copied from.
 *
 * Rejects if the board is unavailable, or with whatever the board reports if it
 * could not accept the card, so callers can tell the user why nothing appeared.
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
