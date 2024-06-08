import { join } from 'node:path';
import { access, cp, mkdir, symlink, writeFile } from 'node:fs/promises';
import { exec } from 'node:child_process';
import { Env, isCliInDevMode } from './common';
import { Prompt, PromptType } from './llm/Prompt';
import process from 'process';
import {
    CONFIG_FILE_NAME,
    PATH_TO_CONFIG_FILE,
    TMP_DIR,
    SPROUT_CONFIG_FILE_TS_CONFIG,
    SPROUT_CONFIG_FILE_PACKAGE_JSON,
} from './consts';
import { type ProjectCli } from './project/ProjectCli';
import { type LLMCli } from './llm/LLMCli';
import { type VcsCli } from './vsc/VcsCli';
import { type TaskRenderer } from './cli/TaskRenderer';

export interface Config {
    projectCli: ProjectCli;
    llmCli: Record<PromptType, LLMCli>;
    vcsCli: VcsCli;
    taskRenderer: TaskRenderer;
}

export class AppConfig {
    static config: Config;

    static async load() {
        Env.loadEnv();

        try {
            await access(TMP_DIR);
        }
        catch {
            await mkdir(TMP_DIR);
        }

        try {
            await access(join(TMP_DIR, 'node_modules'));
        } catch {
            await symlink(join(process.cwd(), 'node_modules'), join(TMP_DIR, 'node_modules'), 'dir');
        }

        const PATH_TO_CONFIG_FILE_IN_TMP = join(TMP_DIR, CONFIG_FILE_NAME);
        await cp(PATH_TO_CONFIG_FILE, PATH_TO_CONFIG_FILE_IN_TMP, {
            force: true,
        });

        if (isCliInDevMode()) {
            try {
                await access(join(TMP_DIR, 'src'));
            } catch {
                await cp(join(process.cwd(), 'src'), join(TMP_DIR, 'src'), {
                    recursive: true,
                });
            }
        }

        try {
            await access(join(TMP_DIR, 'package.json'));
        } catch {
            await writeFile(join(TMP_DIR, 'package.json'), JSON.stringify(SPROUT_CONFIG_FILE_PACKAGE_JSON));
        }

        try {
            await access(join(TMP_DIR, 'tsconfig.json'));
        } catch {
            await writeFile(join(TMP_DIR, 'tsconfig.json'), JSON.stringify(SPROUT_CONFIG_FILE_TS_CONFIG));
        }

        const pathToCompiledFile = await compileTs({
            outDir: join(TMP_DIR),
            rootDir: join(TMP_DIR),
            configPath: PATH_TO_CONFIG_FILE_IN_TMP,
        });

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

    static runPrompt(prompt: Prompt<any>): Promise<string> {
        this.ensureConfig();

        return this.config.llmCli[prompt.type].sendPrompt(prompt);
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
            cwd: TMP_DIR,
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
