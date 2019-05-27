export type ResourceSchema = {
    id: string;
    $schema: string;
    title: string;
    description: string;
    resourceDefinitions: { [index: string]: ResourceDefinition };
    definitions: { [index: string]: Definition };
}

export type Definition = {
    type: string;
    description: string;
    required: Array<string>;
    properties: { [index: string]: Property };
    allOf: Array<Object>;
}

export type ResourceDefinition = {
    type: string;
    description: string;
    required: Array<string>;
    properties: { [index: string]: Property };
    mappedProperties: Array<Resource>
}

export type Property = {
    description?: string;
    oneOf?: Array<OneOf>;
    name: string;
    type?: string;
    enum?: Array<string>;
}

export type PropertyDescription = {
    name: string,
    isEnum?: boolean;
    possibleValues?: Array<string>;
    description?: string;
    isBoolean?: boolean;
}

export type OneOf = {
    $ref?: string;
    enum?: Array<string>;
    type?: string;
}

export type Resource = {
    name: string;
    properties: Property;
    isRequired: boolean;
    hasAdditionalDefinition?: boolean;
    isEnum?: boolean;
    definition?: DefinitionDescription;
    possibleValues?: Array<string>;
    definitionProperties?: Array<Property>;
}

export type DefinitionDescription = {

}