import { LLMCli } from '../../llm/LLMCli';
import ollama from 'ollama';
import { Prompt } from '../../llm/Prompt';
import type { Options } from 'ollama';

export class Ollama implements LLMCli {
    constructor(public model: string, public options: Partial<Options> = {}) {
    }

    async sendPrompt(prompt: Prompt<any> | string): Promise<string> {
        const x = await ollama.chat({
            model: this.model,
            options: this.options,
            messages: [
                {
                    role: 'user',
                    content: prompt.toString(),
                }
            ]
        });

        return x.message.content;
    }
}