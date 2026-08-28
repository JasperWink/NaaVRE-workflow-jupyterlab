import { CommandRegistry } from '@lumino/commands';

import {
  ADD_TASK_COMMAND,
  addTaskToBoard,
  setCommandRegistry,
  taskBoardAvailable
} from '../boardAccess';

/**
 * A command registry standing in for the application's, with the task board
 * extension's `add-task` command registered on it. Uses the real
 * CommandRegistry rather than a mock, so these tests exercise the same
 * lookup-and-execute path the application takes.
 */
function registryWithBoard(
  execute: (args: any) => unknown = () => undefined
): CommandRegistry {
  const commands = new CommandRegistry();
  commands.addCommand(ADD_TASK_COMMAND, { execute: args => execute(args) });
  return commands;
}

describe('boardAccess', () => {
  afterEach(() => setCommandRegistry(null));

  describe('taskBoardAvailable', () => {
    it('is false before a registry is set', () => {
      expect(taskBoardAvailable()).toBe(false);
    });

    it('is false when the task board extension is not installed', () => {
      // A registry with no board: every other JupyterLab command is present,
      // but nothing registered `naavre-taskboard:add-task`.
      setCommandRegistry(new CommandRegistry());
      expect(taskBoardAvailable()).toBe(false);
    });

    it('is true once the board has registered its command', () => {
      setCommandRegistry(registryWithBoard());
      expect(taskBoardAvailable()).toBe(true);
    });
  });

  describe('addTaskToBoard', () => {
    it('executes the board command with the card fields', async () => {
      const execute = jest.fn();
      setCommandRegistry(registryWithBoard(execute));

      await addTaskToBoard({
        title: 'Load raster',
        description: 'Read a TIFF'
      });

      expect(execute).toHaveBeenCalledTimes(1);
      expect(execute).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Load raster',
          description: 'Read a TIFF'
        })
      );
    });

    it('fails with a clear message when the board is not installed', async () => {
      setCommandRegistry(new CommandRegistry());
      await expect(
        addTaskToBoard({ title: 'A', description: '' })
      ).rejects.toThrow('The task board is not available.');
    });

    it('fails with a clear message when no registry was set', async () => {
      await expect(
        addTaskToBoard({ title: 'A', description: '' })
      ).rejects.toThrow('The task board is not available.');
    });

    it("propagates the board's own failure to the caller", async () => {
      setCommandRegistry(
        registryWithBoard(() => {
          throw new Error('The task board has no column to add the card to.');
        })
      );

      await expect(
        addTaskToBoard({ title: 'A', description: '' })
      ).rejects.toThrow('The task board has no column to add the card to.');
    });
  });
});
