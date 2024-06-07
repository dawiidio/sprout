import { VcsCli } from '../../../vsc/VcsCli';
import { asyncExec, ChangeType } from '../../../common';
import process from 'process';
import { GenericTask } from '../../../project/ProjectCli';
import { GitIssueBranch } from '../../../vsc/impl/git/GitIssueBranch';
import { IssueToBranchNamePrompt } from '../../../vsc/impl/git/prompts/IssueToBranchNamePrompt';

export interface GitCliOptions {
    mainBranchName: string;
    addBeforeCommit: boolean;
    updateMainBeforeCheckout: boolean;
    pushAfterCommit: boolean;
}

export const DEFAULT_GIT_CLI_OPTIONS: GitCliOptions = {
    mainBranchName: 'main',
    addBeforeCommit: true,
    updateMainBeforeCheckout: true,
    pushAfterCommit: true,
};

export class GitCli implements VcsCli {
    readonly options: GitCliOptions;

    constructor(options: Partial<GitCliOptions> = {}) {
        this.options = {
            ...DEFAULT_GIT_CLI_OPTIONS,
            ...options,
        };
    }

    async saveChanges(message: string) {

    }

    async checkout(branchName: string) {

    }

    async push() {

    }

    async summarizeCurrentChanges(): Promise<string> {
        return '';
    }

    getBranchNamePrompt(task: GenericTask, changeType: ChangeType): IssueToBranchNamePrompt {
        return new IssueToBranchNamePrompt({
            task: JSON.stringify(task, null, 2),
            branchNamingRules: GitIssueBranch.toDescription(),
            changeType
        });
    }

    async getCurrentBranchName() {
        return (await asyncExec(`git branch --show-current`, {
            cwd: process.cwd(),
        })).stdout.trim();
    }

    async isMainBranch() {
        return (await this.getCurrentBranchName()) === this.options.mainBranchName;
    }

    async checkoutToMainBranch() {
        await asyncExec(`git checkout ${this.options.mainBranchName}`, {
            cwd: process.cwd(),
        });

        return this.options.mainBranchName;
    };

    testBranchName(branchName: string): boolean {
        try {
            GitIssueBranch.fromString(branchName);
            return true;
        }
        catch {
            return false;
        }
    }

    async updateMainBranch() {
        if (await this.isMainBranch()) {
            await asyncExec(`git pull origin ${this.options.mainBranchName}`);
        }
    }
}