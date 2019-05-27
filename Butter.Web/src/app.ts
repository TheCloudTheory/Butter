import http from './http';
import templates from './templates';
import { ResourceSchema, Resource, Property, ResourceDefinition, PropertyDescription } from './resourceSchema';

class butter {
    sidebar: HTMLElement | null;
    map: { [id: string]: Array<string> };
    selectedServiceId: string;
    selectedService: ResourceSchema | null;
    selectedVersion: string;
    selectedResource: string;
    optionalFieldsEnabled: boolean;

    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.map = {};
        this.selectedServiceId = '';
        this.selectedVersion = '';
        this.selectedResource = '';
        this.selectedService = null;
        this.optionalFieldsEnabled = false;
    }

    initialize(): void {
        http.get<{ [id: string]: Array<string> }>('GetMap').then(_ => {
            this.map = _;
            templates.renderTemplate('welcome', this.sidebar as HTMLElement, {}).then(() => {
                this.registerSearchBoxEventListener();
                this.registerOptionalFieldsListener();
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
            this.alterActive('searchBoxSuggestions');
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
                });
            }
        });
    }

    private renderResourceSelector(): void {
        let resourceSelectorElement = document.getElementById('resourceSelector') as HTMLElement;
        http.get<ResourceSchema>(`GetContent/${this.selectedServiceId}/${this.selectedVersion}`).then((_) => {
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
                    });
                }
            });
        });
    }

    private renderGetTemplateButton(): void {
        let buttonElement = document.getElementById('getContentButton') as HTMLElement;
        buttonElement.addEventListener('click', () => {
            this.renderJsonSchemaTemplate();
        });

        this.alterActive('getContentButton');
    }

    private renderJsonSchemaTemplate(): void {
        this.renderJsonSchema();
    }

    private alterActive(elementId: string): void {
        let suggestionsBox = document.getElementById(elementId) as HTMLElement;
        if (suggestionsBox.classList.contains('active')) {
            suggestionsBox.classList.remove('active');
            return;
        }

        suggestionsBox.classList.add('active');
    }

    private renderJsonSchema(): void {
        let schemaElement = document.getElementById('content') as HTMLElement;
        let schema = this.selectedService as ResourceSchema;
        let selectedResource = schema.resourceDefinitions[this.selectedResource];
        let fields = this.flattenFields(selectedResource);

        console.log(fields);
        templates.renderTemplate('schema', schemaElement, {
            name: this.selectedResource,
            description: `${this.selectedServiceId}(${this.selectedVersion})`,
            properties: fields
        }).then(() => {
            this.addEventListenersToSchemaFields();
            this.renderGeneratedJson();
        });

        console.log(schema);
    }

    private flattenFields(definition: ResourceDefinition): PropertyDescription[] {
        let properties: Array<PropertyDescription> = [];

        this.digest(definition.properties, properties);
        return properties;
    }

    private digest(properties: { [index: string]: Property }, result: Array<PropertyDescription>, parentProperty?: string): void {
        let schema = this.selectedService as ResourceSchema;
        for (let property in properties) {
            let propertyDefinition = properties[property];
            let name = parentProperty ? `${parentProperty}.${property}` : property;

            if (propertyDefinition.type) {
                if (propertyDefinition.enum) {
                    result.push({
                        isEnum: true,
                        name: name,
                        possibleValues: propertyDefinition.enum
                    });
                }
                else {
                    result.push({
                        name: name,
                        description: propertyDefinition.description
                    });
                }
            }

            if (propertyDefinition.oneOf) {
                let oneOfDescription = propertyDefinition.oneOf[0];
                if (oneOfDescription.$ref) {
                    let additionalDefinitionName = oneOfDescription.$ref.split('/')[2];
                    let additionalDefinition = schema.definitions[additionalDefinitionName];

                    this.digest(additionalDefinition.properties, result, name);
                }
                else if (oneOfDescription.enum) {
                    result.push({
                        isEnum: true,
                        name: name,
                        possibleValues: oneOfDescription.enum
                    })
                }
                else {
                    if (oneOfDescription.type) {
                        if (oneOfDescription.type === 'object') {
                            result.push({
                                name: name
                            });
                        }

                        if (oneOfDescription.type === 'boolean') {
                            result.push({
                                name: name,
                                isBoolean: true
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
                if(typeof(json[complexKey[0]]) === 'undefined') {
                    json[complexKey[0]] = this.digDeeper(complexKey, 1, {}, value);
                }
                else {
                    (<any>json[complexKey[0]])[complexKey[1]] = this.digDeeper(complexKey, 2, {}, value);
                }
            }
            else {
                json[key] = value.toString();
            }
        })

        templates.renderTemplate('json', jsonElement, { json: JSON.stringify(json, null, "\t") });
    }

    private digDeeper(keys: string[], index: number, json: {[index: string] : Object}, value: FormDataEntryValue): Object {
        let currentKey = keys[index];
        if(keys.length - 1 > index) {
            index += 1;
            if(typeof(json[currentKey]) === 'undefined') {
                console.log(currentKey, index);
                json[currentKey] = this.digDeeper(keys, index, {}, value);
            }
            else {
                index += 1;
                (<any>json[currentKey])[keys[index]] = this.digDeeper(keys, index, {}, value);
            }
        }
        else {
            if(typeof(currentKey) == 'undefined') {
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