import { promisify } from 'node:util';
import { exec } from 'node:child_process';
import process from 'process';
import dotenv from 'dotenv';
import { ILoggerConfigString, Logger, LogLevel } from '@dawiidio/tools/lib/node/Logger/Logger';
import { Prompt } from './llm/Prompt';
import { ValidationError } from 'yup';
import { Descriptable } from './llm/Descriptable';
import { format } from 'date-fns';
import { PATH_TO_GLOBAL_ENV, PATH_TO_LOCAL_ENV } from './consts';

export type ChangeType = 'feat' | 'fix' | 'chore' | 'refactor' | 'style' | 'test' | 'docs'

export const CHANGE_TYPES: ChangeType[] = ['feat', 'fix', 'chore', 'refactor', 'style', 'test', 'docs'];

export const CHANGE_TYPES_DESCRIPTION: Record<ChangeType, string> = {
    feat: 'a new feature',
    fix: 'a bug fix',
    chore: 'changes to the build process or auxiliary tools',
    refactor: 'code change that neither fixes a bug or introduces a new feature',
    style: 'formatting changes, code style',
    test: 'tests related',
    docs: 'documentation related',
}

export const CHANGE_TYPE_OPTIONS = Object.entries(CHANGE_TYPES_DESCRIPTION).map(([value, description]) => ({
    value: value as ChangeType,
    description,
}));

export const asyncExec = promisify(exec);

export const isCliInDevMode = () => process.env.SPROUT_DEV === 'true';

const local = isCliInDevMode() ? ['.env.local', '.env'] : [];

export class Env {
    private static loaded = false;

    static getEnv<T extends string>(): typeof process.env & Record<T, string | undefined> {
        if (!this.loaded)
            this.loadEnv();

        return process.env as typeof process.env & Record<T, string | undefined>;
    }

    static loadEnv() {
        if (this.loaded)
            return;

        this.loaded = true;

        dotenv.config({
            path: [
                ...local,
                PATH_TO_LOCAL_ENV,
                PATH_TO_GLOBAL_ENV
            ],
        });
    }
}

class EnhancedLogger extends Logger {

    error(...args: any[]) {
        this.log(this.stringifyArgs(args), {
            logLevel: LogLevel.error,
        });
    }

    debug(...args: any[]) {
        this.log(this.stringifyArgs(args));
    }

    warn(...args: any[]) {
        this.log(this.stringifyArgs(args), {
            logLevel: LogLevel.warn,
        });
    }

    info(...args: any[]) {
        this.log(this.stringifyArgs(args), {
            logLevel: LogLevel.info,
        });
    }

    private stringifyArgs(args: any[]): string {
        return args.map((val) => JSON.stringify(val).replaceAll('"', '')).join(' ');
    }
}

export const logger = new EnhancedLogger();

export interface CommonCommandOptions {
    logLevel: ILoggerConfigString;
    dryRun: boolean;
}

export class CommandOptionsStorage {
    static dryRun = false;
}

export const promptInstanceCheck = (value: any) => {
    if (!(value instanceof Prompt)) {
        throw new ValidationError('Value must be an instance of Prompt');
    }
    return true;
};

export interface DescriptableDateOptions {
    value: Date
    format: string
}

const DEFAULT_DESCRIPTABLE_DATE_OPTIONS: DescriptableDateOptions = {
    value: new Date(),
    format: 'YYYY-MM-DD',
}

export class DescriptableDate implements Descriptable {
    value: Date;
    format: string;

    constructor(options: Partial<DescriptableDateOptions> = {}) {
        this.value = options.value ?? DEFAULT_DESCRIPTABLE_DATE_OPTIONS.value;
        this.format = options.format ?? DEFAULT_DESCRIPTABLE_DATE_OPTIONS.format;
    }

    toDescription(): string {
        return `Date is in format ${this.format} and is equal to ${format(this.value, this.format)}`;
    }

    toString() {
        return format(this.value, this.format);
    }
}

export const runWithIndicator = async <T>(message: string, successMsg: string, action: (() => Promise<T>)) => {
    const { default: ora } = await import('ora');

    const indicator = ora(message).start();

    const results = await action();

    indicator.succeed(successMsg);

    return results;
}