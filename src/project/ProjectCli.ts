import { FilterField } from '../project/FilterField';
import { TaskField } from '../project/TaskField';
import { Prompt } from '../llm/Prompt';

export interface GenericTask {
    id: string;
    title: string;
    type: string;
    description?: string;
    url?: string;
    project?: string;
    assignee?: string;
    status?: string;
    priority?: string;
    reporter?: string;
    creator?: string;
    labels?: string[];
}

export interface ProjectCli {
    filters: FilterField<any>[];
    taskFields: TaskField<any>[];
    type: string;

    getPlatformQueryPrompt(query: string): Prompt<any>;

    fetchTasksByQuery(query: string): Promise<GenericTask[]>;

    fetchTaskById(id: string): Promise<GenericTask|undefined>;
}