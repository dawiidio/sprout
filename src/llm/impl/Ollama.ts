import { LLMCli } from '../../llm/LLMCli';
import ollama from 'ollama';
import { Prompt } from '../../llm/Prompt';

export class Ollama implements LLMCli {
    constructor(public model: string) {
    }

    async sendPrompt(prompt: Prompt<any> | string): Promise<string> {
        const x = await ollama.chat({
            model: this.model,
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