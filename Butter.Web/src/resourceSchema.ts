export type ResourceSchema = {
    id: string;
    $schema: string;
    title: string;
    description: string;
    resourceDefinitions: { [index: string]: ResourceDefinition };
    definitions: Object;
}

export type Definition = {
    type: string;
    description: string;
    required: Array<string>;
    properties: Object;
    allOf: Array<Object>;
}

export type ResourceDefinition = {
    type: string;
    description: string;
    required: Array<string>;
    properties: { [index: string]: Object };
    mappedProperties: Array<Object>
}