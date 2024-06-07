import { GenericTask, ProjectCli, ProjectCliPrompts } from '../../../project/ProjectCli';
import { JiraFetchOptions, JiraIssue, FetchIssuesOptions, JiraIssuesResponse } from '../../../project/impl/jira/JiraTypes';
import { FilterField, FilterFieldOption } from '../../../project/FilterField';
import { TaskField } from '../../../project/TaskField';
import { UrlTransferableDataTypesObject } from '@dawiidio/tools/lib/node/URL/UrlTransferableDataTypes';
import { UrlSearchParamsParser } from '@dawiidio/tools/lib/node/URL/SearchParams/UrlSearchParamsParser';
import { LLMCli } from '../../../llm/LLMCli';
import { queryToJql } from '../../../project/impl/jira/prompts/queryToJql';
import { CommandOptionsStorage, DescriptableDate, Env, logger, promptInstanceCheck } from '../../../common';
import { object, string, array, ValidationError } from 'yup';

const {
    JIRA_API_KEY,
    JIRA_EMAIL,
    JIRA_URL,
    JIRA_DEFAULT_PROJECT_KEY,
} = Env.getEnv<'JIRA_API_KEY' | 'JIRA_EMAIL' | 'JIRA_URL' | 'JIRA_DEFAULT_PROJECT_KEY'>();
const JIRA_DATE_FORMAT = 'yyyy/MM/dd';

export interface JiraCliOptions {
    apiKey: string;
    email: string;
    url: string;
    defaultProjectKey: string;
    filters: FilterField<any>[];
    fields: TaskField<JiraIssue>[];
    prompts: ProjectCliPrompts;
}

const filterFieldInstanceCheck = (value: any) => {
    if (!(value instanceof FilterField)) {
        throw new ValidationError('Value must be an instance of FilterField');
    }
    return true;
};

const taskFieldInstanceCheck = (value: any) => {
    if (!(value instanceof TaskField)) {
        throw new ValidationError('Value must be an instance of TaskField');
    }
    return true;
};


const optionsValidator = object<JiraCliOptions>({
    apiKey: string().required(),
    email: string().required(),
    url: string().required(),
    defaultProjectKey: string().required(),
    filters: array().of(object().test('isFilterField', 'Value must be an instance of FilterField', filterFieldInstanceCheck)).optional(),
    fields: array().of(object().test('isTaskField', 'Value must be an instance of TaskField', taskFieldInstanceCheck)),
    prompts: object().test('isPrompt', 'All values must be instances of Prompt', (obj) => {
        return Object.values(obj ?? {}).every(promptInstanceCheck);
    })
});

export const DEFAULT_JIRA_FILTERS = [
    new FilterField({
        type: 'string',
        multiple: true,
        key: 'assignee',
        description: 'Filter by assignee',
        looseOptions: true,
        options: [
            new FilterFieldOption('string', 'currentUser()', 'Special value representing the current user'),
        ],
    }),
    new FilterField({
        type: 'string',
        multiple: false,
        key: 'project',
        description: 'Filter by project',
        defaultValue: JIRA_DEFAULT_PROJECT_KEY,
    }),
    new FilterField({
        type: 'date',
        multiple: false,
        key: 'createdDate',
        format: JIRA_DATE_FORMAT,
        description: 'Filter by created date',
    }),
    new FilterField({
        type: 'string',
        multiple: true,
        key: 'status',
        description: 'Filter by status',
    }),
    new FilterField({
        type: 'string',
        multiple: true,
        key: 'priority',
        description: 'Filter by priority',
        options: [
            new FilterFieldOption('string', 'highest', 'Most urgent tasks'),
            new FilterFieldOption('string', 'high', 'High priority'),
            new FilterFieldOption('string', 'medium', 'Medium priority'),
            new FilterFieldOption('string', 'low', 'Low priority'),
            new FilterFieldOption('string', 'lowest', 'Lowest priority'),
        ],
    }),
    new FilterField({
        type: 'string',
        multiple: true,
        key: 'issueType',
        description: 'Filter by issue type',
    }),
    new FilterField({
        type: 'string',
        multiple: false,
        key: 'reporter',
        description: 'Filter by reporter',
    }),
    new FilterField({
        type: 'string',
        multiple: false,
        key: 'issuekey',
        description: 'Filter by issue key (id)',
    }),
];

