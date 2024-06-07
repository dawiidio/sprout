import type { LLMCli } from './llm/LLMCli';
import type { ProjectCli } from './project/ProjectCli';
import type { VcsCli } from './vsc/VcsCli';
import type { PromptType } from './llm/Prompt';
import type { TaskRenderer } from './project/TaskRenderer';

export interface Config {
    projectCli: ProjectCli;
    llmCli: Record<PromptType, LLMCli>
    vcsCli: VcsCli;
    taskRenderer: TaskRenderer;
}

export type SproutConfigFunction = () => Promise<Partial<Config>> | Partial<Config>;