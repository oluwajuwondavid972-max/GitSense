import { exec } from 'child_process';

export function runGitCommand(
	command: string,
	cwd: string
): Promise<string> {
	return new Promise((resolve, reject) => {
		exec(`git ${command}`, { cwd }, (error, stdout, stderr) => {
			if (error) {
				reject(new Error(stderr || error.message));
				return;
			}

			resolve(stdout.trim());
		});
	});
}