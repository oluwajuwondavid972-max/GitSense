
import * as vscode from 'vscode';
import { findRepository } from './git/repository';
import { getGitStatus } from './git/status';
import { getRecentCommits } from './git/commit';
import { getRemoteState } from './git/remote';
import { getGitOperationState } from './git/operations';
import { recommendGitAction } from './intelligence/recommend';

export function activate(context: vscode.ExtensionContext) {
  console.log('GitSense is now running!');

  const disposable = vscode.commands.registerCommand(
    'gitsense.scanRepository',
    async () => {
      try {
        const repository = await findRepository();

        if (!repository) {
          vscode.window.showWarningMessage(
            'GitSense could not find a Git repository.'
          );
          return;
        }

        const [status, commits, remote, operations] =
          await Promise.all([
            getGitStatus(repository),
            getRecentCommits(repository),
            getRemoteState(repository),
            getGitOperationState(repository)
          ]);

        const recommendation = recommendGitAction(
          status,
          remote,
          operations
        );

        const operationNames: string[] = [];

        if (operations.isMergeInProgress) {
          operationNames.push('Merge');
        }
        if (operations.isRebaseInProgress) {
          operationNames.push('Rebase');
        }
        if (operations.isCherryPickInProgress) {
          operationNames.push('Cherry-pick');
        }
        if (operations.isRevertInProgress) {
          operationNames.push('Revert');
        }

        const operationSummary = operationNames.length
          ? operationNames.join(', ')
          : 'None';

        const message = [
          `Branch: ${status.branch || '(detached HEAD)'}`,
          `Staged: ${status.stagedFiles.length}`,
          `Modified: ${status.modifiedFiles.length}`,
          `Untracked: ${status.untrackedFiles.length}`,
          `Deleted: ${status.deletedFiles.length}`,
          `Recent commits: ${commits.length}`,
          `Remote: ${remote.remoteName ?? 'none'}`,
          `Ahead: ${remote.ahead}`,
          `Behind: ${remote.behind}`,
          `Operation: ${operationSummary}`,
          `Conflicts: ${operations.conflictedFiles.length}`
        ].join(' | ');

        const details = [
          'GITSENSE REPOSITORY REPORT',
          '==========================',
          `Repository: ${repository}`,
          `Branch: ${status.branch || '(detached HEAD)'}`,
          '',
          'REPOSITORY STATUS',
          `Staged files: ${status.stagedFiles.join(', ') || 'None'}`,
          `Modified files: ${status.modifiedFiles.join(', ') || 'None'}`,
          `Untracked files: ${status.untrackedFiles.join(', ') || 'None'}`,
          `Deleted files: ${status.deletedFiles.join(', ') || 'None'}`,
          '',
          'REMOTE STATUS',
          `Remote: ${remote.remoteName ?? 'None'}`,
          `Remote URL: ${remote.remoteUrl ?? 'Not configured'}`,
          `Upstream: ${remote.upstreamBranch ?? 'Not configured'}`,
          `Commits ahead: ${remote.ahead}`,
          `Commits behind: ${remote.behind}`,
          '',
          'GIT OPERATIONS',
          `Operation in progress: ${operationSummary}`,
          `Detached HEAD: ${operations.isDetachedHead ? 'Yes' : 'No'}`,
          `Conflicted files: ${operations.conflictedFiles.join(', ') || 'None'}`,
          '',
          'RECENT COMMITS',
          ...(
            commits.length
              ? commits.map(
                  (commit) =>
                    `${commit.shortHash} - ${commit.message} (${commit.author}, ${commit.date})`
                )
              : ['No commits found']
          ),
          '',
          'GITSENSE RECOMMENDATION',
          `Action: ${recommendation.title}`,
          `Explanation: ${recommendation.explanation}`,
          `Suggested command: ${recommendation.command ?? 'None'}`,
          `Risk level: ${recommendation.risk}`,
          '',
          'GitSense does not execute this suggested command automatically.'
        ].join('\n');

        const action = await vscode.window.showInformationMessage(
          `GitSense: ${recommendation.title}`,
          'View Full Report',
          'Copy Suggested Command'
        );

        if (action === 'View Full Report') {
          const document = await vscode.workspace.openTextDocument({
            language: 'plaintext',
            content: details
          });

          await vscode.window.showTextDocument(document);
        } else if (action === 'Copy Suggested Command') {
          if (recommendation.command) {
            await vscode.env.clipboard.writeText(
              recommendation.command
            );
            vscode.window.showInformationMessage(
              'Suggested command copied. Review it before running.'
            );
          } else {
            vscode.window.showInformationMessage(
              'There is no command to copy.'
            );
          }
        }

        console.log('GitSense repository:', repository);
        console.log('GitSense status:', status);
        console.log('GitSense commits:', commits);
        console.log('GitSense remote:', remote);
        console.log('GitSense operations:', operations);
        console.log('GitSense recommendation:', recommendation);
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);

        vscode.window.showErrorMessage(
          `GitSense failed to scan the repository: ${errorMessage}`
        );

        console.error('GitSense scan error:', error);
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
