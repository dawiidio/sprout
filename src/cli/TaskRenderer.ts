import { GenericTask } from '../project/ProjectCli';

export interface TaskRendererSelectChoice {
    value: GenericTask;
    name?: string;
    description?: string;
    disabled?: boolean | string;
    type?: never;
}

export interface TaskRenderer {
    renderLabel(task: GenericTask, idx: number): string;
    renderTask(task: GenericTask, idx: number): TaskRendererSelectChoice;
    renderTasks(tasks: GenericTask[]): TaskRendererSelectChoice[];
}
