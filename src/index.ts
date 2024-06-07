#!/usr/bin/env -S node

import { program } from 'commander';
import { openCmd } from '~/command/open';
import { initCmd } from '~/command/init';
import { commitCmd } from '~/command/commit';
import { AppConfig } from '~/config';
import { CommandOptionsStorage, isCliInDevMode, logger } from '~/common';
import { ILoggerConfigString, Logger } from '@dawiidio/tools/lib/node/Logger/Logger';

async function main() {
    await AppConfig.load();
    const defaultLogLevel: ILoggerConfigString = isCliInDevMode() ? 'debug|error|info|warn' : 'error|warn';
    logger.setLogLevel(Logger.parseLogLevel(defaultLogLevel as ILoggerConfigString))

    program
        .name('jg')
        .description('')
        .option<ILoggerConfigString>('--log-level [logLevel]', 'Log level. Available options: error, warn, info, debug. To display many error levels at once combine them with pipe | sign', (value: string) => {
            logger.setLogLevel(Logger.parseLogLevel(value as ILoggerConfigString))
            return value as ILoggerConfigString;
        }, defaultLogLevel)
        .option<boolean>('--dry-run', 'dry run - do not send requests do project management tool', () => {
            CommandOptionsStorage.dryRun = true;
            logger.info('Dry run enabled');
            return true;
        },  false)
        .addCommand(openCmd)
        .addCommand(initCmd)
        .addCommand(commitCmd);

    program.parse();
}

main();