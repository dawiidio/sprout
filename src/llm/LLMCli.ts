export abstract class LLMCli {
    abstract sendPrompt(prompt: string): Promise<string>;
}