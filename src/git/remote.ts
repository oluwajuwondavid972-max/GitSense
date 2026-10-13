
import { runGitCommand } from './git';

export interface GitRemoteState {
  remoteName: string | null;
  remoteUrl: string | null;
  upstreamBranch: string | null;
  ahead: number;
  behind: number;
  hasUpstream: boolean;
}

export async function getRemoteState(
  repositoryPath: string
): Promise<GitRemoteState> {
  let remoteName: string | null = null;
  let remoteUrl: string | null = null;
  let upstreamBranch: string | null = null;
  let ahead = 0;
  let behind = 0;
  let hasUpstream = false;

  try {
    const remotes = await runGitCommand(
      'remote',
      repositoryPath
    );

    remoteName = remotes.split('\n')[0] || null;

    if (remoteName) {
      remoteUrl = await runGitCommand(
        `remote get-url ${remoteName}`,
        repositoryPath
      );
    }
  } catch {
    // No remote is configured.
  }

  try {
    upstreamBranch = await runGitCommand(
      'rev-parse --abbrev-ref --symbolic-full-name @{u}',
      repositoryPath
    );

    hasUpstream = true;

    const counts = await runGitCommand(
      'rev-list --left-right --count HEAD...@{u}',
      repositoryPath
    );

    const [aheadCount, behindCount] = counts
      .split(/\s+/)
      .map(Number);

    ahead = aheadCount || 0;
    behind = behindCount || 0;
  } catch {
    // No upstream branch, or the upstream cannot be read.
  }

  return {
    remoteName,
    remoteUrl,
    upstreamBranch,
    ahead,
    behind,
    hasUpstream
  };
}

