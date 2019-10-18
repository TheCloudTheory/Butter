import http from './http';
import templates from './templates';
import { ResourceSchema, Property, ResourceDefinition, PropertyDescription } from './resourceSchema';
import config from './config';
import { TemplateSchema } from './templateSchema';

class butter {
    sidebar: HTMLElement | null;
    map: { [id: string]: Array<string> };
    selectedServiceId: string;
    selectedService: ResourceSchema | null;
    selectedVersion: string;
    selectedResource: string;
    optionalFieldsEnabled: boolean;
    fullTemplateSchemaEnabled: boolean;

    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.map = {};
        this.selectedServiceId = '';
        this.selectedVersion = '';
        this.selectedResource = '';
        this.selectedService = null;
        this.optionalFieldsEnabled = false;
        this.fullTemplateSchemaEnabled = false;
    }

    initialize(): void {
        http.get<{ [id: string]: Array<string> }>(config.GetMapUrl, config.GetMapKey).then(_ => {
            this.map = _;
            templates.renderTemplate('welcome', this.sidebar as HTMLElement, {}).then(() => {
                this.registerSearchBoxEventListener();
                this.registerOptionalFieldsListener();
                this.registerFullSchemaListener();
            });
        });
    }

    private registerOptionalFieldsListener(): void {
        let input = document.getElementById('optionalFieldsToggle') as HTMLInputElement;
        input.addEventListener('change', () => {
            this.optionalFieldsEnabled = !this.optionalFieldsEnabled;
            if (this.selectedServiceId !== '' && this.selectedVersion !== '') {
                this.renderJsonSchemaTemplate();
            }
        });
    }

    private registerFullSchemaListener(): void {
        let input = document.getElementById('fullTemplateSchemaToggle') as HTMLInputElement;
        input.addEventListener('change', () => {
            this.fullTemplateSchemaEnabled = !this.fullTemplateSchemaEnabled;
            if (this.selectedServiceId !== '' && this.selectedVersion !== '') {
                this.renderJsonSchemaTemplate();
            }
        });
    }

    private registerSearchBoxEventListener(): void {
        let searchBox = document.getElementById('searchBox') as HTMLInputElement;

        searchBox.addEventListener('keyup', () => {
            let model: Array<string> = [];
            let searchFor = searchBox.value;
            Object.keys(this.map as Object).forEach((value, index) => {
                if (value.toLowerCase().includes(searchFor.toLowerCase())) {
                    model.push(value);
                }
            });

            this.renderSearchBoxSuggestions(searchBox, model);
        });
    }

    private renderSearchBoxSuggestions(searchBox: HTMLInputElement, model: Array<string>): void {
        let suggestionsElement = document.getElementById('searchBoxSuggestions') as HTMLElement;
        templates.renderTemplate('searchBoxSuggestions', suggestionsElement, { services: model }).then(() => {
            this.alterActive('searchBoxSuggestions', false);
            let suggestionItems = document.getElementsByClassName('suggestion-item');
            for (let i = 0; i < suggestionItems.length; i++) {
                suggestionItems[i].addEventListener('click', (e) => {
                    let service = (<HTMLElement>e.target).innerText;
                    searchBox.value = service;
                    this.selectedServiceId = service;
                    this.alterActive('searchBoxSuggestions');
                    this.renderVersionsSelector(service);
                });
            }
        });
    }

    private renderVersionsSelector(service: string): void {
        let versionSelectorElement = document.getElementById('versionSelector') as HTMLElement;
        templates.renderTemplate('versionSelector', versionSelectorElement, { versions: this.map[service] }).then(() => {
            let versionItems = document.getElementsByClassName('version-item');
            for (let i = 0; i < versionItems.length; i++) {
                versionItems[i].addEventListener('click', (e) => {
                    let version = (<HTMLElement>e.target).innerText;
                    this.selectedVersion = version;
                    this.renderResourceSelector();
                    this.setSelectedVersion();
                });
            }
        });
    }

    private setSelectedVersion(): void {
        let versionText = document.getElementById('version-selector-text') as HTMLElement;
        versionText.innerText = this.selectedVersion;
    }

    private renderResourceSelector(): void {
        let resourceSelectorElement = document.getElementById('resourceSelector') as HTMLElement;
        http.get<ResourceSchema>(`${config.GetContentUrl}/${this.selectedServiceId}/${this.selectedVersion}`, config.GetContentKey).then((_) => {
            this.selectedService = _;
            let resources: Array<Object> = [];
            for (let resource in _.resourceDefinitions) {
                let processedResource = _.resourceDefinitions[resource];
                resources.push(processedResource);
            }

            templates.renderTemplate('resourceSelector', resourceSelectorElement, { resources }).then(() => {
                let resourceItems = document.getElementsByClassName('resource-item');
                for (let i = 0; i < resourceItems.length; i++) {
                    resourceItems[i].addEventListener('click', (e) => {
                        let resource = (<HTMLElement>e.target).innerText;
                        this.selectedResource = resource.split('/')[1];
                        this.renderGetTemplateButton();
                        this.setSelectedResource(resource);
                    });
                }
            });
        });
    }

    private setSelectedResource(resource: string): void {
        let resourceText = document.getElementById('resource-selector-text') as HTMLElement;
        resourceText.innerText = resource;
    }

    private renderGetTemplateButton(): void {
        let buttonElement = document.getElementById('getContentButton') as HTMLElement;
        buttonElement.removeEventListener('click', () => { });
        buttonElement.addEventListener('click', () => {
            this.renderJsonSchemaTemplate();
        });

        this.alterActive('getContentButton', false);
    }

    private renderJsonSchemaTemplate(): void {
        this.renderJsonSchema();
    }

    private alterActive(elementId: string, removeClass: boolean = true): void {
        let element = document.getElementById(elementId) as HTMLElement;
        if (element.classList.contains('active')) {
            if (removeClass === true) {
                element.classList.remove('active');
            }

            return;
        }

        element.classList.add('active');
    }

    private renderJsonSchema(): void {
        let schemaElement = document.getElementById('content') as HTMLElement;
        let schema = this.selectedService as ResourceSchema;
        let selectedResource = schema.resourceDefinitions[this.selectedResource];
        let fields = this.flattenFields(selectedResource, selectedResource.required);
        let outputFields: PropertyDescription[] = [];

        fields.forEach((value: PropertyDescription, index: Number) => {
            if (value.isRequired || this.optionalFieldsEnabled) {
                outputFields.push(value);
            }
        });

        templates.renderTemplate('schema', schemaElement, {
            name: this.selectedResource,
            description: `${this.selectedServiceId}(${this.selectedVersion})`,
            properties: outputFields
        }).then(() => {
            this.addEventListenersToSchemaFields();
            this.renderGeneratedJson();
        });
    }

    private flattenFields(definition: ResourceDefinition, requiredFields: string[]): PropertyDescription[] {
        let properties: Array<PropertyDescription> = [];

        this.digest(definition.properties, properties, requiredFields);
        return properties;
    }

    private digest(properties: { [index: string]: Property }, result: Array<PropertyDescription>, requiredFields: string[], parentProperty?: string): void {
        let schema = this.selectedService as ResourceSchema;
        for (let property in properties) {
            let propertyDefinition = properties[property];
            let name = parentProperty ? `${parentProperty}.${property}` : property;
            let isRequired = typeof (requiredFields) !== 'undefined' ? requiredFields.includes(property) : false;

            if (name === 'tags') {
                result.push({
                    name: name,
                    isObject: true,
                    isRequired,
                    isDynamic: true
                });

                continue;
            }

            if (propertyDefinition.type) {
                if (propertyDefinition.enum) {
                    result.push({
                        isEnum: true,
                        name: name,
                        possibleValues: propertyDefinition.enum,
                        isRequired,
                        isDynamic: false
                    });
                }
                else {
                    result.push({
                        name: name,
                        description: propertyDefinition.description,
                        isRequired,
                        isDynamic: false
                    });
                }
            }

            if (propertyDefinition.oneOf) {
                let oneOfDescription = propertyDefinition.oneOf[0];
                if (oneOfDescription.$ref) {
                    let additionalDefinitionName = oneOfDescription.$ref.split('/')[2];
                    let additionalDefinition = schema.definitions[additionalDefinitionName];
                    if (isRequired == false) {
                        additionalDefinition.required = [];
                    }

                    this.digest(additionalDefinition.properties, result, additionalDefinition.required, name);
                }
                else if (oneOfDescription.enum) {
                    result.push({
                        isEnum: true,
                        name: name,
                        possibleValues: oneOfDescription.enum,
                        isRequired,
                        isDynamic: false
                    })
                }
                else {
                    if (oneOfDescription.type) {
                        if (oneOfDescription.type === 'object') {
                            result.push({
                                name: name,
                                isObject: true,
                                isRequired,
                                isDynamic: false
                            });
                        }

                        if (oneOfDescription.type === 'boolean') {
                            result.push({
                                name: name,
                                isBoolean: true,
                                isRequired,
                                isDynamic: false
                            });
                        }
                    }
                }
            }
        }
    }

    private addEventListenersToSchemaFields(): void {
        let fields = document.getElementsByClassName('schema-field');
        for (let i = 0; i < fields.length; i++) {
            let field = fields[i];
            field.addEventListener('change', () => {
                this.renderGeneratedJson();
            });
        }
    }

    private renderGeneratedJson(): void {
        let jsonElement = document.getElementById('generatedJson') as HTMLElement;
        let formElement = document.getElementById('jsonSchema') as HTMLFormElement;
        let form = new FormData(formElement);
        let json: { [index: string]: string | Object } = {};

        form.forEach((value: FormDataEntryValue, key: string, parent: FormData) => {
            let complexKey = key.split('.');
            if (complexKey.length > 1) {
                if (typeof (json[complexKey[0]]) === 'undefined') {
                    json[complexKey[0]] = this.digDeeper(complexKey, 1, {}, value);
                }
                else {
                    if (typeof ((<any>json[complexKey[0]])[complexKey[1]]) === 'undefined') {
                        (<any>json[complexKey[0]])[complexKey[1]] = this.digDeeper(complexKey, 2, {}, value);
                    } else {
                        ((<any>json[complexKey[0]])[complexKey[1]])[complexKey[2]] = this.digDeeper(complexKey, 3, {}, value);
                    }
                }
            }
            else {
                json[key] = value.toString();
            }
        })

        if (this.fullTemplateSchemaEnabled === true) {
            let templateSchema = {
                $schema: "https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#",
                contentVersion: "1.0.0.0",
                resources: []
            } as TemplateSchema;

            templateSchema.resources.push(json);
            templates.renderTemplate('json', jsonElement, { json: JSON.stringify(templateSchema, null, "\t") });
        } else {
            templates.renderTemplate('json', jsonElement, { json: JSON.stringify(json, null, "\t") });
        }
    }

    private digDeeper(keys: string[], index: number, json: { [index: string]: Object }, value: FormDataEntryValue): Object {
        let currentKey = keys[index];
        if (keys.length - 1 > index) {
            index += 1;
            if (typeof (json[currentKey]) === 'undefined') {
                json[currentKey] = this.digDeeper(keys, index, {}, value);
            }
            else {
                index += 1;
                (<any>json[currentKey])[keys[index]] = this.digDeeper(keys, index, {}, value);
            }
        }
        else {
            if (typeof (currentKey) == 'undefined') {
                return value.toString();
            }
            else {
                json[currentKey] = value.toString();
            }
        }

        return json;
    }
}

let app = new butter();
app.initialize();