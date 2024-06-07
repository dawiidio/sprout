import { Prompt } from '../../../../llm/Prompt';
import { FilterField } from '../../../../project/FilterField';

export interface SearchToJqlVariables {
    fields: FilterField<any>[];
    date: string;
    query: string;
}

export class QueryToJqlPrompt extends Prompt<SearchToJqlVariables> {
    readonly prompt = `
You are a translator for provided by user description of tasks, you must return your response in form of JQL (Jira Query Language) to find the tasks that match the description.
If field has defined default value, you should always add it to the query.
You can use the following fields:
{{#fields}}* {{.}}
{{/fields}}
after this text [----QUERY----] you will be provided with the user description of query.

Today is {{date}}. Date is in format yyyy/MM/dd. If user query relies on dates you should use today's date as reference, if needed, perform date calculations. Example date queries: 
- 'created > "2022/04/01" and created < "2022/04/30"' - all tasks created in April 2022
- 'created >= startOfDay(-14) AND created < startOfDay()' - all tasks created in last 14 days (two weeks) 

Respond only with the JQL query, do not include any additional text.

[----QUERY----]
{{query}}    
    `;

    constructor(variables: SearchToJqlVariables) {
        super(variables);
    }
}