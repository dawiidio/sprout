import { Command } from 'commander';
import { asyncExec, CommonCommandOptions, runWithIndicator } from '~/common';
import { writeFile, mkdir, access, appendFile } from 'node:fs/promises';
import {
    ENV_FILE_NAME,
    FAVOURITES_FILE_PATH,
    HOME_DIR_PATH,
    PATH_TO_CONFIG_FILE,
    PATH_TO_GLOBAL_ENV,
    PATH_TO_LOCAL_ENV,
} from '~/consts';
import process from 'process';
import { join } from 'path';

interface CommandOptions {
    global: boolean;
}

const SAMPLE_CONFIG = `
import { 
    SproutConfigFunction, 
    JiraCli,
    Ollama,
    GitCli,
    GenericTaskRenderer,
    OpenAi,
} from '@dawiidio/sprout';

export const getConfig: SproutConfigFunction = async () => {
    return {
        projectCli: new JiraCli(),
        llmCli: {
            code: new Ollama('dolphincoder:15b-starcoder2-q5_K_M'),
            text: new OpenAi({}, {
                model: 'gpt-4',
                max_tokens: 100,
            }),
        },
        vcsCli: new GitCli(),
        taskRenderer: new GenericTaskRenderer(),
    }
}
`;

const SAMPLE_ENV = `JIRA_API_KEY=jira-api-key
JIRA_EMAIL=your@email.com
JIRA_DEFAULT_PROJECT_KEY=ABC
JIRA_URL=https://your-domain.atlassian.net
OPENAI_API_KEY=sk-api-key
`;

const action = async (options: CommandOptions & CommonCommandOptions) => {
    await runWithIndicator('Installing sprout locally', 'Sprout installed', async () => {
        await asyncExec('npm i -d @dawiidio/sprout');
    });

    if (options.global) {
        await runWithIndicator('Creating sprout home', `Sprout home dir created at ${HOME_DIR_PATH}`, async () => {
            try {
                await access(HOME_DIR_PATH);
            }
            catch {
                await mkdir(HOME_DIR_PATH);
                await writeFile(FAVOURITES_FILE_PATH, '[]');
                await writeFile(PATH_TO_GLOBAL_ENV, SAMPLE_ENV);
            }
        });
    }

    await runWithIndicator('Creating local sprout config', 'Sprout local config created', async () => {
        try {
            await access(PATH_TO_CONFIG_FILE);
        }
        catch {
            await writeFile(PATH_TO_CONFIG_FILE, SAMPLE_CONFIG);
            await writeFile(PATH_TO_LOCAL_ENV, SAMPLE_ENV);
        }
    });

    await runWithIndicator('Updating .gitignore', 'Gitignore updated', async () => {
        const pathToGitIgnore = join(process.cwd(), '.gitignore');
        try {
            await access(pathToGitIgnore);
            await appendFile(pathToGitIgnore, `\n${ENV_FILE_NAME}\n`);
        }
        catch {
            await writeFile(pathToGitIgnore, `${ENV_FILE_NAME}\n`);
        }
    });

    console.log('Sprout initialized! 🌱');
};

export const initCmd = new Command('init')
    .alias('i')
    .option('-g, --global [boolean]', 'init also global config which will be shared across all projects')
    .action(action);