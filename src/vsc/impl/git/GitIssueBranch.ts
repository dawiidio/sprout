import { CHANGE_TYPES, ChangeType } from '../../../common';
import { type VcsBranchData } from '../../VcsCli';

export class GitIssueBranch implements VcsBranchData {

    constructor(
        public changeType: ChangeType,
        public issueId: string,
        public desc: string
    ) {
    }

    toString() {
        return `${this.changeType}/${this.issueId}_${this.desc}`;
    }

    static branchRegexp: RegExp = new RegExp(`(?<changeType>${CHANGE_TYPES.join('|')})\/(?<issueId>[\w+\-\d+]+)_(?<desc>[\\w\d\\-_]+)`, 'gm');

    static fromString(branchName: string) {
        const val = branchName.matchAll(this.branchRegexp).next();

        if (!val.value)
            throw new Error(`Wrong branch format`);

        const {
            issueId, desc, changeType
        } =  val.value.groups as VcsBranchData;

        return new GitIssueBranch(changeType, issueId, desc);
    }

    static toDescription(): string {
        return `Branch name consists of three parts: changeType, issueId (issue id can be in the format of numbers, or if there is a project key present, it should be in the format of KEY-issueId) and desc. Name must satisfy the following pattern expressed in JavaScript regex: (?<changeType>${CHANGE_TYPES.join('|')})\/(?<issueId>[\w+\-\d+])_(?<desc>[\\w\d\\-_]+). Here is example of branch name: feat/XYZ-1234_some-feature-desc`;
    }
}