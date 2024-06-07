import type { Prompt } from '../llm/Prompt';
import type { GenericTask } from '../project/ProjectCli';
import { ChangeType } from '../common';

export interface VcsCliPrompts {
    [key: string]: Prompt<any>
    taskToBranchName: Prompt<{ task: string, branchNamingRules: string, changeType: ChangeType }>;
}

export interface VcsCli {
    prompts: VcsCliPrompts

    saveChanges(message: string): Promise<void>;
    checkout(branch: string): Promise<void>;
    push(): Promise<void>;
    summarizeCurrentChanges(): Promise<string>;
    getCurrentBranchName(): Promise<string>;
    isMainBranch(): Promise<boolean>;
    checkoutToMainBranch(): Promise<string>;
    getBranchNamePromptContent(task: GenericTask, changeType: ChangeType): string;
    testBranchName(branchName: string): boolean;
    updateMainBranch(): Promise<void>;
}