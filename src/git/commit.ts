
import { runGitCommand } from './git';

export interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
}

export async function getRecentCommits(
  repositoryPath: string,
  limit = 5
): Promise<GitCommit[]> {
  const output = await runGitCommand(
    `log -${limit} --pretty=format:%H|%h|%s|%an|%ad --date=short`,
    repositoryPath
  );

  if (!output) {
    return [];
  }

  return output.split(/\r?\n/).map((line) => {
    const [hash, shortHash, message, author, date] =
      line.split('|');

    return {
      hash,
      shortHash,
      message,
      author,
      date
    };
  });
}
