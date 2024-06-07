import { SproutConfigFunction } from './src/types';
import { JiraCli } from './src/project/impl/jira/JiraCli';
import { Ollama } from './src/llm/impl/Ollama';
import { GitCli } from './src/vsc/impl/git/GitCli';
import { GenericTaskRenderer } from './src/cli/GenericTaskRenderer';

export const getConfig: SproutConfigFunction = async () => {
    return {
        projectCli: new JiraCli(),
        llmCli: {
            code: new Ollama('llama3:latest'),
            text: new Ollama('llama3:latest'),
        },
        vcsCli: new GitCli(),
        taskRenderer: new GenericTaskRenderer(),
    }
}