import type { Prompt } from '../llm/Prompt';
import type { GenericTask } from '../project/ProjectCli';
import { ChangeType } from '../common';

export interface VcsCli {
    commit(message: string): Promise<void>;
    checkout(branch: string): Promise<void>;
    push(): Promise<void>;
    summarizeCurrentChanges(): Promise<string>;
    getCurrentBranchName(): Promise<string>;
    isMainBranch(): Promise<boolean>;
    checkoutToMainBranch(): Promise<string>;
    getBranchNamePrompt(task: GenericTask, changeType: ChangeType): Prompt<any>;
    testBranchName(branchName: string): boolean;
    updateMainBranch(): Promise<void>;
}