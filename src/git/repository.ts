import * as vscode from 'vscode';
import * as path from 'path';
import { runGitCommand } from './git';

export async function findRepository(): Promise<string | null> {
	const workspaceFolders = vscode.workspace.workspaceFolders;

	if (!workspaceFolders || workspaceFolders.length === 0) {
		return null;
	}

	const workspacePath = workspaceFolders[0].uri.fsPath;

	try {
		const repositoryRoot = await runGitCommand(
			'rev-parse --show-toplevel',
			workspacePath
		);

		return path.normalize(repositoryRoot);
	} catch {
		return null;
	}
}