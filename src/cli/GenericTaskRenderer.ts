import { TaskRendererSelectChoice, TaskRenderer } from './TaskRenderer';
import { GenericTask } from '../project/ProjectCli';

export class GenericTaskRenderer implements TaskRenderer {
    renderTasks(tasks: GenericTask[]): TaskRendererSelectChoice[] {
        return tasks.map((task, idx) => this.renderTask(task, idx));
    }

    renderTask(task: GenericTask, idx: number): TaskRendererSelectChoice {
        return {
            value: task,
            name: this.renderLabel(task, idx),
            description: task.description
        };
    }

    renderLabel(issue: GenericTask, idx: number): string {
        const attrs: [string, string][] = [];
        let tags = '';

        if (issue.assignee) {
            attrs.push([
                'Assignee',
                `${issue.assignee}`
            ]);
        }

        if (issue.reporter) {
            attrs.push([
                'Reporter',
                `${issue.reporter}`
            ]);
        }

        if (issue.priority) {
            attrs.push([
                'Priority',
                `${issue.priority}`
            ]);
        }

        if (issue.labels) {
            tags = `[${issue.labels.join(', ').trim()}]`;
        }

        return `${idx+1}) ${issue.id} ${tags} ${issue.title} ${this.createAttrsString(attrs)}`;
    }

    private createAttrsString(attrs: [string, string][]): string {
        if (!attrs.length)
            return '';

        const attrsString = attrs.map(([key, val]) => `${key}: ${val}`).join(', ').trim();

        return `(${attrsString})`;
    }

}