import { VcsCli, VcsCliPrompts } from '../../../vsc/VcsCli';
import { Prompt } from '../../../llm/Prompt';
import { asyncExec, ChangeType } from '../../../common';
import process from 'process';
import { GenericTask } from '../../../project/ProjectCli';
import { GitIssueBranch } from '../../../vsc/impl/git/GitIssueBranch';

export const DEFAULT_GIT_PROMPTS: VcsCliPrompts = {
    taskToBranchName: new Prompt(`
        Your job is to create a branch name based on provided data.
        The task data is represented by the following JSON object:
        {{ task }}
        The change type is: {{ changeType }}.
        The branch naming rules are:
        {{ branchNamingRules }}
        
        You need to propose a branch name that will be used to create a new branch. Return only the branch name, no more text or explanation. 
    `),
};

export interface GitCliOptions {
    mainBranchName: string;
    addBeforeCommit: boolean;
    updateMainBeforeCheckout: boolean;
    pushAfterCommit: boolean;
    prompts: VcsCliPrompts;
}

export const DEFAULT_GIT_CLI_OPTIONS: GitCliOptions = {
    mainBranchName: 'main',
    addBeforeCommit: true,
    updateMainBeforeCheckout: true,
    pushAfterCommit: true,
    prompts: DEFAULT_GIT_PROMPTS,
};

export class GitCli implements VcsCli {
    readonly options: GitCliOptions;
    readonly prompts: VcsCliPrompts;

    constructor(options: Partial<GitCliOptions> = {}) {
        this.options = {
            ...DEFAULT_GIT_CLI_OPTIONS,
            ...options,
        };

        this.prompts = this.options.prompts;
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

    getBranchNamePromptContent(task: GenericTask, changeType: ChangeType): string {
        return this.prompts.taskToBranchName.getPromptText({
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