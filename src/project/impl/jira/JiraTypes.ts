import { UrlTransferableDataTypesObject } from '@dawiidio/tools/lib/node/URL/UrlTransferableDataTypes';

export interface JiraFetchOptions<D extends UrlTransferableDataTypesObject = UrlTransferableDataTypesObject> {
    endpoint: string,
    method: 'GET' | 'POST'
    data: D
}

export interface JiraIssuesResponse {
    expand: string,
    startAt: number,
    maxResults: number,
    total: number,
    issues: JiraRawResponseIssue[]
}

export interface FetchIssuesOptions extends UrlTransferableDataTypesObject {
    jql: string,
    fields?: string,
    startAt?: number,
    maxResults?: number,
    validateQuery?: string
    expand?: string
    properties?: string[]
    fieldsByKeys?: boolean
}

export interface JiraProject {
    name: string;
    key: string;
    self: string;
}

export interface JiraReporter {
    emailAddress: string;
    displayName: string;
}

export interface JiraSprint {
    name: string;
    startDate: string;
    endDate: string;
    goal: string;
}

export interface JiraPriority {
    name: string;
}

export type JiraLabels = string[]

export interface JiraStatus {
    name: string;
    statusCategory: {
        colorName: string
    };
}

export interface JiraAssignee {
    emailAddress: string;
    displayName: string;
}

export interface JiraIssue {
    id: string;
    project: JiraProject
    assignee: JiraAssignee
    status: JiraStatus
    labels: JiraLabels
    priority: JiraPriority
    reporter: JiraReporter
    summary: string
    type: string
    description?: string
    creator?: JiraReporter
}

export interface JiraRawResponseIssue {
    expand: string;
    id: string;
    key: string;
    self: string;
    fields: Omit<JiraIssue, 'id'>;
}