import { LLMCli } from '../../llm/LLMCli';
import ollama from 'ollama';

export class Ollama implements LLMCli {
    constructor(public model: string) {
    }

    async sendPrompt(prompt: string): Promise<string> {
        const x = await ollama.chat({
            model: this.model,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        return x.message.content;
    }
}