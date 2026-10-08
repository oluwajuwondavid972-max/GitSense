import * as vscode from 'vscode';
import { findRepository } from './git/repository';
import { getGitStatus } from './git/status';

export function activate(context: vscode.ExtensionContext) {
  console.log('GitSense is now running!');

  const disposable = vscode.commands.registerCommand(
    'gitsense.scanRepository',
    async () => {
      const repository = await findRepository();

      if (!repository) {
        vscode.window.showWarningMessage(
          'GitSense could not find a Git repository.'
        );
        return;
      }

      const status = await getGitStatus(repository);

      const message =
        `Branch: ${status.branch || '(detached HEAD)'}\n` +
        `Staged: ${status.stagedFiles.length}\n` +
        `Modified: ${status.modifiedFiles.length}\n` +
        `Untracked: ${status.untrackedFiles.length}\n` +
        `Deleted: ${status.deletedFiles.length}`;

      vscode.window.showInformationMessage(message);

      console.log('GitSense repository status:', status);
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}