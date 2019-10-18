export type TemplateSchema = {
    $schema: string,
    contentVersion: string,
    apiProfile?: string,
    parameteres?: Object,
    variables?: Object,
    functions?: Array<Object>,
    resources: Array<Object>,
    outputs?: Object
}