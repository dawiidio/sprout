import { Prompt } from '../llm/Prompt';

export abstract class LLMCli {
    abstract sendPrompt(prompt: Prompt<any> | string): Promise<string>;
}