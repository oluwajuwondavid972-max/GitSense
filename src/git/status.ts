import { runGitCommand } from './git';

export interface GitStatus {
	branch: string;
	stagedFiles: string[];
	modifiedFiles: string[];
	untrackedFiles: string[];
	deletedFiles: string[];
}

export async function getGitStatus(
	repositoryPath: string
): Promise<GitStatus> {
	const branch = await runGitCommand(
		'branch --show-current',
		repositoryPath
	);

	const output = await runGitCommand(
		'status --porcelain',
		repositoryPath
	);

	const stagedFiles: string[] = [];
	const modifiedFiles: string[] = [];
	const untrackedFiles: string[] = [];
	const deletedFiles: string[] = [];

	for (const line of output.split('\n')) {
		if (!line.trim()) {
			continue;
		}

		const indexStatus = line[0];
		const workingTreeStatus = line[1];
		const file = line.slice(3);

		if (indexStatus === '?' && workingTreeStatus === '?') {
			untrackedFiles.push(file);
			continue;
		}

		if (indexStatus === 'D' || workingTreeStatus === 'D') {
			deletedFiles.push(file);
		}

		if (indexStatus !== ' ' && indexStatus !== '?') {
			stagedFiles.push(file);
		}

		if (workingTreeStatus === 'M') {
			modifiedFiles.push(file);
		}
	}

	return {
		branch,
		stagedFiles,
		modifiedFiles,
		untrackedFiles,
		deletedFiles
	};
}