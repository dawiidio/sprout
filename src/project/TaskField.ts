export type TaskFieldGetValue<R> = (task: Record<string, any>, key?: string) => R | undefined;
const DEFAULT_GET_VALUE = <R>(task: Record<string, any>, key?: string): R | undefined => task[key || ''];

export class TaskField<R> {
    constructor(
        public label: string,
        public key: string,
        public valueGetter: TaskFieldGetValue<R> = DEFAULT_GET_VALUE,
    ) {
    }

    getValue(task: Record<string, any>): R | undefined {
        return this.valueGetter(task, this.key);
    }
}