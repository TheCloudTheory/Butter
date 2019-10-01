export default class http {
    static get<T>(url: string): Promise<T> {
        return this.getRequest(`${url}`, true);
    }

    static getLocal(file: string): Promise<string> {
        return this.getRequest(`./${file}`, false);
    }

    private static getRequest<T>(url: string, isJson: boolean): Promise<T> {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();

            req.onload = (_) => {
                let target = <XMLHttpRequest>_.target;

                if (target.status === 200) {
                    resolve(isJson ? JSON.parse(target.response) : target.response);
                  } else {
                    reject(new Error(target.statusText));
                  }
            }
            req.onerror = function () {
                reject(new Error('XMLHttpRequest Error: ' + this.statusText));
            };
            req.open('GET', `${url}`);
            req.send();
        });
    }
}