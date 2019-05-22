import http from './http';
import templates from './templates';
import { ResourceSchema } from './resourceSchema';

class butter {
    sidebar: HTMLElement | null;
    map: { [id: string]: Array<string> };
    selectedServiceId: string;
    selectedVersion: string;
    optionalFieldsEnabled: boolean;

    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.map = {};
        this.selectedServiceId = '';
        this.selectedVersion = '';
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
                    this.renderGetTemplateButton();
                });
            }
        });
    }

    private renderGetTemplateButton(): void {
        let buttonElement = document.getElementById('getContentButton') as HTMLElement;
        buttonElement.addEventListener('click', () => {
            http.get<ResourceSchema>(`GetContent/${this.selectedServiceId}/${this.selectedVersion}`).then((_) => {
                this.renderJsonSchema(_);
            });
        });

        this.alterActive('getContentButton');
    }

    private alterActive(elementId: string): void {
        let suggestionsBox = document.getElementById(elementId) as HTMLElement;
        if (suggestionsBox.classList.contains('active')) {
            suggestionsBox.classList.remove('active');
            return;
        }

        suggestionsBox.classList.add('active');
    }

    private renderJsonSchema(schema: ResourceSchema): void {
        let schemaElement = document.getElementById('content') as HTMLElement;
        let resources: Array<Object> = [];
        for (let resource in schema.resourceDefinitions) {
            let properties: Array<Object> = [];
            for (let property in schema.resourceDefinitions[resource].properties) {
                properties.push({ name: property, properties: schema.resourceDefinitions[resource].properties[property] });
            }

            let processedResource = schema.resourceDefinitions[resource];
            processedResource.mappedProperties = properties;
            resources.push(processedResource);
        }

        templates.renderTemplate('schema', schemaElement, {
            schema, resources
        });

        console.log(schema);
        console.log(resources);
    }
}

let app = new butter();
app.initialize();