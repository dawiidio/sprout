import { Prompt } from '../../../../llm/Prompt';
import { ChangeType } from '../../../../common';

export interface IssueToBranchNamePromptVariables {
    task: string;
    branchNamingRules: string;
    changeType: ChangeType;
}

export class IssueToBranchNamePrompt extends Prompt<IssueToBranchNamePromptVariables> {
    readonly prompt = `
Your job is to create a branch name based on provided data.
The task data is represented by the following JSON object:
{{ task }}
The change type is: {{ changeType }}.
The branch naming rules are:
{{ branchNamingRules }}

Description part should be always in lower case.
Branch name should not be longer than 100 characters.
You need to propose a branch name that will be used to create a new branch. Return only the branch name, no more text or explanation.
 `;
}