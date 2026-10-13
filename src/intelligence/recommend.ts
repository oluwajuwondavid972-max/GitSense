
import type { GitStatus } from '../git/status';
import type { GitRemoteState } from '../git/remote';
import type { GitOperationState } from '../git/operations';

export interface GitRecommendation {
  title: string;
  explanation: string;
  command: string | null;
  risk: 'low' | 'medium' | 'high';
}

export function recommendGitAction(
  status: GitStatus,
  remote: GitRemoteState,
  operations: GitOperationState
): GitRecommendation {
  // 1. Unresolved conflicts require attention first.
  if (operations.conflictedFiles.length > 0) {
    return {
      title: 'Resolve merge conflicts',
      explanation:
        `Git reports ${operations.conflictedFiles.length} conflicted file(s). ` +
        'Open each file, resolve the conflict markers, then stage the resolved files.',
      command: 'git status',
      risk: 'high'
    };
  }

  // 2. An operation is already in progress.
  if (
    operations.isMergeInProgress ||
    operations.isRebaseInProgress ||
    operations.isCherryPickInProgress ||
    operations.isRevertInProgress
  ) {
    return {
      title: 'Finish or inspect the current Git operation',
      explanation:
        'A Git operation is in progress. Check its status before starting another operation.',
      command: 'git status',
      risk: 'medium'
    };
  }

  // 3. Detached HEAD needs careful handling.
  if (operations.isDetachedHead) {
    return {
      title: 'You are in detached HEAD state',
      explanation:
        'You are not currently on a local branch. If you want to keep new commits, create a branch before switching away.',
      command: 'git switch -c <new-branch-name>',
      risk: 'medium'
    };
  }

  // 4. Staged changes may be ready to commit.
  if (status.stagedFiles.length > 0) {
    return {
      title: 'Review staged changes before committing',
      explanation:
        `${status.stagedFiles.length} file(s) are staged. Inspect the staged diff to confirm what will be committed.`,
      command: 'git diff --cached',
      risk: 'low'
    };
  }

  // 5. Unstaged modifications.
  if (status.modifiedFiles.length > 0 || status.deletedFiles.length > 0) {
    return {
      title: 'Review your working-tree changes',
      explanation:
        'You have modified or deleted files that are not fully staged. Review the changes before staging anything.',
      command: 'git diff',
      risk: 'low'
    };
  }

  // 6. Untracked files.
  if (status.untrackedFiles.length > 0) {
    return {
      title: 'Review untracked files',
      explanation:
        `${status.untrackedFiles.length} untracked file(s) are present. Decide which files belong in the repository before staging them.`,
      command: 'git status --short',
      risk: 'low'
    };
  }

  // 7. Local commits are ahead of the upstream branch.
  if (remote.ahead > 0) {
    return {
      title: 'Local commits have not been pushed',
      explanation:
        `${remote.ahead} commit(s) are ahead of the upstream. Review them before pushing.`,
      command: 'git log @{u}..HEAD --oneline',
      risk: 'medium'
    };
  }

  // 8. Remote commits are ahead of the local branch.
  if (remote.behind > 0) {
    return {
      title: 'Remote commits are waiting',
      explanation:
        `${remote.behind} commit(s) are on the upstream but not on your local branch. Review them before integrating.`,
      command: 'git log HEAD..@{u} --oneline',
      risk: 'medium'
    };
  }

  return {
    title: 'Your repository looks clean',
    explanation:
      'No pending file changes or upstream differences were detected. You can continue working normally.',
    command: 'git status',
    risk: 'low'
  };
}