(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("./http"));
const templates_1 = __importDefault(require("./templates"));
class butter {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.map = {};
        this.selectedServiceId = '';
        this.selectedVersion = '';
        this.selectedResource = '';
        this.selectedService = null;
        this.optionalFieldsEnabled = false;
    }
    initialize() {
        http_1.default.get('GetMap').then(_ => {
            this.map = _;
            templates_1.default.renderTemplate('welcome', this.sidebar, {}).then(() => {
                this.registerSearchBoxEventListener();
                this.registerOptionalFieldsListener();
            });
        });
    }
    registerOptionalFieldsListener() {
        let input = document.getElementById('optionalFieldsToggle');
        input.addEventListener('change', () => {
            this.optionalFieldsEnabled = !this.optionalFieldsEnabled;
            if (this.selectedServiceId !== '' && this.selectedVersion !== '') {
                this.renderJsonSchemaTemplate();
            }
        });
    }
    registerSearchBoxEventListener() {
        let searchBox = document.getElementById('searchBox');
        searchBox.addEventListener('keyup', () => {
            let model = [];
            let searchFor = searchBox.value;
            Object.keys(this.map).forEach((value, index) => {
                if (value.toLowerCase().includes(searchFor.toLowerCase())) {
                    model.push(value);
                }
            });
            this.renderSearchBoxSuggestions(searchBox, model);
        });
    }
    renderSearchBoxSuggestions(searchBox, model) {
        let suggestionsElement = document.getElementById('searchBoxSuggestions');
        templates_1.default.renderTemplate('searchBoxSuggestions', suggestionsElement, { services: model }).then(() => {
            this.alterActive('searchBoxSuggestions');
            let suggestionItems = document.getElementsByClassName('suggestion-item');
            for (let i = 0; i < suggestionItems.length; i++) {
                suggestionItems[i].addEventListener('click', (e) => {
                    let service = e.target.innerText;
                    searchBox.value = service;
                    this.selectedServiceId = service;
                    this.alterActive('searchBoxSuggestions');
                    this.renderVersionsSelector(service);
                });
            }
        });
    }
    renderVersionsSelector(service) {
        let versionSelectorElement = document.getElementById('versionSelector');
        templates_1.default.renderTemplate('versionSelector', versionSelectorElement, { versions: this.map[service] }).then(() => {
            let versionItems = document.getElementsByClassName('version-item');
            for (let i = 0; i < versionItems.length; i++) {
                versionItems[i].addEventListener('click', (e) => {
                    let version = e.target.innerText;
                    this.selectedVersion = version;
                    this.renderResourceSelector();
                    this.setSelectedVersion();
                });
            }
        });
    }
    setSelectedVersion() {
        let versionText = document.getElementById('version-selector-text');
        versionText.innerText = this.selectedVersion;
    }
    renderResourceSelector() {
        let resourceSelectorElement = document.getElementById('resourceSelector');
        http_1.default.get(`GetContent/${this.selectedServiceId}/${this.selectedVersion}`).then((_) => {
            this.selectedService = _;
            let resources = [];
            for (let resource in _.resourceDefinitions) {
                let processedResource = _.resourceDefinitions[resource];
                resources.push(processedResource);
            }
            templates_1.default.renderTemplate('resourceSelector', resourceSelectorElement, { resources }).then(() => {
                let resourceItems = document.getElementsByClassName('resource-item');
                for (let i = 0; i < resourceItems.length; i++) {
                    resourceItems[i].addEventListener('click', (e) => {
                        let resource = e.target.innerText;
                        this.selectedResource = resource.split('/')[1];
                        this.renderGetTemplateButton();
                        this.setSelectedResource(resource);
                    });
                }
            });
        });
    }
    setSelectedResource(resource) {
        let resourceText = document.getElementById('resource-selector-text');
        resourceText.innerText = resource;
    }
    renderGetTemplateButton() {
        let buttonElement = document.getElementById('getContentButton');
        buttonElement.removeEventListener('click', () => { });
        buttonElement.addEventListener('click', () => {
            this.renderJsonSchemaTemplate();
        });
        this.alterActive('getContentButton');
    }
    renderJsonSchemaTemplate() {
        this.renderJsonSchema();
    }
    alterActive(elementId) {
        let suggestionsBox = document.getElementById(elementId);
        if (suggestionsBox.classList.contains('active')) {
            suggestionsBox.classList.remove('active');
            return;
        }
        suggestionsBox.classList.add('active');
    }
    renderJsonSchema() {
        let schemaElement = document.getElementById('content');
        let schema = this.selectedService;
        let selectedResource = schema.resourceDefinitions[this.selectedResource];
        let fields = this.flattenFields(selectedResource, selectedResource.required);
        let outputFields = [];
        fields.forEach((value, index) => {
            if (value.isRequired || this.optionalFieldsEnabled) {
                outputFields.push(value);
            }
        });
        templates_1.default.renderTemplate('schema', schemaElement, {
            name: this.selectedResource,
            description: `${this.selectedServiceId}(${this.selectedVersion})`,
            properties: outputFields
        }).then(() => {
            this.addEventListenersToSchemaFields();
            this.renderGeneratedJson();
        });
        console.log(schema);
    }
    flattenFields(definition, requiredFields) {
        let properties = [];
        this.digest(definition.properties, properties, requiredFields);
        return properties;
    }
    digest(properties, result, requiredFields, parentProperty) {
        let schema = this.selectedService;
        for (let property in properties) {
            let propertyDefinition = properties[property];
            let name = parentProperty ? `${parentProperty}.${property}` : property;
            let isRequired = typeof (requiredFields) !== 'undefined' ? requiredFields.includes(property) : false;
            console.log(isRequired, name);
            if (propertyDefinition.type) {
                if (propertyDefinition.enum) {
                    result.push({
                        isEnum: true,
                        name: name,
                        possibleValues: propertyDefinition.enum,
                        isRequired
                    });
                }
                else {
                    result.push({
                        name: name,
                        description: propertyDefinition.description,
                        isRequired
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
                        isRequired
                    });
                }
                else {
                    if (oneOfDescription.type) {
                        if (oneOfDescription.type === 'object') {
                            result.push({
                                name: name,
                                isObject: true,
                                isRequired
                            });
                        }
                        if (oneOfDescription.type === 'boolean') {
                            result.push({
                                name: name,
                                isBoolean: true,
                                isRequired
                            });
                        }
                    }
                }
            }
        }
    }
    addEventListenersToSchemaFields() {
        let fields = document.getElementsByClassName('schema-field');
        for (let i = 0; i < fields.length; i++) {
            let field = fields[i];
            field.addEventListener('change', () => {
                this.renderGeneratedJson();
            });
        }
    }
    renderGeneratedJson() {
        let jsonElement = document.getElementById('generatedJson');
        let formElement = document.getElementById('jsonSchema');
        let form = new FormData(formElement);
        let json = {};
        form.forEach((value, key, parent) => {
            let complexKey = key.split('.');
            if (complexKey.length > 1) {
                if (typeof (json[complexKey[0]]) === 'undefined') {
                    json[complexKey[0]] = this.digDeeper(complexKey, 1, {}, value);
                }
                else {
                    json[complexKey[0]][complexKey[1]] = this.digDeeper(complexKey, 2, {}, value);
                }
            }
            else {
                json[key] = value.toString();
            }
        });
        templates_1.default.renderTemplate('json', jsonElement, { json: JSON.stringify(json, null, "\t") });
    }
    digDeeper(keys, index, json, value) {
        let currentKey = keys[index];
        if (keys.length - 1 > index) {
            index += 1;
            if (typeof (json[currentKey]) === 'undefined') {
                json[currentKey] = this.digDeeper(keys, index, {}, value);
            }
            else {
                index += 1;
                json[currentKey][keys[index]] = this.digDeeper(keys, index, {}, value);
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

},{"./http":2,"./templates":4}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class http {
    static get(url) {
        return this.getRequest(`${this.baseUrl}${url}`, true);
    }
    static getLocal(file) {
        return this.getRequest(`./${file}`, false);
    }
    static getRequest(url, isJson) {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.onload = (_) => {
                let target = _.target;
                if (target.status === 200) {
                    resolve(isJson ? JSON.parse(target.response) : target.response);
                }
                else {
                    reject(new Error(target.statusText));
                }
            };
            req.onerror = function () {
                reject(new Error('XMLHttpRequest Error: ' + this.statusText));
            };
            req.open('GET', `${url}`);
            req.send();
        });
    }
}
http.baseUrl = "http://localhost:7071/api/";
exports.default = http;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],4:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("./http"));
const mustache_1 = __importDefault(require("mustache"));
class templates {
    static renderTemplate(name, wrapper, model) {
        return http_1.default.getLocal(`templates/${name}.mst`).then(_ => {
            let rendered = mustache_1.default.render(_, model);
            wrapper.innerHTML = rendered;
        });
    }
}
exports.default = templates;

},{"./http":2,"mustache":5}],5:[function(require,module,exports){
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false Mustache: true*/

(function defineMustache (global, factory) {
  if (typeof exports === 'object' && exports && typeof exports.nodeName !== 'string') {
    factory(exports); // CommonJS
  } else if (typeof define === 'function' && define.amd) {
    define(['exports'], factory); // AMD
  } else {
    global.Mustache = {};
    factory(global.Mustache); // script, wsh, asp
  }
}(this, function mustacheFactory (mustache) {

  var objectToString = Object.prototype.toString;
  var isArray = Array.isArray || function isArrayPolyfill (object) {
    return objectToString.call(object) === '[object Array]';
  };

  function isFunction (object) {
    return typeof object === 'function';
  }

  /**
   * More correct typeof string handling array
   * which normally returns typeof 'object'
   */
  function typeStr (obj) {
    return isArray(obj) ? 'array' : typeof obj;
  }

  function escapeRegExp (string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
  }

  /**
   * Null safe way of checking whether or not an object,
   * including its prototype, has a given property
   */
  function hasProperty (obj, propName) {
    return obj != null && typeof obj === 'object' && (propName in obj);
  }

  /**
   * Safe way of detecting whether or not the given thing is a primitive and
   * whether it has the given property
   */
  function primitiveHasOwnProperty (primitive, propName) {  
    return (
      primitive != null
      && typeof primitive !== 'object'
      && primitive.hasOwnProperty
      && primitive.hasOwnProperty(propName)
    );
  }

  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  var regExpTest = RegExp.prototype.test;
  function testRegExp (re, string) {
    return regExpTest.call(re, string);
  }

  var nonSpaceRe = /\S/;
  function isWhitespace (string) {
    return !testRegExp(nonSpaceRe, string);
  }

  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  function escapeHtml (string) {
    return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap (s) {
      return entityMap[s];
    });
  }

  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var equalsRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!/;

  /**
   * Breaks up the given `template` string into a tree of tokens. If the `tags`
   * argument is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. [ "<%", "%>" ]). Of
   * course, the default is to use mustaches (i.e. mustache.tags).
   *
   * A token is an array with at least 4 elements. The first element is the
   * mustache symbol that was used inside the tag, e.g. "#" or "&". If the tag
   * did not contain a symbol (i.e. {{myValue}}) this element is "name". For
   * all text that appears outside a symbol this element is "text".
   *
   * The second element of a token is its "value". For mustache tags this is
   * whatever else was inside the tag besides the opening symbol. For text tokens
   * this is the text itself.
   *
   * The third and fourth elements of the token are the start and end indices,
   * respectively, of the token in the original template.
   *
   * Tokens that are the root node of a subtree contain two more elements: 1) an
   * array of tokens in the subtree and 2) the index in the original template at
   * which the closing tag for that section begins.
   */
  function parseTemplate (template, tags) {
    if (!template)
      return [];

    var sections = [];     // Stack to hold section tokens
    var tokens = [];       // Buffer to hold the tokens
    var spaces = [];       // Indices of whitespace tokens on the current line
    var hasTag = false;    // Is there a {{tag}} on the current line?
    var nonSpace = false;  // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    function stripSpace () {
      if (hasTag && !nonSpace) {
        while (spaces.length)
          delete tokens[spaces.pop()];
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    }

    var openingTagRe, closingTagRe, closingCurlyRe;
    function compileTags (tagsToCompile) {
      if (typeof tagsToCompile === 'string')
        tagsToCompile = tagsToCompile.split(spaceRe, 2);

      if (!isArray(tagsToCompile) || tagsToCompile.length !== 2)
        throw new Error('Invalid tags: ' + tagsToCompile);

      openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + '\\s*');
      closingTagRe = new RegExp('\\s*' + escapeRegExp(tagsToCompile[1]));
      closingCurlyRe = new RegExp('\\s*' + escapeRegExp('}' + tagsToCompile[1]));
    }

    compileTags(tags || mustache.tags);

    var scanner = new Scanner(template);

    var start, type, value, chr, token, openSection;
    while (!scanner.eos()) {
      start = scanner.pos;

      // Match any text between tags.
      value = scanner.scanUntil(openingTagRe);

      if (value) {
        for (var i = 0, valueLength = value.length; i < valueLength; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push([ 'text', chr, start, start + 1 ]);
          start += 1;

          // Check for whitespace on the current line.
          if (chr === '\n')
            stripSpace();
        }
      }

      // Match the opening tag.
      if (!scanner.scan(openingTagRe))
        break;

      hasTag = true;

      // Get the tag type.
      type = scanner.scan(tagRe) || 'name';
      scanner.scan(whiteRe);

      // Get the tag value.
      if (type === '=') {
        value = scanner.scanUntil(equalsRe);
        scanner.scan(equalsRe);
        scanner.scanUntil(closingTagRe);
      } else if (type === '{') {
        value = scanner.scanUntil(closingCurlyRe);
        scanner.scan(curlyRe);
        scanner.scanUntil(closingTagRe);
        type = '&';
      } else {
        value = scanner.scanUntil(closingTagRe);
      }

      // Match the closing tag.
      if (!scanner.scan(closingTagRe))
        throw new Error('Unclosed tag at ' + scanner.pos);

      token = [ type, value, start, scanner.pos ];
      tokens.push(token);

      if (type === '#' || type === '^') {
        sections.push(token);
      } else if (type === '/') {
        // Check section nesting.
        openSection = sections.pop();

        if (!openSection)
          throw new Error('Unopened section "' + value + '" at ' + start);

        if (openSection[1] !== value)
          throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
      } else if (type === 'name' || type === '{' || type === '&') {
        nonSpace = true;
      } else if (type === '=') {
        // Set the tags for the next time around.
        compileTags(value);
      }
    }

    // Make sure there are no open sections when we're done.
    openSection = sections.pop();

    if (openSection)
      throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);

    return nestTokens(squashTokens(tokens));
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens (tokens) {
    var squashedTokens = [];

    var token, lastToken;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      if (token) {
        if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
          lastToken[1] += token[1];
          lastToken[3] = token[3];
        } else {
          squashedTokens.push(token);
          lastToken = token;
        }
      }
    }

    return squashedTokens;
  }

  /**
   * Forms the given array of `tokens` into a nested tree structure where
   * tokens that represent a section have two additional items: 1) an array of
   * all tokens that appear in that section and 2) the index in the original
   * template that represents the end of that section.
   */
  function nestTokens (tokens) {
    var nestedTokens = [];
    var collector = nestedTokens;
    var sections = [];

    var token, section;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      switch (token[0]) {
        case '#':
        case '^':
          collector.push(token);
          sections.push(token);
          collector = token[4] = [];
          break;
        case '/':
          section = sections.pop();
          section[5] = token[2];
          collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
          break;
        default:
          collector.push(token);
      }
    }

    return nestedTokens;
  }

  /**
   * A simple string scanner that is used by the template parser to find
   * tokens in template strings.
   */
  function Scanner (string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function eos () {
    return this.tail === '';
  };

  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function scan (re) {
    var match = this.tail.match(re);

    if (!match || match.index !== 0)
      return '';

    var string = match[0];

    this.tail = this.tail.substring(string.length);
    this.pos += string.length;

    return string;
  };

  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function scanUntil (re) {
    var index = this.tail.search(re), match;

    switch (index) {
      case -1:
        match = this.tail;
        this.tail = '';
        break;
      case 0:
        match = '';
        break;
      default:
        match = this.tail.substring(0, index);
        this.tail = this.tail.substring(index);
    }

    this.pos += match.length;

    return match;
  };

  /**
   * Represents a rendering context by wrapping a view object and
   * maintaining a reference to the parent context.
   */
  function Context (view, parentContext) {
    this.view = view;
    this.cache = { '.': this.view };
    this.parent = parentContext;
  }

  /**
   * Creates a new context using the given view with this context
   * as the parent.
   */
  Context.prototype.push = function push (view) {
    return new Context(view, this);
  };

  /**
   * Returns the value of the given name in this context, traversing
   * up the context hierarchy if the value is absent in this context's view.
   */
  Context.prototype.lookup = function lookup (name) {
    var cache = this.cache;

    var value;
    if (cache.hasOwnProperty(name)) {
      value = cache[name];
    } else {
      var context = this, intermediateValue, names, index, lookupHit = false;

      while (context) {
        if (name.indexOf('.') > 0) {
          intermediateValue = context.view;
          names = name.split('.');
          index = 0;

          /**
           * Using the dot notion path in `name`, we descend through the
           * nested objects.
           *
           * To be certain that the lookup has been successful, we have to
           * check if the last object in the path actually has the property
           * we are looking for. We store the result in `lookupHit`.
           *
           * This is specially necessary for when the value has been set to
           * `undefined` and we want to avoid looking up parent contexts.
           *
           * In the case where dot notation is used, we consider the lookup
           * to be successful even if the last "object" in the path is
           * not actually an object but a primitive (e.g., a string, or an
           * integer), because it is sometimes useful to access a property
           * of an autoboxed primitive, such as the length of a string.
           **/
          while (intermediateValue != null && index < names.length) {
            if (index === names.length - 1)
              lookupHit = (
                hasProperty(intermediateValue, names[index]) 
                || primitiveHasOwnProperty(intermediateValue, names[index])
              );

            intermediateValue = intermediateValue[names[index++]];
          }
        } else {
          intermediateValue = context.view[name];

          /**
           * Only checking against `hasProperty`, which always returns `false` if
           * `context.view` is not an object. Deliberately omitting the check
           * against `primitiveHasOwnProperty` if dot notation is not used.
           *
           * Consider this example:
           * ```
           * Mustache.render("The length of a football field is {{#length}}{{length}}{{/length}}.", {length: "100 yards"})
           * ```
           *
           * If we were to check also against `primitiveHasOwnProperty`, as we do
           * in the dot notation case, then render call would return:
           *
           * "The length of a football field is 9."
           *
           * rather than the expected:
           *
           * "The length of a football field is 100 yards."
           **/
          lookupHit = hasProperty(context.view, name);
        }

        if (lookupHit) {
          value = intermediateValue;
          break;
        }

        context = context.parent;
      }

      cache[name] = value;
    }

    if (isFunction(value))
      value = value.call(this.view);

    return value;
  };

  /**
   * A Writer knows how to take a stream of tokens and render them to a
   * string, given a context. It also maintains a cache of templates to
   * avoid the need to parse the same template twice.
   */
  function Writer () {
    this.cache = {};
  }

  /**
   * Clears all cached templates in this writer.
   */
  Writer.prototype.clearCache = function clearCache () {
    this.cache = {};
  };

  /**
   * Parses and caches the given `template` according to the given `tags` or
   * `mustache.tags` if `tags` is omitted,  and returns the array of tokens
   * that is generated from the parse.
   */
  Writer.prototype.parse = function parse (template, tags) {
    var cache = this.cache;
    var cacheKey = template + ':' + (tags || mustache.tags).join(':');
    var tokens = cache[cacheKey];

    if (tokens == null)
      tokens = cache[cacheKey] = parseTemplate(template, tags);

    return tokens;
  };

  /**
   * High-level method that is used to render the given `template` with
   * the given `view`.
   *
   * The optional `partials` argument may be an object that contains the
   * names and templates of partials that are used in the template. It may
   * also be a function that is used to load partial templates on the fly
   * that takes a single argument: the name of the partial.
   *
   * If the optional `tags` argument is given here it must be an array with two
   * string values: the opening and closing tags used in the template (e.g.
   * [ "<%", "%>" ]). The default is to mustache.tags.
   */
  Writer.prototype.render = function render (template, view, partials, tags) {
    var tokens = this.parse(template, tags);
    var context = (view instanceof Context) ? view : new Context(view);
    return this.renderTokens(tokens, context, partials, template, tags);
  };

  /**
   * Low-level method that renders the given array of `tokens` using
   * the given `context` and `partials`.
   *
   * Note: The `originalTemplate` is only ever used to extract the portion
   * of the original template that was contained in a higher-order section.
   * If the template doesn't use higher-order sections, this argument may
   * be omitted.
   */
  Writer.prototype.renderTokens = function renderTokens (tokens, context, partials, originalTemplate, tags) {
    var buffer = '';

    var token, symbol, value;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      value = undefined;
      token = tokens[i];
      symbol = token[0];

      if (symbol === '#') value = this.renderSection(token, context, partials, originalTemplate);
      else if (symbol === '^') value = this.renderInverted(token, context, partials, originalTemplate);
      else if (symbol === '>') value = this.renderPartial(token, context, partials, tags);
      else if (symbol === '&') value = this.unescapedValue(token, context);
      else if (symbol === 'name') value = this.escapedValue(token, context);
      else if (symbol === 'text') value = this.rawValue(token);

      if (value !== undefined)
        buffer += value;
    }

    return buffer;
  };

  Writer.prototype.renderSection = function renderSection (token, context, partials, originalTemplate) {
    var self = this;
    var buffer = '';
    var value = context.lookup(token[1]);

    // This function is used to render an arbitrary template
    // in the current context by higher-order sections.
    function subRender (template) {
      return self.render(template, context, partials);
    }

    if (!value) return;

    if (isArray(value)) {
      for (var j = 0, valueLength = value.length; j < valueLength; ++j) {
        buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate);
      }
    } else if (typeof value === 'object' || typeof value === 'string' || typeof value === 'number') {
      buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate);
    } else if (isFunction(value)) {
      if (typeof originalTemplate !== 'string')
        throw new Error('Cannot use higher-order sections without the original template');

      // Extract the portion of the original template that the section contains.
      value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);

      if (value != null)
        buffer += value;
    } else {
      buffer += this.renderTokens(token[4], context, partials, originalTemplate);
    }
    return buffer;
  };

  Writer.prototype.renderInverted = function renderInverted (token, context, partials, originalTemplate) {
    var value = context.lookup(token[1]);

    // Use JavaScript's definition of falsy. Include empty arrays.
    // See https://github.com/janl/mustache.js/issues/186
    if (!value || (isArray(value) && value.length === 0))
      return this.renderTokens(token[4], context, partials, originalTemplate);
  };

  Writer.prototype.renderPartial = function renderPartial (token, context, partials, tags) {
    if (!partials) return;

    var value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
    if (value != null)
      return this.renderTokens(this.parse(value, tags), context, partials, value);
  };

  Writer.prototype.unescapedValue = function unescapedValue (token, context) {
    var value = context.lookup(token[1]);
    if (value != null)
      return value;
  };

  Writer.prototype.escapedValue = function escapedValue (token, context) {
    var value = context.lookup(token[1]);
    if (value != null)
      return mustache.escape(value);
  };

  Writer.prototype.rawValue = function rawValue (token) {
    return token[1];
  };

  mustache.name = 'mustache.js';
  mustache.version = '3.0.1';
  mustache.tags = [ '{{', '}}' ];

  // All high-level mustache.* functions use this writer.
  var defaultWriter = new Writer();

  /**
   * Clears all cached templates in the default writer.
   */
  mustache.clearCache = function clearCache () {
    return defaultWriter.clearCache();
  };

  /**
   * Parses and caches the given template in the default writer and returns the
   * array of tokens it contains. Doing this ahead of time avoids the need to
   * parse templates on the fly as they are rendered.
   */
  mustache.parse = function parse (template, tags) {
    return defaultWriter.parse(template, tags);
  };

  /**
   * Renders the `template` with the given `view` and `partials` using the
   * default writer. If the optional `tags` argument is given here it must be an
   * array with two string values: the opening and closing tags used in the
   * template (e.g. [ "<%", "%>" ]). The default is to mustache.tags.
   */
  mustache.render = function render (template, view, partials, tags) {
    if (typeof template !== 'string') {
      throw new TypeError('Invalid template! Template should be a "string" ' +
                          'but "' + typeStr(template) + '" was given as the first ' +
                          'argument for mustache#render(template, view, partials)');
    }

    return defaultWriter.render(template, view, partials, tags);
  };

  // This is here for backwards compatibility with 0.4.x.,
  /*eslint-disable */ // eslint wants camel cased function name
  mustache.to_html = function to_html (template, view, partials, send) {
    /*eslint-enable*/

    var result = mustache.render(template, view, partials);

    if (isFunction(send)) {
      send(result);
    } else {
      return result;
    }
  };

  // Export the escaping function so that the user may override it.
  // See https://github.com/janl/mustache.js/issues/244
  mustache.escape = escapeHtml;

  // Export these mainly for testing, but also for advanced usage.
  mustache.Scanner = Scanner;
  mustache.Context = Context;
  mustache.Writer = Writer;

  return mustache;
}));

},{}]},{},[1,2,3,4]);
