import { LLMCli } from '../../llm/LLMCli';
import { Prompt } from '../../llm/Prompt';
import OpenAiApi, { AzureClientOptions, OpenAI } from 'openai';
import { ChatCompletionCreateParamsNonStreaming } from 'openai/src/resources/chat/completions';

export class OpenAi implements LLMCli {
    protected openai: OpenAI;

    constructor(clientOptions: AzureClientOptions, public modelOptions: Omit<ChatCompletionCreateParamsNonStreaming, 'messages' | 'stream'>) {
        this.openai = new OpenAiApi({
            apiKey: process.env.OPENAI_API_KEY,
            ...clientOptions,
        });
    }

    async sendPrompt(prompt: Prompt<any> | string): Promise<string> {
        const x = await this.openai.chat.completions.create({
            ...this.modelOptions,
            messages: [
                {
                    role: 'user',
                    content: prompt.toString(),
                }
            ],
            stream: false,
        });

        return x.choices[0].message.content!;
    }
}