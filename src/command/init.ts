import { Command } from 'commander';
import { CommonCommandOptions } from '~/common';
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

const action = async (options: CommandOptions & CommonCommandOptions) => {
    if (options.global) {
        try {
             await access(HOME_DIR_PATH);
        }
        catch {
            await mkdir(HOME_DIR_PATH);
            await writeFile(FAVOURITES_FILE_PATH, '[]');
            await writeFile(PATH_TO_GLOBAL_ENV, '');
        }
    }

    try {
        await access(PATH_TO_CONFIG_FILE);
    }
    catch {
        await writeFile(PATH_TO_CONFIG_FILE, '');
        await writeFile(PATH_TO_LOCAL_ENV, '');
    }

    const pathToGitIgnore = join(process.cwd(), '.gitignore');
    try {
        await access(pathToGitIgnore);
        await appendFile(pathToGitIgnore, `\n${ENV_FILE_NAME}\n`);
    }
    catch {
        await writeFile(pathToGitIgnore, `${ENV_FILE_NAME}\n`);
    }
};

export const initCmd = new Command('init')
    .alias('i')
    .option('-g, --global [boolean]', 'init also global config which will be shared across all projects')
    .action(action);