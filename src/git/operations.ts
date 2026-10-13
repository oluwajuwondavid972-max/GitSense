
import { runGitCommand } from './git';

export interface GitOperationState {
  isMergeInProgress: boolean;
  isRebaseInProgress: boolean;
  isCherryPickInProgress: boolean;
  isRevertInProgress: boolean;
  conflictedFiles: string[];
  isDetachedHead: boolean;
}

export async function getGitOperationState(
  repositoryPath: string
): Promise<GitOperationState> {
  const checkGitPath = async (
    path: string
  ): Promise<boolean> => {
    try {
      await runGitCommand(
        `rev-parse --verify ${path}`,
        repositoryPath
      );
      return true;
    } catch {
      return false;
    }
  };

  const [
    mergeHead,
    rebaseMerge,
    rebaseApply,
    cherryPickHead,
    revertHead,
    branch
  ] = await Promise.all([
    checkGitPath('MERGE_HEAD'),
    checkGitPath('--git-path rebase-merge'),
    checkGitPath('--git-path rebase-apply'),
    checkGitPath('CHERRY_PICK_HEAD'),
    checkGitPath('REVERT_HEAD'),
    runGitCommand('branch --show-current', repositoryPath)
      .catch(() => '')
  ]);

  const conflictOutput = await runGitCommand(
    'diff --name-only --diff-filter=U',
    repositoryPath
  ).catch(() => '');

  const conflictedFiles = conflictOutput
    ? conflictOutput.split(/\r?\n/).filter(Boolean)
    : [];

  return {
    isMergeInProgress: mergeHead,
    isRebaseInProgress: rebaseMerge || rebaseApply,
    isCherryPickInProgress: cherryPickHead,
    isRevertInProgress: revertHead,
    conflictedFiles,
    isDetachedHead: branch.trim() === ''
  };
}
