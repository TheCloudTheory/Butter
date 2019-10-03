import http from './http';
import Mustache from 'mustache';

export default class templates {
    static renderTemplate(name: string, wrapper: HTMLElement, model: Object): Promise<string> {
        return http.getLocal(`templates/${name}.js`).then(_ => {
            let rendered = Mustache.render(_, model);
            wrapper.innerHTML = rendered;
        }) as Promise<string>;
    }
}