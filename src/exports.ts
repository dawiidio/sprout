import type { LLMCli } from './llm/LLMCli';
import type { ProjectCli } from './project/ProjectCli';
import type { VcsCli } from './vsc/VcsCli';
import { Prompt, type PromptType } from './llm/Prompt';
import { TaskRenderer, type TaskRendererSelectChoice } from './cli/TaskRenderer';
import { Ollama } from './llm/impl/Ollama';
import { OpenAi } from './llm/impl/OpenAi';
import { TaskField } from './project/TaskField';
import { FilterField, FilterFieldOption, type TaskFilterProps } from './project/FilterField';
import { JiraCli, type JiraCliOptions } from './project/impl/jira/JiraCli';
import { type Descriptable } from './llm/Descriptable';
import { GitCli, type GitCliOptions } from './vsc/impl/git/GitCli';

export interface Config {
    projectCli: ProjectCli;
    llmCli: Record<PromptType, LLMCli>
    vcsCli: VcsCli;
    taskRenderer: TaskRenderer;
}

export type SproutConfigFunction = () => Promise<Partial<Config>> | Partial<Config>;

export {
    LLMCli,
    ProjectCli,
    VcsCli,
    PromptType,
    TaskRenderer,
    Prompt,
    Ollama,
    OpenAi,
    FilterField,
    FilterFieldOption,
    TaskField,
    Descriptable,
    JiraCli,
    JiraCliOptions,
    GitCliOptions,
    TaskFilterProps,
    TaskRendererSelectChoice,
    GitCli
};