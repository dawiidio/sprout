import { SproutConfigFunction } from './src/types';
import { JiraCli } from './src/project/impl/jira/JiraCli';
import { Ollama } from './src/llm/impl/Ollama';
import { GitCli } from './src/vsc/impl/git/GitCli';
import { GenericTaskRenderer } from './src/cli/GenericTaskRenderer';
import { OpenAi } from './src/llm/impl/OpenAi';

export const getConfig: SproutConfigFunction = async () => {
    return {
        projectCli: new JiraCli(),
        llmCli: {
            code: new Ollama('llama3:latest'),
            text: new OpenAi({}, {
                model: 'gpt-3.5-turbo',
                max_tokens: 100,
            }),
        },
        vcsCli: new GitCli(),
        taskRenderer: new GenericTaskRenderer(),
    }
}