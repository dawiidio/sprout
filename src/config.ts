import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { symlink, access } from 'node:fs/promises';
import { exec } from 'node:child_process';
import { Config } from './types';
import { Env } from './common';
import { Prompt } from './llm/Prompt';
import process from 'process';

const CONFIG_FILE_NAME = 'sprout.config.ts';
const TMP_DIR = join(tmpdir(), 'sprout-tmp');

export class AppConfig {
    static config: Config;

    static async load() {
        Env.loadEnv();

        const pathToCompiledFile = await compileTs({
            outDir: join(TMP_DIR),
            rootDir: process.cwd(),
            configPath: CONFIG_FILE_NAME,
        });

        try {
            await access(join(process.cwd(), 'node_modules'))
        }
        catch {
            await symlink(join(process.cwd(), 'node_modules'), join(TMP_DIR, 'node_modules'), 'dir');
        }

        const {
            getConfig,
        } = await import(pathToCompiledFile);

        if (typeof getConfig !== 'function') {
            throw new Error('Sprout config file must export getConfig function!');
        }

        this.config = await getConfig();

        return this.config;
    }

    private static ensureConfig(config: Config | undefined = this.config): config is Config {
        if (!config) {
            throw new Error('Config is not loaded');
        }

        return true;
    }

    static getLlmCliForPrompt(prompt: Prompt<any>) {
        this.ensureConfig();

        return this.config.llmCli[prompt.type];
    }
}

interface ICompileTsSettings {
    configPath: string;
    outDir: string;
    rootDir: string;
}

const getCompileCommand = ({ configPath, outDir, rootDir }: ICompileTsSettings): string => {
    return `tsc ${configPath} --outDir ${outDir} --rootDir ${rootDir} --declaration false --module nodenext --skipDefaultLibCheck true`;
};

const compileTs = (compileSettings: ICompileTsSettings): Promise<string> => {
    return new Promise((resolve, reject) => {
        const compileProcess = exec(getCompileCommand(compileSettings), {
            cwd: process.cwd(),
        });

        compileProcess.stderr?.pipe(process.stderr);
        compileProcess.stdout?.pipe(process.stdout);

        compileProcess.on('exit', (val) => {
            compileProcess.stdout?.unpipe(process.stdout);
            compileProcess.stderr?.unpipe(process.stderr);

            const pathToCompiledFile = join(compileSettings.outDir, CONFIG_FILE_NAME.replace('.ts', '.js'));
            resolve(pathToCompiledFile);
        });

        compileProcess.on('error', () => {
            reject();
        });
    });
};

export const {
    JIRA_API_KEY,
    JIRA_EMAIL,
    JIRA_URL,
    JIRA_DEFAULT_PROJECT_KEY,
} = process.env;

export const MAIN_BRANCH_NAME = 'master';
export const ADD_BEFORE_COMMIT = true;
