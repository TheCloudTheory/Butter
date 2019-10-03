# Butter
Provisioning ARM templates may be hard due to multiple versions available and JSON schemas, which may not be easy to read and parse. This tool tries to ease the process by providing a proper UI for configuring resources one by one.

## Concept
Butter automatically downloads JSON schemas based on [this](https://github.com/Azure/azure-resource-manager-schemas) repository. No manual action is needed - once a new schema is published, it will be automatically fetched by the application.

Butter provides a front-end with one rule in mind - keep it simple. This is why no additional depedencies are required besides:
* [Mustache](https://github.com/janl/mustache.js/) for templating
* [Spectre.css](https://picturepan2.github.io/spectre/) for making things looking better

## Extra sources
In case of any errors or unclear schemas it's always worth visiting [ARM template reference](https://docs.microsoft.com/en-us/azure/templates/).

## Known issues
As all software, Butter will contain bugs. If you find one, you can report it here or, even better, provide a PR fixing it. For now, the following problems may occur:
* Butter may encounter problems rendering complex JSON schemas. This mostly happens when you turn **Enable options fields** option on resources which contain complex nested objects. If your deployment fails, make sure the generated schema isn't broken because of that.
* Some resources may be missing the **name** property. The fix is on the go, but if you end up with the following schema:
```
{
	"type": "Microsoft.ContainerRegistry/registries",
	"apiVersion": "2017-10-01",
	"location": "",
	"sku": {
		"name": "Classic"
	}
}
```
Make sure to add the `name` property.
