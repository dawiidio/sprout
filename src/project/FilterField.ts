import { Descriptable } from '../llm/Descriptable';
import { DescriptableDate } from '../common';

export type FilterFieldType = {
    string: string;
    number: number;
    date: DescriptableDate;
}

export type TaskFilterType = keyof FilterFieldType;

export class FilterFieldOption<T extends TaskFilterType> implements Descriptable {
    constructor(
        public readonly type: T,
        public readonly value: FilterFieldType[T],
        public readonly description?: string,
    ) {
    }

    toDescription(): string {
        return `    - filter option of type "${this.type}" with value "${this.value}" and description "${this.description}"`;
    }
}

export interface TaskFilterProps<T extends TaskFilterType> {
    key: string;
    type: T;
    format?: string;
    defaultValue?: FilterFieldType[T];
    options?: FilterFieldOption<T>[];
    looseOptions?: boolean;
    // todo(dawiidio) add description to the multiple options in toDescription
    multiple?: boolean;
    description?: string;
}

export class FilterField<T extends TaskFilterType> implements Descriptable {
    public value?: FilterFieldType[T];

    constructor(public readonly props: TaskFilterProps<T>) {
        this.value = props.defaultValue;
    }

    toDescription(): string {
        if (this.props.options?.length) {
            return `Filter field "${this.props.key}" ${this.props.description ? `(${this.props.description})` : ""}
  - has multiple values of type "${this.props.type}",
  ${this.props.looseOptions ? '  - Can have any value including those in the possible options' : '  - Can have only values from possible options list'} 
  - Default value equals "${this.value}", 
${this.props.format ? '  - Value format is ' + this.props.format : ''}
  - Possible options are:
${this.props.options.map(option => option.toDescription()).join(',\n')}
`;
        }
        else {
            return `Filter field "${this.props.key}": 
${this.props.format ? '  - Value format is ' + this.props.format : ''}
  - has single value of type "${this.props.type}",
  - Default value equals "${this.value}"
`;
        }
    }

    toString(): string {
        return this.toDescription();
    }
}