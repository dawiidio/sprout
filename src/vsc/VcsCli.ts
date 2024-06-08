import type { Prompt } from '../llm/Prompt';
import type { GenericTask } from '../project/ProjectCli';
import { ChangeType } from '../common';

export interface VcsBranchData {
    changeType: ChangeType
    issueId: string
    desc: string
}

export interface VcsCliOptions {
    mainBranchName: string;
    addBeforeCommit: boolean;
    updateMainBeforeCheckout: boolean;
    pushAfterCommit: boolean;
    useLlmToSummarizeChanges: boolean;
}

export interface VcsCli {
    options: VcsCliOptions;

    commit(message: string): Promise<void>;
    checkout(branch: string): Promise<void>;
    push(): Promise<string|void>;
    add(): Promise<string|void>;
    summarizeCurrentChanges(): Promise<string>;
    getCurrentBranchName(): Promise<string>;
    isMainBranch(): Promise<boolean>;
    isIssueBranch(): Promise<boolean>;
    checkoutToMainBranch(): Promise<string>;
    getBranchNamePrompt(task: GenericTask, changeType: ChangeType): Prompt<any>;
    testBranchName(branchName: string): boolean;
    updateMainBranch(): Promise<void>;
    getBranchData(branchName: string): VcsBranchData;
    getChangesDescriptionPrompt(): Promise<Prompt<any>>;
    validateCommitMessage(message: string): boolean;
    formatCommitMessage(changeType: ChangeType, message: string): string;
}