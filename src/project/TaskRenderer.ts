import { GenericTask } from '../project/ProjectCli';

export interface SelectChoice {
    value: GenericTask;
    name?: string;
    description?: string;
    disabled?: boolean | string;
    type?: never;
}

export interface TaskRenderer {
    renderLabel(task: GenericTask, idx: number): string;
    renderTask(task: GenericTask, idx: number): SelectChoice;
    renderTasks(tasks: GenericTask[]): SelectChoice[];
}
