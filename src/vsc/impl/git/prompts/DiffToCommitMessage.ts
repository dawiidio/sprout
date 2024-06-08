import { Prompt } from '../../../../llm/Prompt';
import { ChangeType } from '../../../../common';

export interface DiffToCommitMessageVariables {
    diff: string;
    commitMaxLength?: number;
}

export class DiffToCommitMessage extends Prompt<DiffToCommitMessageVariables> {
    readonly type = 'code';
    readonly prompt = `
    Your job is to create a commit message based on the provided git diff.
    Do not include the diff in the commit message.
    Do not include any additional text in the commit message.
    Commit message should be no longer than {{commitMaxLength}} characters.
    The git diff is represented by the following text:
    {{ diff }}
    `;

    constructor(variables: DiffToCommitMessageVariables) {
        super({
            commitMaxLength: 100,
            ...variables,
        });
    }


    toString(): string {
        return super.toString();
    }
}