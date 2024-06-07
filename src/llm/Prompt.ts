import mustache from 'mustache';

export type PromptType = 'text' | 'code';

export class Prompt<R> {
    constructor(
        public prompt: string,
        public type: PromptType = 'text',
    ) {
    }

    getPromptText(variables: Record<string, any> & R): string {
        return mustache.render(this.prompt, variables);
    }
}