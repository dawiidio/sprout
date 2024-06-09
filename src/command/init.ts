import { Command } from 'commander';
import { asyncExec, CommonCommandOptions, runWithIndicator } from '~/common';
import { access, appendFile, mkdir, writeFile } from 'node:fs/promises';
import {
    ENV_FILE_NAME,
    FAVOURITES_FILE_PATH,
    HOME_DIR_PATH,
    PATH_TO_CONFIG_FILE,
    PATH_TO_LOCAL_ENV,
    SAMPLE_CONFIG, SAMPLE_ENV,
} from '~/consts';
import process from 'process';
import { join } from 'path';

const action = async (options: CommonCommandOptions) => {
    if (options.dryRun) {
        throw new Error(`Dry run is not supported for init command`);
    }

    await runWithIndicator('Installing sprout locally', 'Sprout installed', async () => {
        await asyncExec('npm i -d @dawiidio/sprout');
    });

    try {
        await access(HOME_DIR_PATH);
    } catch {
        await runWithIndicator('Creating sprout home', `Sprout home dir created at ${HOME_DIR_PATH}`, async () => {
            await mkdir(HOME_DIR_PATH);
            await writeFile(FAVOURITES_FILE_PATH, '[]');
        });
    }

    await runWithIndicator('Creating local sprout config', 'Sprout local config created', async () => {
        try {
            await access(PATH_TO_CONFIG_FILE);
        } catch {
            await writeFile(PATH_TO_CONFIG_FILE, SAMPLE_CONFIG);
        }
    });

    await runWithIndicator('Creating local env file', 'Sprout local env file created', async () => {
        try {
            await access(PATH_TO_LOCAL_ENV);
        } catch {
            await writeFile(PATH_TO_LOCAL_ENV, SAMPLE_ENV);
        }
    });

    await runWithIndicator('Updating .gitignore', 'Gitignore updated', async () => {
        const pathToGitIgnore = join(process.cwd(), '.gitignore');
        try {
            await access(pathToGitIgnore);
            await appendFile(pathToGitIgnore, `\n${ENV_FILE_NAME}\n`);
        } catch {
            await writeFile(pathToGitIgnore, `${ENV_FILE_NAME}\n`);
        }
    });

    console.log('Sprout initialized! 🌱');
};

export const initCmd = new Command('init')
    .alias('i')
    .action(action);