# Sprout 🌱

![sprout-terminal-gif](https://github.com/dawiidio/sprout/blob/main/public/terminal.gif?raw=true)

Sprout is a simple and lightweight CLI tool with LLM tools integration to
help you with boring tasks and git flow around them.

You can ask in natural language `show me all the bugs created in past three weeks that are about emails` 
and sprout will show you the list of issues that match your query, after selecting the issue
you want to work on, Sprout will create a new branch based on task data and checkout to it.
Later, when you finish your work, you can commit your changes and Sprout will summarize
the changes and create commit for you.

Sprout was designed with **Local first** approach, so it doesn't store any data in the cloud
or communicate with any external services. You can run own LLM (like Ollama) and use it with
Sprout to have full control over your data. 
Nevertheless, it supports also OpenAi apis if you want to use them.

Sprout is highly customizable, you can change the way it interacts with Jira, LLMs, Git, and how it renders tasks.

Since LLMs are not perfect, Sprout is designed to be interactive, so you can always correct the generated data (Human in the loop).

## Installation

First, to have access to sprout cli everywhere, you need to install it globally:

```bash
npm install -g @dawiidio/sprout
```

## Simple configuration

In your project directory, you need to initialize sprout:

```bash
sprout init
```

This will create `sprout.config.ts` and `.sprout.env` files in your project directory

example `sprout.config.ts` file looks like this:

```typescript
import { 
    SproutConfigFunction, 
    JiraCli,
    Ollama,
    GitCli,
    GenericTaskRenderer,
    OpenAi,
} from '@dawiidio/sprout';

export const getConfig: SproutConfigFunction = async () => {
    return {
        projectCli: new JiraCli(),
        llmCli: {
            code: new Ollama('dolphincoder:15b-starcoder2-q5_K_M'),
            text: new OpenAi({}, {
                model: 'gpt-4',
                max_tokens: 100,
            }),
        },
        vcsCli: new GitCli(),
        taskRenderer: new GenericTaskRenderer(),
    }
}
```

You can leave it as it is, or customize it to your needs. If don't have Ollama, 
or OpenAi api key, you can change them in the config.

in `sprout.env` file you can set environment variables for your project, for example:

```dotenv
JIRA_API_KEY=jira-api-key
JIRA_EMAIL=your@email.com
JIRA_DEFAULT_PROJECT_KEY=ABC
JIRA_URL=https://your-domain.atlassian.net
OPENAI_API_KEY=sk-api-key
```

## Usage
As you can see, Sprout is very simple in use, it consists of only two major commands:

### `open` command

Open command is used to fetch tasks from the project management tool (like Jira),
you will be asked to provide a query in natural language, which later will be
translated into platform specific query language (like JQL for Jira). You can always
correct the generated query if it's not perfect, or you can provide your own query, 
you can in loop improve the query until you get the desired results.

After selecting the task you want to work on, Sprout will create a new branch based on task data,
and checkout to it.

When you run `sprout open` (or `sprout o`) command, you will be asked to select the action you want to perform:

```text
? Select action
❯ 🌱 Create new query
  ♥️ Select from favourites
```

While creating new query, you can save it as favourite, so you can reuse it later and skip generation process. 

This is example data flow for `open` command:
```text
? Select action 🌱 Create new query
? Describe what issues you want to work on: show me all the issues created in past three weeks
✔ Query generated!
? Current query: created >= startOfDay(-21) AND created < startOfDay() AND project = "MYP" Ok
✔ Tasks fetched!
? Select issue 2) 10002  create animation for posts view (Reporter: user@domain.com, Priority: Medium)
? Select change type: fix
✔ Branch name generated
? Branch name looks okay? [click tab to edit] fix/MYP-10002_create_animation_for_posts_view
✔ Branch created
```

### `commit` command

Commit command is used to commit your changes, you will be asked to provide a change type and commit message,
if you didn't disable in the config file `useLlmToSummarizeChanges` option in the `vcsCli`, Sprout will try to 
summarize the changes using LLM, and you can always correct the generated message.

GitCli has by default enabled also `addBeforeCommit` and `pushAfterCommit` options, so Sprout will add all changes
before commit and push them to your repo after commit.

## Advanced configuration

If you want to customize Sprout even more, you can create your own classes that implement
`ProjectCli`, `LlmCli`, `VcsCli`, `TaskRenderer` interfaces and use them in the config.

- `ProjectCli` - is responsible for fetching tasks from the project management tool (like Jira)
- `LlmCli` - is responsible for communicating with LLMs
- `VcsCli` - is responsible for communicating with version control system (Git), creating branches, commits, etc.
- `TaskRenderer` - is responsible for rendering tasks fetched by `ProjectCli` in the console

### Implementations configuration

apiKey: string;
email: string;
url: string;
defaultProjectKey: string;
filters: FilterField<any>[];
fields: TaskField<JiraIssue>[];

#### JiraCli
Default values for JiraCli noted in uppercase are taken from `.sprout.env` file.

| name              | type                   | default value            | required | description                                                             |
|-------------------|------------------------|--------------------------|----------|-------------------------------------------------------------------------|
| apiKey            | string                 | JIRA_API_KEY             | ✅        | Jira API key                                                            |
| email             | string                 | JIRA_EMAIL               | ✅        | your email address that you use in Jira                                 |
| url               | bool                   | JIRA_URL                 | ✅        | url to your jira                                                        |
| defaultProjectKey | string                 | JIRA_DEFAULT_PROJECT_KEY | ✅        | project key                                                             |
| filters           | FilterField<any>[]     | []                       | ❌        | Available filters to use when translating natural language query to Jql |
| fields            | TaskField<JiraIssue>[] | []                       | ❌        | Available fields on fetched from Jira issues                            |


#### GitCli

| name                     | type   | default value | required | description                                                                |
|--------------------------|--------|---------------|----------|----------------------------------------------------------------------------|
| mainBranchName           | string | main          | ❌        | main (master) branch name                                                  |
| addBeforeCommit          | bool   | bool          | ❌        | if true, adds edited files before commit                                   |
| updateMainBeforeCheckout | bool   | true          | ❌        | if true, updates main branch name before checkout when creating new branch |
| pushAfterCommit          | bool   | true          | ❌        | if true, push changes after commit                                         |
| useLlmToSummarizeChanges | bool   | true          | ❌        | if true, sends git diff to llm to summarize changes                        |


#### OpenAi

| name          | type                                   | default value | required | description                                                                                                            |
|---------------|----------------------------------------|---------------|----------|------------------------------------------------------------------------------------------------------------------------|
| modelOptions  | ChatCompletionCreateParamsNonStreaming | null          | ✅        | OpenAi model options (see `openai` npm package to learn more)                                                          |
| clientOptions | AzureClientOptions                     | {}            | ❌        | OpenAi client options (see `openai` npm package to learn more). Api key will be automatically added from `.sprout.env` |


#### Ollama

| name         | type                                   | default value | required | description                                       |
|--------------|----------------------------------------|---------------|----------|---------------------------------------------------|
| model        | string                                 | null          | ✅        | Ollama model name                                 |
| modelOptions | ChatCompletionCreateParamsNonStreaming | {}            | ❌        | Ollama options, for more see `ollama` npm package |


## Customizing Sprout

I will try to explain more, for now you must check the source code to see how it works in details.
In general, I tried to create Sprout in a way that it's easy to extend and customize.
If you want to customize something, you can just extend after the default implementation and override the methods you want to change.
For example, if you want to change the Prompt that Sprout sends to create branch name, you want to 
override `getBranchNamePrompt` method in `GitCli` class.

```ts
import { 
    GitCli,
    Prompt,
    GenericTask,
    // ... 
} from '@dawiidio/sprout';

interface MyPromptVariables {
    task: string;
    branchNamingRules: string;
    changeType: ChangeType;
}

// Sprout uses Mustache to render prompts, so you can use variables in the prompt
class MyPrompt extends Prompt<MyPromptVariables> {
    readonly type = 'text'; // determines which llm will be used to generate the prompt. There are two prompt types: 'text' and 'code'
    readonly prompt = `
Your job is to create a branch name based on provided data.
The task data is represented by the following JSON object:
{{ task }}
The change type is: {{ changeType }}.
The branch naming rules are:
{{ branchNamingRules }}

Description part should be always in lower case.
Branch name should not be longer than 100 characters.
You need to propose a branch name that will be used to create a new branch. Return only the branch name, no more text or explanation.
 `;
}

export class MyGitCli extends GitCli {
    getBranchNamePrompt(task: GenericTask, changeType: ChangeType): IssueToBranchNamePrompt {
        return new MyPrompt({
            task: JSON.stringify(task, null, 2),
            branchNamingRules: '...',
            changeType,
        });
    }
}

export const getConfig: SproutConfigFunction = async () => {
    return {
        // ...
        vcsCli: new MyGitCli(),
        // ...
    }
}

```

## Supported tools and services

List of currently supported tools and services, and the ones that are planned to be supported in the future.

### Project management tools:
- [x] Jira
- [ ] Trello
- [ ] GitHub issues
- [ ] Gitlab issues
- [ ] Bitbucket issues
- [ ] Monday

### LLMs:
- [x] Ollama
- [x] OpenAi
- [ ] Claude

### Version control systems:
- [x] Git
- [ ] Mercurial
- [ ] SVN
- [ ] Perforce

## Known issues

when you use OpenAi api, you can get an error like this:

```text
openai/_shims/node-types.d.ts(4,21): error TS1479: The current file is a CommonJS module whose imports will produce 'require' calls; however, the referenced file is an ECMAScript module and cannot be imported with 'require'. Consider writing a dynamic 'import("node-fetch")' call instead.
```

I'll try to fix it in the future (or you can try ;)), but for now, you can just ignore it, config will compile anyway.