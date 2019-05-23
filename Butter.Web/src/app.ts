import http from './http';
import templates from './templates';
import { ResourceSchema, Resource } from './resourceSchema';

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
        let properties: Array<Resource> = [];

        for (let property in selectedResource.properties) {
            let isRequired = selectedResource.required.includes(property);
            if (this.optionalFieldsEnabled === true || isRequired === true) {
                properties.push({
                    name: property,
                    properties: selectedResource.properties[property],
                    isRequired: isRequired
                });
            }
        }

        templates.renderTemplate('schema', schemaElement, {
            name: this.selectedResource,
            description: `${this.selectedServiceId}(${this.selectedVersion})`,
            properties
        }).then(() => {
            this.addEventListenersToSchemaFields();
            this.renderGeneratedJson();
        });

        console.log(schema);
        console.log(properties);
    }

    private addEventListenersToSchemaFields(): void {
        let fields = document.getElementsByClassName('schema-field');
        for(let i = 0; i < fields.length; i++) {
            let field = fields[i];
            field.addEventListener('keyup', () => {
                this.renderGeneratedJson();
            });
        }
    }

    private renderGeneratedJson(): void {
        let jsonElement = document.getElementById('generatedJson') as HTMLElement;
        let formElement = document.getElementById('jsonSchema') as HTMLFormElement;
        let form = new FormData(formElement);
        let json: { [index: string]: string } = {};

        form.forEach((value: FormDataEntryValue, key: string, parent: FormData) => {
            json[key] = value.toString();
        })

        templates.renderTemplate('json', jsonElement, { json: JSON.stringify(json, null, "\t") });
    }
}

let app = new butter();
app.initialize();