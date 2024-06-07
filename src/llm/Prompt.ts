import mustache from 'mustache';

export type PromptType = 'text' | 'code';

export abstract class Prompt<R> {
    abstract prompt: string
    public readonly type: PromptType = 'text';

    constructor(
        public variables: Record<string, any> & R,
    ) {}

    toString(): string {
        return mustache.render(this.prompt, this.variables);
    }
}