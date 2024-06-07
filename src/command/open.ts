import select from '@inquirer/select';
import input from '@inquirer/input';
import { Command } from 'commander';
import { AppConfig } from '~/config';
import { CHANGE_TYPE_OPTIONS, ChangeType, isIssueBranch } from '~/common';
import { GenericTask } from '~/project/ProjectCli';

const enterPlatformQueryLoop = async (query: string, editLoop = false): Promise<string> => {
    if (editLoop) {
        query = await input({
            message: 'Edit query [click tab to edit]',
            default: query,
        })
    }

    const queryResponse = await select<'ok' | 'edit' | 'abort'>({
        message: `Current query: ${query}`,
        choices: [
            {
                name: 'Ok',
                value: 'ok',
            },
            {
                name: 'Edit',
                value: 'edit',
            },
            {
                name: 'Abort',
                value: 'abort',
            },
        ],
    });

    switch (queryResponse) {
        case 'abort':
            throw new Error('Aborted');
        case 'edit':
            return await enterPlatformQueryLoop(query, true);
        case 'ok':
            return query;
    }
};

const enterNaturalLanguageQueryLoop = async (query?: string): Promise<GenericTask> => {
    const { default: ora } = await import('ora');

    const naturalLanguageQuery = await input({
        message: `Describe what issues you want to work on ${query ? '[click tab to edit]' : ''}`,
        default: query,
    });
    const llmSpinner = ora('Generating query').start();
    const platformQuery = await AppConfig.runPrompt(
        AppConfig.config.projectCli.getPlatformQueryPrompt(naturalLanguageQuery)
    );
    llmSpinner.succeed('Query generated!');

    const refinedPlatformQuery = await enterPlatformQueryLoop(platformQuery);
    const tasksSpinner = ora('Fetching tasks').start();
    const tasks = await AppConfig.config.projectCli.fetchTasksByQuery(refinedPlatformQuery);
    tasksSpinner.succeed('Tasks fetched!');

    const taskOrAction = ((await select<GenericTask | 'edit' | 'abort'>({
        message: 'Select issue',
        choices: [
            ...AppConfig.config.taskRenderer.renderTasks(tasks),
            {
                name: 'Edit query',
                value: 'edit',
            },
            {
                name: 'Abort',
                value: 'abort',
            },
        ],
        loop: false,
    })));

    switch (taskOrAction) {
        case 'edit':
            return await enterNaturalLanguageQueryLoop(naturalLanguageQuery);
        case 'abort':
            throw new Error('Aborted');
        default:
            return taskOrAction;
    }
}

const enterBranchNameLoop = async (generatedBranchName: string, errored?: boolean): Promise<string> => {
    const branchName = await input({
        message: errored ? `Fix branch name` : `Branch name looks okay? [click tab to edit]`,
        default: generatedBranchName,
    });

    if (!AppConfig.config.vcsCli.testBranchName(branchName)) {
        return enterBranchNameLoop(branchName, true);
    }

    return branchName;
}

async function action(issueId?: string, options?: { update: boolean }) {
    const { default: ora } = await import('ora');

    const currentBranchName = await AppConfig.config.vcsCli.getCurrentBranchName();

    if (isIssueBranch(currentBranchName)) {
        const nextStep = await select<'fromCurrent' | 'fromMaster' | 'abort'>({
            message: `You are currently on issue branch ${currentBranchName} - choose what to do next`,
            choices: [
                {
                    name: 'Create branch from master',
                    value: 'fromMaster',
                },
                {
                    name: 'Create branch from current',
                    value: 'fromCurrent',
                },
                {
                    name: 'Abort',
                    value: 'abort',
                },
            ],
        });

        switch (nextStep) {
            case 'fromMaster': {
                await AppConfig.config.vcsCli.checkoutToMainBranch();
            }
                break;
            case 'abort':
                return;
            case 'fromCurrent':
            default:
                break;
        }
    }

    let task: GenericTask;

    if (!issueId) {
        task = await enterNaturalLanguageQueryLoop();
    }
    else {
        const tempTask = await AppConfig.config.projectCli.fetchTaskById(issueId);

        if (!tempTask) {
            console.log(`Task with id ${issueId} not found`);
            return;
        }

        task = tempTask;
    }

    const changeType = await select<ChangeType>({
        message: 'Select change type',
        choices: CHANGE_TYPE_OPTIONS,
    });

    const branchNameSpinner = ora('Generating branch name').start();

    const generatedBranchName = await AppConfig.runPrompt(
        AppConfig.config.vcsCli.getBranchNamePrompt(task, changeType)
    );

    branchNameSpinner.succeed('Branch name generated!');

    const branchName = await enterBranchNameLoop(generatedBranchName);

    if (await AppConfig.config.vcsCli.isMainBranch() && options?.update) {
        await AppConfig.config.vcsCli.updateMainBranch();
    }

    await AppConfig.config.vcsCli.checkout(branchName);
}

export const openCmd = new Command('open')
    .alias('o')
    .option('-u, --update', 'update main branch before checkout', false)
    .argument('[string]', 'issue key, eg: AB-1024')
    .action(action);
