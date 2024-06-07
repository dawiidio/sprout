import { Command } from 'commander';
import { asyncExec, CommonCommandOptions, getCurrentBranchName, splitBranchName } from '~/common';
import input from '@inquirer/input';
import { ADD_BEFORE_COMMIT } from '~/config';

interface CommandOptions extends CommonCommandOptions {
    push: boolean;
}

const action = async (options: CommandOptions) => {
    const currentBranchName = await getCurrentBranchName();

    const {
        changeType,
    } = splitBranchName(currentBranchName);

    const messagePrefix = `${changeType}: `;

    const message = await input({
        message: 'Commit message',
        transformer: (val) => `${messagePrefix}${val}`,
    });

    if (ADD_BEFORE_COMMIT) {
        await asyncExec('git add .');
    }

    await asyncExec(`git commit -m "${messagePrefix + message.replace('"', '\"')}"`);

    if (options.push) {
        console.log((await asyncExec(`git push origin ${currentBranchName}`)).stdout);
    }
};

export const commitCmd = new Command('commit')
    .alias('c')
    .option('-p, --push [boolean]', 'push to remote', false)
    .action(action);
