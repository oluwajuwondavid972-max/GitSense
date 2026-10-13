
import { execFile } from 'child_process';

export function runGitCommand(
  args: string,
  cwd: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const parts = args.match(/"[^"]*"|'[^']*'|\S+/g) ?? [];

    const gitArgs = parts.map((part) =>
      part.replace(/^["']|["']$/g, '')
    );

    execFile('git', gitArgs, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr.trim() || error.message));
        return;
      }

      resolve(stdout.trim());
    });
  });
}