import select from '@inquirer/select';
import input from '@inquirer/input';
import { Command } from 'commander';
import { AppConfig } from '~/config';
import {
    CHANGE_TYPE_OPTIONS,
    ChangeType,
    CommandOptionsStorage,
    runWithIndicator,
    useCancelablePrompt,
} from '~/common';
import { GenericTask } from '~/project/ProjectCli';
import { FavouriteQuery, FavouriteQueryStorage } from '~/favourite/FavouriteQueryStorage';

interface PlatformQueryLoopResponse {
    query: string;
    save: boolean;
}

const enterPlatformQueryLoop = async (query: string, editLoop = false): Promise<PlatformQueryLoopResponse> => {
    if (editLoop) {
        query = await useCancelablePrompt(input({
            message: 'Edit query [press tab to edit]',
            default: query,
        }));
    }

    const queryResponse = await useCancelablePrompt(select<'ok' | 'edit' | 'abort' | 'saveAndOk'>({
        message: `Current query: ${query}`,
        choices: [
            {
                name: 'Ok',
                value: 'ok',
            },
            {
                name: 'Save in favourites and proceed',
                value: 'saveAndOk',
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
    }));

    switch (queryResponse) {
        case 'abort':
            throw new Error('Aborted');
        case 'edit':
            return await enterPlatformQueryLoop(query, true);
        case 'ok':
            return {
                query,
                save: false,
            };
        case 'saveAndOk':
            return {
                query,
                save: true,
            };
    }
};

const fetchTasksByQueryAndShowIndicator = async (query: string): Promise<GenericTask[]> => {
    const { default: ora } = await import('ora');

    const tasksSpinner = ora('Fetching tasks').start();
    const tasks = await AppConfig.config.projectCli.fetchTasksByQuery(query);
    tasksSpinner.succeed('Tasks fetched!');

    return tasks;
}

const enterNaturalLanguageQueryLoop = async (query?: QueryData): Promise<QueryData> => {
    const { default: ora } = await import('ora');

    const naturalLanguageQuery = await useCancelablePrompt(input({
        message: `Describe what issues you want to work on ${query ? '[press tab to edit]' : ''}`,
        default: query?.naturalLanguage,
    }));
    const llmSpinner = ora('Generating query').start();
    const platformQuery = await AppConfig.runPrompt(
        AppConfig.config.projectCli.getPlatformQueryPrompt(naturalLanguageQuery),
    );
    llmSpinner.succeed('Query generated!');

    const {
        query: refinedPlatformQuery,
        save: saveInFavourites,
    } = await enterPlatformQueryLoop(platformQuery);

    if (saveInFavourites) {
        await FavouriteQueryStorage.saveFavourite({
            naturalLanguage: naturalLanguageQuery,
            platformQuery: refinedPlatformQuery,
            platformType: AppConfig.config.projectCli.type,
        });
        ora().succeed('Query saved in favourites!');
    }

    return {
        query: refinedPlatformQuery,
        naturalLanguage: naturalLanguageQuery,
    };
};

interface QueryData {
    query: string;
    naturalLanguage: string;
}

const enterQuerySelection = async (queryData?: QueryData): Promise<GenericTask> => {
    const { default: chalk } = await import('chalk');
    let newQueryOrFavourite: 'new' | 'favourite' = 'new';

    if (!queryData) {
        newQueryOrFavourite = ((await useCancelablePrompt(select<'new' | 'favourite'>({
            message: 'Select action',
            choices: [
                {
                    name: '🌱 Create new query',
                    value: 'new',
                },
                {
                    name: '♥️ Select from favourites',
                    value: 'favourite',
                },
            ],
        }))));
    }

    if (newQueryOrFavourite === 'favourite') {
        const favourites = FavouriteQueryStorage.getFavouritesForPlatform(AppConfig.config.projectCli.type);

        if (!favourites.length) {
            console.log(chalk.yellow('No favourites found 💔, creating new query'));
            queryData = await enterNaturalLanguageQueryLoop();
        } else {
            const selectedFavouriteOrAction = await useCancelablePrompt(select<FavouriteQuery | 'abort'>({
                message: 'Select query',
                choices: [
                    ...favourites
                        .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
                        .map(favourite => ({
                            name: favourite.naturalLanguage,
                            value: favourite,
                        })),
                    {
                        name: 'Abort',
                        value: 'abort',
                    }
                ],
            }));

            if (selectedFavouriteOrAction === 'abort') {
                return enterQuerySelection();
            }

            await FavouriteQueryStorage.updateUsage(selectedFavouriteOrAction);

            queryData = {
                query: selectedFavouriteOrAction.platformQuery,
                naturalLanguage: selectedFavouriteOrAction.naturalLanguage,
            };
        }
    }
    else {
        queryData = await enterNaturalLanguageQueryLoop(queryData);
    }

    const tasks = await fetchTasksByQueryAndShowIndicator(queryData?.query);

    const taskOrAction = ((await useCancelablePrompt(select<GenericTask | 'edit' | 'abort'>({
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
        loop: true,
    }))));

    switch (taskOrAction) {
        case 'edit':
            return await enterQuerySelection(queryData);
        case 'abort':
            throw new Error('Aborted');
        default:
            return taskOrAction;
    }
}

const enterBranchNameLoop = async (generatedBranchName: string, errored?: boolean): Promise<string> => {
    const branchName = await useCancelablePrompt(input({
        message: errored ? `Fix branch name` : `Branch name looks okay? [press tab to edit]`,
        default: generatedBranchName,
        validate: (value) => AppConfig.config.vcsCli.testBranchName(value) || true,
    }));

    return branchName;
};

async function action(issueId?: string, options?: { update: boolean }) {
    await AppConfig.load();
    await FavouriteQueryStorage.load();

    const currentBranchName = await AppConfig.config.vcsCli.getCurrentBranchName();
    const { mainBranchName, updateMainBeforeCheckout } = AppConfig.config.vcsCli.options;

    if (await AppConfig.config.vcsCli.isIssueBranch()) {
        const nextStep = await useCancelablePrompt(select<'fromCurrent' | 'fromMaster' | 'abort'>({
            message: `You are currently on issue branch ${currentBranchName} - choose what to do next`,
            choices: [
                {
                    name: `Checkout and create new branch from ${mainBranchName}`,
                    value: 'fromMaster',
                },
                {
                    name: 'Create new branch from current one',
                    value: 'fromCurrent',
                },
                {
                    name: 'Abort',
                    value: 'abort',
                },
            ],
        }));

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
        task = await enterQuerySelection();
    } else {
        const tempTask = await AppConfig.config.projectCli.fetchTaskById(issueId);

        if (!tempTask) {
            console.log(`Task with id ${issueId} not found`);
            return;
        }

        task = tempTask;
    }

    const changeType = await useCancelablePrompt(select<ChangeType>({
        message: 'Select change type',
        choices: CHANGE_TYPE_OPTIONS,
    }));

    const generatedBranchName = await runWithIndicator('Generating branch name', 'Branch name generated', async () => {
        return AppConfig.runPrompt(
            AppConfig.config.vcsCli.getBranchNamePrompt(task, changeType),
        );
    });

    const branchName = await enterBranchNameLoop(generatedBranchName);

    if (CommandOptionsStorage.dryRun)
        return;

    if (await AppConfig.config.vcsCli.isMainBranch() && (options?.update || updateMainBeforeCheckout)) {
        await runWithIndicator('Updating main branch', 'Main branch updated', async () => {
            await AppConfig.config.vcsCli.updateMainBranch();
        });
    }

    await AppConfig.config.vcsCli.checkout(branchName);
}

export const openCmd = new Command('open')
    .alias('o')
    .option('-u, --update', 'update main branch before checkout', false)
    .argument('[string]', 'issue key, eg: AB-1024')
    .action(action);
