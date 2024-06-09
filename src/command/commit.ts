import { Command } from 'commander';
import {
    CHANGE_TYPE_OPTIONS,
    ChangeType,
    CommandOptionsStorage,
    CommonCommandOptions,
    runWithIndicator, useCancelablePrompt,
} from '~/common';
import input from '@inquirer/input';
import { AppConfig } from '~/config';
import select from '@inquirer/select';
import { FavouriteQueryStorage } from '~/favourite/FavouriteQueryStorage';

interface CommandOptions extends CommonCommandOptions {
    push: boolean;
}

const enterCommitMessageLoop = async (message: string, changeType: ChangeType, errored?: boolean): Promise<string> => {
    const {default: chalk} = await import('chalk');
    const {
        vcsCli,
    } = AppConfig.config;

    const commitMessage = await useCancelablePrompt(input({
        message: `(${errored ? chalk.red('Fix commit message') : 'Commit message'}) [press tab to edit]`,
        transformer: (val) => vcsCli.formatCommitMessage(changeType, val),
        default: message,
    }));

    const commitMessageWithChangeType = vcsCli.formatCommitMessage(changeType, commitMessage);

    if (vcsCli.validateCommitMessage(commitMessageWithChangeType))
        return commitMessageWithChangeType;
    else
        return enterCommitMessageLoop(commitMessage, changeType, true);
};

const action = async (options: CommandOptions) => {
    await AppConfig.load();
    await FavouriteQueryStorage.load();

    const {
        vcsCli,
    } = AppConfig.config;

    const changeType = await useCancelablePrompt(select<ChangeType>({
        message: 'Select change type',
        choices: CHANGE_TYPE_OPTIONS,
    }));

    let changesDescription = '';

    if (vcsCli.options.useLlmToSummarizeChanges) {
        changesDescription = await runWithIndicator('Summarizing changes', 'Changes summarized', async () => {
            const cmmp = await vcsCli.getChangesDescriptionPrompt();
            return AppConfig.runPrompt(cmmp);
        });
    }

    const commitMessage = await enterCommitMessageLoop(changesDescription, changeType);

    if (vcsCli.options.addBeforeCommit) {
        await runWithIndicator('Adding changes', 'Changes added', async () => {
            if (CommandOptionsStorage.dryRun)
                return;

            await vcsCli.add();
        });
    }

    await runWithIndicator('Commiting changes', 'Changes commited', async () => {
        if (CommandOptionsStorage.dryRun)
            return;

        await vcsCli.commit(commitMessage);
    });

    if (options.push) {
        const pushMessage = await runWithIndicator('Pushing changes', 'Changes pushed', async () => {
            if (CommandOptionsStorage.dryRun)
                return;

            await vcsCli.push()
        });

        console.log(pushMessage);
    }
};

export const commitCmd = new Command('commit')
    .alias('c')
    .option('-p, --push [boolean]', 'push to remote', false)
    .action(action);
