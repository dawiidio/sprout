import { Command } from 'commander';
import { CommonCommandOptions } from '~/common';
import { writeFile, mkdir } from 'node:fs/promises';
import { FAVOURITES_FILE_PATH, HOME_DIR_PATH } from '~/consts';

interface CommandOptions {

}

const action = async (options: CommandOptions & CommonCommandOptions) => {
    await mkdir(HOME_DIR_PATH);
    await writeFile(FAVOURITES_FILE_PATH, '[]');
};

export const commitCmd = new Command('init')
    .alias('i')
    .action(action);