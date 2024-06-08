import { VcsCli, VcsCliOptions } from '../../../vsc/VcsCli';
import { asyncExec, CHANGE_TYPES, ChangeType } from '../../../common';
import process from 'process';
import { GenericTask } from '../../../project/ProjectCli';
import { GitIssueBranch } from '../../../vsc/impl/git/GitIssueBranch';
import { IssueToBranchNamePrompt } from '../../../vsc/impl/git/prompts/IssueToBranchNamePrompt';
import { DiffToCommitMessage } from './prompts/DiffToCommitMessage';

export const DEFAULT_GIT_CLI_OPTIONS: VcsCliOptions = {
    mainBranchName: 'main',
    addBeforeCommit: true,
    updateMainBeforeCheckout: true,
    pushAfterCommit: true,
    useLlmToSummarizeChanges: true,
};

export class GitCli implements VcsCli {
    readonly options: VcsCliOptions;

    constructor(options: Partial<VcsCliOptions> = {}) {
        this.options = {
            ...DEFAULT_GIT_CLI_OPTIONS,
            ...options,
        };
    }

    async commit(message: string) {
        await asyncExec(`git commit -m "${message.replace('"', '\"')}}"`);
    }

    async checkout(branchName: string) {
        await asyncExec(`git checkout -b ${branchName}`);
    }

    async push() {
        return  (await asyncExec(`git push origin ${await this.getCurrentBranchName()}`)).stdout;
    }

    async add() {
        await asyncExec('git add .');
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

    async getChangesDescriptionPrompt(): Promise<DiffToCommitMessage> {
        return new DiffToCommitMessage({
            diff: (await asyncExec('git diff')).stdout,
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

    getBranchData(branchName: string) {
        return GitIssueBranch.fromString(branchName);
    }

    validateCommitMessage(message: string): boolean {
        const regex = new RegExp(`^(${CHANGE_TYPES.join('|')}): .+`, 'gm');
        return regex.test(message);
    }

    formatCommitMessage(changeType: ChangeType, message: string): string {
        return `${changeType}: ${message}`;
    }

    async isIssueBranch() {
        return this.testBranchName(await this.getCurrentBranchName());
    }
}