export const DEFAULT_JIRA_TASK_FIELDS = [
    new TaskField('creator', 'creator'),
    new TaskField('status', 'status'),
    new TaskField('priority', 'priority'),
    new TaskField('reporter', 'reporter'),
    new TaskField('labels', 'labels'),
    new TaskField('project', 'project'),
    new TaskField('summary', 'summary'),
    new TaskField('assignee', 'assignee'),
    new TaskField('type', 'type'),
];

export const DEFAULT_JIRA_PROMPTS: ProjectCliPrompts = {
    naturalLanguageQuery: queryToJql,
}

export class JiraCli<T extends JiraIssue = JiraIssue> implements ProjectCli {
    filters: FilterField<any>[] = [];
    taskFields: TaskField<any>[] = [];
    public readonly options: JiraCliOptions;
    prompts: ProjectCliPrompts;

    constructor(
        options: Partial<JiraCliOptions> = {}
    ) {
        const mergedOptions = {
            apiKey: JIRA_API_KEY,
            email: JIRA_EMAIL,
            url: JIRA_URL,
            defaultProjectKey: JIRA_DEFAULT_PROJECT_KEY,
            ...options,
        }

        optionsValidator.validateSync(mergedOptions);

        this.options = mergedOptions as JiraCliOptions;
        this.filters = options.filters || DEFAULT_JIRA_FILTERS;
        // @ts-ignore
        this.taskFields = options.fields || DEFAULT_JIRA_TASK_FIELDS;
        this.prompts = options.prompts || DEFAULT_JIRA_PROMPTS;
    }


    async fetch<R = any, D extends UrlTransferableDataTypesObject = UrlTransferableDataTypesObject>({ data, method, endpoint }: JiraFetchOptions<D>): Promise<R> {
        let queryParamsString = '';

        if (method === 'GET') {
            const urlSearchParamsParser = UrlSearchParamsParser.fromObject(data)
            queryParamsString = `?${urlSearchParamsParser.searchParams.toString()}`;
        }

        const response = await fetch(`${JIRA_URL}/rest/api/3/${endpoint}${queryParamsString}`, {
            method: method,
            headers: {
                'Authorization': `Basic ${Buffer.from(
                    `${JIRA_EMAIL}:${JIRA_API_KEY}`
                ).toString('base64')}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            ...(method !== 'GET' ? {data} : {})
        });

        return response.json();
    }

    async fetchTasks(options: FetchIssuesOptions): Promise<T[]> {
        const response = await this.fetch<JiraIssuesResponse>({
            data: options,
            method: 'GET',
            endpoint: 'search'
        });

        logger.debug('fetch tasks options', options, response);

        return response.issues?.map<T>(issue => ({
            ...issue.fields,
            id: issue.id,
        }) as T) || [];
    }

    async generatePlatformQuery(naturalLanguageQuery: string, llm: LLMCli): Promise<string> {
        const prompt = this.prompts.naturalLanguageQuery.getPromptText({
            fields: '*all',
            user: naturalLanguageQuery,
            date: new DescriptableDate({
                format: JIRA_DATE_FORMAT
            }),
        });

        return llm.sendPrompt(prompt);
    }

    async fetchTasksByQuery(jql: string): Promise<GenericTask[]> {
        if (CommandOptionsStorage.dryRun) {
            logger.info('Dry run, skipping fetching tasks');
            logger.debug('Arguments to jira fetch tasks', {
                jql,
                fields: this.getFieldsKeys(),
            });
            return [];
        }

        // todo error handling
        const tasks = await this.fetchTasks({
            jql,
            fields: this.getFieldsKeys(),
        });

        return tasks.map(task => this.mapIJraTaskToGenericTask(task));
    }

    async fetchTaskById(id: string): Promise<GenericTask|undefined> {
        const tasks = await this.fetchTasks({
            jql: `issuekey = ${id}`,
            fields: this.getFieldsKeys(),
        });

        return tasks.map(task => this.mapIJraTaskToGenericTask(task)).at(0);
    }

    mapIJraTaskToGenericTask(task: JiraIssue): GenericTask {
        return {
            id: task.id,
            type: task.type,
            title: task.summary,
            description: task.description,
            url: `${JIRA_URL}/browse/${task.id}`,
            project: task.project?.key,
            assignee: task.assignee?.emailAddress,
            status: task.status?.name,
            priority: task.priority?.name,
            reporter: task.reporter?.emailAddress,
            creator: task.creator?.emailAddress,
        }
    }

    private getFieldsKeys() {
        return this.taskFields.map(field => field.key).join(',');
    }
}